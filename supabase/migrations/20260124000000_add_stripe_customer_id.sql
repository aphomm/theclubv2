-- Add stripe_customer_id column to memberships table for Stripe integration
-- This column stores the Stripe customer ID for subscription management

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups by stripe_customer_id (used in webhook handlers)
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN memberships.stripe_customer_id IS 'Stripe customer ID for subscription billing';
