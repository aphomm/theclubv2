-- Create storage bucket for resources
-- Note: This needs to be run in Supabase Dashboard or via Supabase CLI
-- as storage buckets cannot be created via regular SQL migrations

-- This is a placeholder file to document the storage setup needed:
--
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Create a new bucket called "resources"
-- 3. Set the bucket to public (for file access)
-- 4. Or keep private and use signed URLs
--
-- Storage Policies (add via Dashboard -> Storage -> Policies):
--
-- Allow authenticated users to view resources:
-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'resources');
--
-- Allow admins to upload resources:
-- CREATE POLICY "Admin upload access" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'resources' AND
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--       AND users.status = 'admin'
--     )
--   );
--
-- Allow admins to delete resources:
-- CREATE POLICY "Admin delete access" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (
--     bucket_id = 'resources' AND
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--       AND users.status = 'admin'
--     )
--   );

-- Add file_name column to resources table for tracking original filename
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_size INTEGER;

COMMENT ON COLUMN resources.file_name IS 'Original filename of uploaded file';
COMMENT ON COLUMN resources.file_size IS 'File size in bytes';
