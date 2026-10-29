-- Lock down privilege fields on users/memberships and move Google OAuth tokens out of the
-- world-readable users table. Server routes use the service role and are unaffected.

-- 1. Signup trigger: never trust client metadata for status, only accept known tiers
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  requested_tier text := NEW.raw_user_meta_data->>'tier';
  safe_tier text := CASE
    WHEN requested_tier IN ('Creator', 'Professional', 'Executive') THEN requested_tier
    ELSE 'Creator'
  END;
BEGIN
  INSERT INTO public.users (id, email, tier, status, join_date, created_at)
  VALUES (NEW.id, NEW.email, safe_tier, 'pending_payment', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.memberships (user_id, tier, status, start_date, created_at)
  VALUES (NEW.id, safe_tier, 'pending_payment', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- 2. Members can edit their profile, but not status/tier/strikes/etc. Only the service role can.
CREATE OR REPLACE FUNCTION guard_users_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending_payment';
    IF NEW.tier IS NULL OR NEW.tier NOT IN ('Creator', 'Professional', 'Executive') THEN
      NEW.tier := 'Creator';
    END IF;
    NEW.late_cancellation_strikes := 0;
    NEW.booking_suspended_until := NULL;
    NEW.join_date := NOW();
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.email := OLD.email;
  NEW.status := OLD.status;
  NEW.tier := OLD.tier;
  NEW.late_cancellation_strikes := OLD.late_cancellation_strikes;
  NEW.booking_suspended_until := OLD.booking_suspended_until;
  NEW.join_date := OLD.join_date;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS guard_users_privileged_columns ON public.users;
CREATE TRIGGER guard_users_privileged_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION guard_users_privileged_columns();

-- 3. Same for memberships: status and Stripe ids are set by the webhook (service role) only
CREATE OR REPLACE FUNCTION guard_memberships_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending_payment';
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
    RETURN NEW;
  END IF;

  NEW.user_id := OLD.user_id;
  NEW.tier := OLD.tier;
  NEW.status := OLD.status;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS guard_memberships_privileged_columns ON public.memberships;
CREATE TRIGGER guard_memberships_privileged_columns
  BEFORE INSERT OR UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION guard_memberships_privileged_columns();

-- 4. No more anonymous inserts; rows must belong to the signed-in user
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert during signup" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.memberships;
CREATE POLICY "Users can insert own membership" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Google OAuth tokens: private table, service role only (RLS on, no policies)
CREATE TABLE IF NOT EXISTS public.calendar_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text NOT NULL,
  token_expiry timestamptz,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.calendar_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.calendar_credentials FROM anon, authenticated;

INSERT INTO public.calendar_credentials (user_id, access_token, refresh_token, token_expiry)
SELECT id, google_access_token, google_refresh_token, google_token_expiry
FROM public.users
WHERE google_refresh_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS google_access_token,
  DROP COLUMN IF EXISTS google_refresh_token,
  DROP COLUMN IF EXISTS google_token_expiry;
