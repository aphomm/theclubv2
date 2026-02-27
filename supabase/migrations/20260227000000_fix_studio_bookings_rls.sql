-- Fix studio_bookings RLS: restrict viewing to own bookings only
-- Previously: all authenticated users could see all bookings (privacy violation)

DROP POLICY IF EXISTS "Users can view all bookings" ON studio_bookings;

CREATE POLICY "Users can view own bookings" ON studio_bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND status = 'admin'
    )
  );
