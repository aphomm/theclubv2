-- Fix user signup flow and tier assignment
-- The issue is that RLS blocks inserts when user doesn't have a session yet (during email confirmation)

-- 0. Add unique constraint on memberships.user_id for upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS memberships_user_id_unique ON memberships(user_id);

-- 1. Add INSERT policy for users table
-- This allows the signup flow to create user profiles
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- 2. Add INSERT policy for memberships table (similar issue)
CREATE POLICY "Users can insert during signup" ON memberships
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- 3. Add UPDATE policy for memberships (for webhook updates)
CREATE POLICY "Service can update memberships" ON memberships
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create a function to handle new user signup
-- This ensures tier is properly set and creates profile/membership atomically
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table if not exists
  INSERT INTO users (id, email, tier, status, join_date, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tier', 'Creator'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending_payment'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    tier = COALESCE(EXCLUDED.tier, users.tier);

  -- Insert into memberships table if not exists
  INSERT INTO memberships (user_id, tier, status, start_date, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'tier', 'Creator'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending_payment'),
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger on auth.users
-- Note: This requires the supabase_auth_admin role or must be run with elevated privileges
-- If this fails, run it manually in the Supabase SQL editor
DO $$
BEGIN
  -- Drop trigger if exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  -- Create trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create trigger on auth.users - run this manually in Supabase SQL editor with admin privileges';
END $$;
