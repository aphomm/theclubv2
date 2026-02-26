-- Migration: Add Google Calendar Integration Fields
-- Stores OAuth tokens for admin and GCal event IDs on bookings.

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry timestamptz;

ALTER TABLE studio_bookings ADD COLUMN IF NOT EXISTS google_event_id text;
