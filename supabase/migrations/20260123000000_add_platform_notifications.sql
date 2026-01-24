-- Platform Notifications System
-- Allows admins to broadcast notifications to users based on their tier

-- Create platform_notifications table
CREATE TABLE IF NOT EXISTS platform_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('announcement', 'update', 'alert')),
  target_tiers text[] NOT NULL DEFAULT ARRAY['Creator', 'Professional', 'Executive'],
  action_url text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create platform_notification_reads table (tracks who's read what)
CREATE TABLE IF NOT EXISTS platform_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES platform_notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_platform_notifications_created_at ON platform_notifications(created_at DESC);
CREATE INDEX idx_platform_notifications_expires_at ON platform_notifications(expires_at);
CREATE INDEX idx_platform_notifications_target_tiers ON platform_notifications USING GIN(target_tiers);
CREATE INDEX idx_platform_notification_reads_user_id ON platform_notification_reads(user_id);
CREATE INDEX idx_platform_notification_reads_notification_id ON platform_notification_reads(notification_id);

-- Enable Row Level Security
ALTER TABLE platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_notifications

-- Users can view notifications targeting their tier (not expired)
CREATE POLICY "Users can view notifications for their tier" ON platform_notifications
  FOR SELECT TO authenticated
  USING (
    (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tier = ANY(target_tiers)
    )
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON platform_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications" ON platform_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- Admins can update notifications
CREATE POLICY "Admins can update notifications" ON platform_notifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON platform_notifications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- RLS Policies for platform_notification_reads

-- Users can view their own read records
CREATE POLICY "Users can view own read records" ON platform_notification_reads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own read records
CREATE POLICY "Users can insert own read records" ON platform_notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all read records (for analytics)
CREATE POLICY "Admins can view all read records" ON platform_notification_reads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );
