-- Add admin policy for pool_projects table
-- Allows admins to update project status (approve/reject)

CREATE POLICY "Admins can manage pool projects" ON pool_projects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'admin'
    )
  );

-- Add updated_at column that the admin page references
ALTER TABLE pool_projects
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
