-- Add external RSVP URL field to events table
-- This allows events to link to external ticketing/RSVP platforms

ALTER TABLE events ADD COLUMN IF NOT EXISTS external_rsvp_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.external_rsvp_url IS 'Optional external URL for RSVP/ticketing (e.g., Eventbrite, Ticketmaster)';
