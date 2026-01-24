-- Add extended profile fields to users table
-- These fields are collected during signup for contact, directory, and Pool verification

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';

-- Also add timezone preference (defaults to PST)
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Los_Angeles';

-- Add comments for documentation
COMMENT ON COLUMN users.phone IS 'Contact phone number';
COMMENT ON COLUMN users.company IS 'Company/organization name';
COMMENT ON COLUMN users.address_line1 IS 'Street address line 1';
COMMENT ON COLUMN users.address_line2 IS 'Street address line 2 (apt, suite, etc.)';
COMMENT ON COLUMN users.city IS 'City';
COMMENT ON COLUMN users.state IS 'State/Province';
COMMENT ON COLUMN users.postal_code IS 'ZIP/Postal code';
COMMENT ON COLUMN users.country IS 'Country';
COMMENT ON COLUMN users.timezone IS 'User timezone preference for event times';
