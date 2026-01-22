/*
  # Initial Schema for Premium Music Club Platform

  ## Tables Created
  
  1. **users** - Extended user profiles
     - `id` (uuid, references auth.users)
     - `email` (text, unique)
     - `name` (text)
     - `role` (text) - Member role/title
     - `tier` (text) - Creator, Professional, or Executive
     - `avatar_url` (text) - Profile photo URL
     - `bio` (text) - Member biography
     - `location` (text) - City, State
     - `join_date` (timestamptz) - When they joined
     - `status` (text) - active, suspended, cancelled
     - `created_at` (timestamptz)
     
  2. **memberships** - Subscription tracking
     - `id` (uuid, primary key)
     - `user_id` (uuid, references users)
     - `tier` (text) - Membership tier
     - `status` (text) - active, cancelled, past_due
     - `stripe_subscription_id` (text) - Stripe subscription ID
     - `start_date` (timestamptz)
     - `end_date` (timestamptz, nullable)
     - `created_at` (timestamptz)
     
  3. **events** - Club events and masterclasses
     - `id` (uuid, primary key)
     - `title` (text)
     - `description` (text)
     - `event_type` (text) - Masterclass, Networking, Studio Session, etc.
     - `date` (date)
     - `time` (time)
     - `location` (text)
     - `capacity` (integer)
     - `tier_access` (text[]) - Which tiers can attend
     - `instructor_id` (uuid, references users)
     - `instructor_name` (text)
     - `instructor_title` (text)
     - `instructor_bio` (text)
     - `agenda` (jsonb) - Event agenda items
     - `image_url` (text)
     - `created_at` (timestamptz)
     
  4. **event_rsvps** - Event attendance tracking
     - `id` (uuid, primary key)
     - `event_id` (uuid, references events)
     - `user_id` (uuid, references users)
     - `guest_count` (integer, default 1)
     - `dietary_restrictions` (text)
     - `status` (text) - confirmed, cancelled, waitlist
     - `created_at` (timestamptz)
     
  5. **pool_projects** - Collaborative projects
     - `id` (uuid, primary key)
     - `title` (text)
     - `description` (text)
     - `tagline` (text)
     - `creator_id` (uuid, references users)
     - `category` (text) - Album, Single, Video, Tour, etc.
     - `funding_goal` (numeric)
     - `funding_raised` (numeric, default 0)
     - `status` (text) - active, completed, pending
     - `milestones` (jsonb) - Project milestones
     - `equity_distribution` (jsonb)
     - `video_url` (text)
     - `expected_completion` (date)
     - `location` (text)
     - `created_at` (timestamptz)
     
  6. **pool_investments** - Investment tracking
     - `id` (uuid, primary key)
     - `project_id` (uuid, references pool_projects)
     - `user_id` (uuid, references users)
     - `amount` (numeric)
     - `contribution_type` (text) - cash, time, equipment, services
     - `contribution_details` (text)
     - `equity_percentage` (numeric)
     - `status` (text) - active, completed, pending
     - `created_at` (timestamptz)
     
  7. **studio_bookings** - Studio reservations
     - `id` (uuid, primary key)
     - `user_id` (uuid, references users)
     - `studio_name` (text) - Studio A, Studio B, etc.
     - `date` (date)
     - `start_time` (time)
     - `end_time` (time)
     - `status` (text) - confirmed, pending, cancelled
     - `purpose` (text)
     - `created_at` (timestamptz)
     
  8. **resources** - Resource library
     - `id` (uuid, primary key)
     - `title` (text)
     - `description` (text)
     - `category` (text)
     - `file_url` (text)
     - `format` (text) - PDF, Video, Template, etc.
     - `featured` (boolean, default false)
     - `created_at` (timestamptz)
     
  9. **messages** - Direct messaging
     - `id` (uuid, primary key)
     - `sender_id` (uuid, references users)
     - `recipient_id` (uuid, references users)
     - `content` (text)
     - `read` (boolean, default false)
     - `created_at` (timestamptz)
     
  10. **waitlist** - Pre-launch waitlist
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies created for authenticated users
  - Public access only for waitlist submissions and event viewing
*/

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text,
  tier text DEFAULT 'Creator',
  avatar_url text,
  bio text,
  location text,
  join_date timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL,
  status text DEFAULT 'active',
  stripe_subscription_id text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership" ON memberships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own membership" ON memberships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text,
  date date NOT NULL,
  time time NOT NULL,
  location text,
  capacity integer DEFAULT 50,
  tier_access text[] DEFAULT ARRAY['Creator', 'Professional', 'Executive'],
  instructor_id uuid REFERENCES users(id),
  instructor_name text,
  instructor_title text,
  instructor_bio text,
  agenda jsonb,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  guest_count integer DEFAULT 1,
  dietary_restrictions text,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event RSVPs" ON event_rsvps
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own RSVPs" ON event_rsvps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create pool_projects table
CREATE TABLE IF NOT EXISTS pool_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tagline text,
  creator_id uuid REFERENCES users(id) NOT NULL,
  category text,
  funding_goal numeric DEFAULT 0,
  funding_raised numeric DEFAULT 0,
  status text DEFAULT 'active',
  milestones jsonb,
  equity_distribution jsonb,
  video_url text,
  expected_completion date,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pool_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pool projects" ON pool_projects
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create pool projects" ON pool_projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own projects" ON pool_projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Create pool_investments table
CREATE TABLE IF NOT EXISTS pool_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES pool_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount numeric DEFAULT 0,
  contribution_type text DEFAULT 'cash',
  contribution_details text,
  equity_percentage numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pool_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pool investments" ON pool_investments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT creator_id FROM pool_projects WHERE id = project_id
  ));

CREATE POLICY "Users can create investments" ON pool_investments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create studio_bookings table
CREATE TABLE IF NOT EXISTS studio_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  studio_name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'confirmed',
  purpose text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE studio_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all bookings" ON studio_bookings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own bookings" ON studio_bookings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  file_url text,
  format text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view resources" ON resources
  FOR SELECT TO authenticated
  USING (true);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Create waitlist table (public access for submissions)
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" ON waitlist
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );