-- Add admin policies for resources table
-- Allows admins to create, update, and delete resources

CREATE POLICY "Admins can manage resources" ON resources
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );
