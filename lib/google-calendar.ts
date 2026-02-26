/**
 * Google Calendar integration for ICWT studio booking system.
 *
 * Required Google Cloud setup:
 *  1. Create a project at https://console.cloud.google.com
 *  2. Enable "Google Calendar API" under APIs & Services > Library
 *  3. Create OAuth 2.0 Web Application credentials
 *  4. Add authorized redirect URI: http://localhost:3000/api/google-calendar/callback
 *     (add your production domain too when deploying)
 *
 * Required env vars:
 *  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_CALENDAR_ID
 */

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export interface BookingDetails {
  id: string;
  studioName: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24-hour, PST)
  endTime: string;    // HH:MM (24-hour, PST)
  purpose?: string;
  memberName?: string;
  memberEmail?: string;
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function getAdminCalendarClient(adminUserId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: adminUser, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', adminUserId)
    .single();

  if (error || !adminUser?.google_refresh_token) {
    throw new Error('Admin has not connected Google Calendar. Visit /admin to connect.');
  }

  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: adminUser.google_access_token,
    refresh_token: adminUser.google_refresh_token,
    expiry_date: adminUser.google_token_expiry
      ? new Date(adminUser.google_token_expiry).getTime()
      : undefined,
  });

  const isExpired =
    !adminUser.google_token_expiry ||
    new Date(adminUser.google_token_expiry).getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    const { credentials } = await auth.refreshAccessToken();
    auth.setCredentials(credentials);
    await supabase.from('users').update({
      google_access_token: credentials.access_token,
      google_token_expiry: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    }).eq('id', adminUserId);
  }

  return google.calendar({ version: 'v3', auth });
}

export async function createBookingEvent(
  calendarClient: ReturnType<typeof google.calendar>,
  booking: BookingDetails
): Promise<string> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const descParts = [];
  if (booking.memberName) descParts.push(`Member: ${booking.memberName}`);
  if (booking.memberEmail) descParts.push(`Email: ${booking.memberEmail}`);
  if (booking.purpose) descParts.push(`Purpose: ${booking.purpose}`);
  descParts.push(`Booking ID: ${booking.id}`);

  const event = await calendarClient.events.insert({
    calendarId,
    requestBody: {
      summary: `${booking.studioName} — ICWT Studio Booking`,
      description: descParts.join('\n'),
      start: { dateTime: `${booking.date}T${booking.startTime}:00`, timeZone: 'America/Los_Angeles' },
      end: { dateTime: `${booking.date}T${booking.endTime}:00`, timeZone: 'America/Los_Angeles' },
    },
  });

  if (!event.data.id) throw new Error('Google Calendar did not return an event ID');
  return event.data.id;
}

export async function deleteBookingEvent(
  calendarClient: ReturnType<typeof google.calendar>,
  eventId: string
): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  await calendarClient.events.delete({ calendarId, eventId });
}

export function generateAddToCalendarLink(booking: BookingDetails): string {
  const pstOffsetMs = 8 * 60 * 60 * 1000;
  const startLocal = new Date(`${booking.date}T${booking.startTime}:00`);
  const endLocal = new Date(`${booking.date}T${booking.endTime}:00`);
  const startUTC = new Date(startLocal.getTime() + pstOffsetMs);
  const endUTC = new Date(endLocal.getTime() + pstOffsetMs);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');

  const title = encodeURIComponent(`${booking.studioName} — ICWT Studio Session`);
  const details = encodeURIComponent(booking.purpose ? `Purpose: ${booking.purpose}` : 'ICWT Studio Booking');
  const location = encodeURIComponent('WePlay Studios, Inglewood, CA');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startUTC)}/${fmt(endUTC)}&details=${details}&location=${location}`;
}
