-- Migration: Add Cancellation Policy Fields
-- Adds late cancellation tracking and booking suspension to support
-- the 24hr cancellation policy with strike system.

ALTER TABLE studio_bookings
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS late_cancellation_strikes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_suspended_until timestamptz;
