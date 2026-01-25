-- Add signature fields to pool_investments table for e-sign functionality

ALTER TABLE pool_investments ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE pool_investments ADD COLUMN IF NOT EXISTS signature_agreed BOOLEAN DEFAULT FALSE;
ALTER TABLE pool_investments ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ;
ALTER TABLE pool_investments ADD COLUMN IF NOT EXISTS signature_ip TEXT;
ALTER TABLE pool_investments ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

COMMENT ON COLUMN pool_investments.signature_name IS 'Typed signature name from investor';
COMMENT ON COLUMN pool_investments.signature_agreed IS 'Whether investor agreed to terms';
COMMENT ON COLUMN pool_investments.signature_timestamp IS 'Timestamp when signature was captured';
COMMENT ON COLUMN pool_investments.signature_ip IS 'IP address at time of signature (for legal records)';
COMMENT ON COLUMN pool_investments.terms_version IS 'Version of investment terms that was agreed to';
