-- Round 3 hardening: member privacy, rules enforced in the database instead of the browser,
-- flood limits, a shared rate limiter for API routes, and admin-only file storage writes.

-- Helpers ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(auth.role(), '') = 'service_role' OR current_user IN ('postgres', 'supabase_admin');
$$;

-- 1. Member privacy: full rows are private; everyone else sees a public profile view --------
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile, admins all" ON public.users;
CREATE POLICY "Users can view own profile, admins all" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE OR REPLACE VIEW public.member_profiles AS
  SELECT id, name, role, tier, avatar_url, bio, location, join_date, status
  FROM public.users;
REVOKE ALL ON public.member_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.member_profiles TO authenticated;

-- 2. Shared rate limiter for API routes (service role only) --------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hits integer;
BEGIN
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
    reset_at = CASE WHEN rate_limits.reset_at < now()
      THEN now() + make_interval(secs => p_window_seconds)
      ELSE rate_limits.reset_at END
  RETURNING count INTO hits;

  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day';
  END IF;

  RETURN hits <= p_max;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

-- 3. Studio bookings: rules live in the database; members insert, server cancels ----------
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.studio_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.studio_bookings;
CREATE POLICY "Users can create own bookings" ON public.studio_bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.studio_bookings;
CREATE POLICY "Admins can manage bookings" ON public.studio_bookings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Taken slots without who booked them, so members can see real availability
DROP VIEW IF EXISTS public.studio_booked_slots;
CREATE VIEW public.studio_booked_slots AS
  SELECT
    CASE WHEN user_id = auth.uid() THEN id END AS id,
    studio_name, date, start_time, end_time,
    (user_id = auth.uid()) AS is_mine
  FROM public.studio_bookings
  WHERE status NOT IN ('cancelled', 'cancelled_late');
REVOKE ALL ON public.studio_booked_slots FROM PUBLIC, anon;
GRANT SELECT ON public.studio_booked_slots TO authenticated;

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS studio_bookings_no_double_booking
    ON public.studio_bookings (studio_name, date, start_time)
    WHERE status NOT IN ('cancelled', 'cancelled_late');
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Existing double bookings found; double-booking index skipped. Clean them up and re-run this block.';
END $$;

CREATE OR REPLACE FUNCTION public.enforce_studio_booking_rules()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  member record;
  today date := (now() AT TIME ZONE 'America/Los_Angeles')::date;
  allowed_hours integer;
  used_hours integer;
BEGIN
  IF public.is_privileged() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT status, tier, booking_suspended_until INTO member FROM users WHERE id = auth.uid();

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only book for yourself.';
  END IF;
  IF member.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Your membership is not active.';
  END IF;
  IF member.booking_suspended_until IS NOT NULL AND member.booking_suspended_until > now() THEN
    RAISE EXCEPTION 'Studio booking is suspended until %.',
      to_char(member.booking_suspended_until AT TIME ZONE 'America/Los_Angeles', 'FMMonth FMDD, YYYY');
  END IF;
  IF NEW.date < today THEN
    RAISE EXCEPTION 'You cannot book a date in the past.';
  END IF;
  IF extract(dow FROM NEW.date) = 0 THEN
    RAISE EXCEPTION 'The studio is closed on Sundays.';
  END IF;
  IF NEW.studio_name NOT IN ('Studio A', 'Studio B', 'Studio C') THEN
    RAISE EXCEPTION 'Unknown studio.';
  END IF;
  IF NEW.start_time NOT IN ('09:00', '11:00', '13:00', '15:00', '17:00', '19:00')
     OR NEW.end_time <> NEW.start_time + interval '2 hours' THEN
    RAISE EXCEPTION 'Invalid time slot.';
  END IF;

  allowed_hours := CASE member.tier
    WHEN 'Creator' THEN 10
    WHEN 'Professional' THEN 15
    WHEN 'Executive' THEN 20
    ELSE 0
  END;
  SELECT count(*) * 2 INTO used_hours
  FROM studio_bookings
  WHERE user_id = NEW.user_id
    AND date_trunc('month', date) = date_trunc('month', NEW.date::timestamp)
    AND status NOT IN ('cancelled', 'cancelled_late');
  IF used_hours + 2 > allowed_hours THEN
    RAISE EXCEPTION 'You have used all % studio hours for that month.', allowed_hours;
  END IF;

  NEW.status := 'confirmed';
  NEW.cancelled_at := NULL;
  NEW.google_event_id := NULL;
  NEW.purpose := left(NEW.purpose, 500);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_studio_booking_rules ON public.studio_bookings;
CREATE TRIGGER enforce_studio_booking_rules
  BEFORE INSERT ON public.studio_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_studio_booking_rules();

-- 4. Event RSVPs: insert/withdraw only, tier access and guest limits enforced ---------------
DROP POLICY IF EXISTS "Users can manage own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can create own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can delete own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can create own RSVPs" ON public.event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVPs" ON public.event_rsvps
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage RSVPs" ON public.event_rsvps;
CREATE POLICY "Admins can manage RSVPs" ON public.event_rsvps
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.enforce_rsvp_rules()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  member record;
  ev record;
BEGIN
  IF public.is_privileged() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT status, tier INTO member FROM users WHERE id = auth.uid();
  SELECT date, tier_access INTO ev FROM events WHERE id = NEW.event_id;

  IF member.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Your membership is not active.';
  END IF;
  IF ev.date IS NULL OR ev.date < (now() AT TIME ZONE 'America/Los_Angeles')::date THEN
    RAISE EXCEPTION 'This event has already happened.';
  END IF;
  IF ev.tier_access IS NOT NULL AND NOT (member.tier = ANY (ev.tier_access)) THEN
    RAISE EXCEPTION 'This event is not open to your membership tier.';
  END IF;
  IF NEW.guest_count IS NULL OR NEW.guest_count < 1 OR NEW.guest_count > 5 THEN
    RAISE EXCEPTION 'Guest count must be between 1 and 5.';
  END IF;

  NEW.status := 'confirmed';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_rsvp_rules ON public.event_rsvps;
CREATE TRIGGER enforce_rsvp_rules
  BEFORE INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rsvp_rules();

DO $$
BEGIN
  ALTER FUNCTION public.check_event_capacity() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 5. The Pool: approval status and funding totals belong to admins ------------------------
CREATE OR REPLACE FUNCTION public.guard_pool_projects()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_privileged() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.funding_raised := 0;
    NEW.creator_id := auth.uid();
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.creator_id := OLD.creator_id;
  NEW.status := OLD.status;
  NEW.funding_raised := OLD.funding_raised;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_pool_projects ON public.pool_projects;
CREATE TRIGGER guard_pool_projects
  BEFORE INSERT OR UPDATE ON public.pool_projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_pool_projects();

DO $$
BEGIN
  ALTER TABLE public.pool_projects
    ADD CONSTRAINT pool_projects_video_url_http CHECK (video_url IS NULL OR video_url ~* '^https?://') NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.guard_pool_investments()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_privileged() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.amount IS NULL OR NEW.amount < 0 THEN
      RAISE EXCEPTION 'Invalid contribution amount.';
    END IF;
    IF NEW.equity_percentage IS NULL OR NEW.equity_percentage < 0 OR NEW.equity_percentage > 100 THEN
      RAISE EXCEPTION 'Invalid equity percentage.';
    END IF;
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.signature_timestamp := now();
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_pool_investments ON public.pool_investments;
CREATE TRIGGER guard_pool_investments
  BEFORE INSERT OR UPDATE ON public.pool_investments
  FOR EACH ROW EXECUTE FUNCTION public.guard_pool_investments();

-- 6. Messages: no rewriting received messages, size and flood limits ------------------------
CREATE OR REPLACE FUNCTION public.guard_messages()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  recent integer;
BEGIN
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'You can only send messages as yourself.';
    END IF;
    IF NEW.recipient_id = NEW.sender_id THEN
      RAISE EXCEPTION 'You cannot message yourself.';
    END IF;
    IF NEW.content IS NULL OR length(btrim(NEW.content)) = 0 OR length(NEW.content) > 5000 THEN
      RAISE EXCEPTION 'Messages must be between 1 and 5,000 characters.';
    END IF;
    SELECT count(*) INTO recent
    FROM messages
    WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 minute';
    IF recent >= 20 THEN
      RAISE EXCEPTION 'You are sending messages too quickly. Wait a minute and try again.';
    END IF;
    NEW.read := false;
    NEW.created_at := now();
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.content := OLD.content;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_messages ON public.messages;
CREATE TRIGGER guard_messages
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_messages();

-- 7. Waitlist: writes go through the rate-limited /api/waitlist route only -----------------
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DO $$
BEGIN
  ALTER TABLE public.waitlist
    ADD CONSTRAINT waitlist_email_format CHECK (length(email) <= 254 AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$') NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Resource files: members read, only admins write ---------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') ILIKE '%resources%' OR coalesce(with_check, '') ILIKE '%resources%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;

  CREATE POLICY "Members can read resource files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'resources');
  CREATE POLICY "Admins can upload resource files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'resources' AND public.is_admin());
  CREATE POLICY "Admins can update resource files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'resources' AND public.is_admin())
    WITH CHECK (bucket_id = 'resources' AND public.is_admin());
  CREATE POLICY "Admins can delete resource files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'resources' AND public.is_admin());
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Could not update storage policies (insufficient privilege); the rest of this migration applied.';
END $$;
