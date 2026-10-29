import { NextRequest, NextResponse } from 'next/server';
import { getAdminCalendarClient, createBookingEvent, deleteBookingEvent, findCalendarAdminId } from '@/lib/google-calendar';
import { createServiceClient, getRequestUser, isAdmin } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, action } = await request.json() as {
      bookingId: string;
      action: 'create' | 'delete';
    };

    if (!bookingId || (action !== 'create' && action !== 'delete')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: booking, error: bookingError } = await supabase
      .from('studio_bookings')
      .select('*, users(name, email)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only the booking's owner or an admin can sync it
    if (booking.user_id !== user.id && !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUserId = await findCalendarAdminId();
    if (!adminUserId) {
      return NextResponse.json({ success: false, message: 'Calendar not connected' });
    }

    if (action === 'create') {
      if (booking.google_event_id) {
        return NextResponse.json({ success: true, eventId: booking.google_event_id });
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

    if (!booking.google_event_id) {
      return NextResponse.json({ success: true, message: 'No calendar event to delete' });
    }

    const calendarClient = await getAdminCalendarClient(adminUserId);
    await deleteBookingEvent(calendarClient, booking.google_event_id);
    await supabase.from('studio_bookings').update({ google_event_id: null }).eq('id', bookingId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sync booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
