import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminCalendarClient, createBookingEvent, deleteBookingEvent } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, action, adminUserId } = await request.json() as {
      bookingId: string;
      action: 'create' | 'delete';
      adminUserId: string;
    };

    if (!bookingId || !action || !adminUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'create') {
      const { data: booking, error: bookingError } = await supabase
        .from('studio_bookings')
        .select('*, users(name, email)')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const calendarClient = await getAdminCalendarClient(adminUserId);
      const eventId = await createBookingEvent(calendarClient, {
        id: booking.id,
        studioName: booking.studio_name,
        date: booking.date,
        startTime: booking.start_time.slice(0, 5),
        endTime: booking.end_time.slice(0, 5),
        purpose: booking.purpose,
        memberName: (booking.users as any)?.name,
        memberEmail: (booking.users as any)?.email,
      });

      await supabase.from('studio_bookings').update({ google_event_id: eventId }).eq('id', bookingId);
      return NextResponse.json({ success: true, eventId });
    }

    if (action === 'delete') {
      const { data: booking } = await supabase
        .from('studio_bookings')
        .select('google_event_id')
        .eq('id', bookingId)
        .single();

      if (!booking?.google_event_id) {
        return NextResponse.json({ success: true, message: 'No calendar event to delete' });
      }

      const calendarClient = await getAdminCalendarClient(adminUserId);
      await deleteBookingEvent(calendarClient, booking.google_event_id);
      await supabase.from('studio_bookings').update({ google_event_id: null }).eq('id', bookingId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Sync booking error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
