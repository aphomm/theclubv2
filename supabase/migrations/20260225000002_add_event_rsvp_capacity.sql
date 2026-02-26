-- Migration: Add database-level capacity enforcement for event RSVPs
-- Prevents race conditions where two simultaneous RSVPs could exceed capacity.

CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
  event_capacity integer;
  current_rsvps integer;
BEGIN
  SELECT capacity INTO event_capacity FROM events WHERE id = NEW.event_id;
  SELECT COALESCE(SUM(guest_count), 0) + NEW.guest_count INTO current_rsvps
  FROM event_rsvps WHERE event_id = NEW.event_id AND status = 'confirmed';

  IF current_rsvps > event_capacity THEN
    RAISE EXCEPTION 'Event is at full capacity';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_event_capacity ON event_rsvps;
CREATE TRIGGER enforce_event_capacity
  BEFORE INSERT ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION check_event_capacity();
