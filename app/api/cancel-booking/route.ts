import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { bookingId, userId } = await req.json();

  if (!bookingId || !userId) {
    return NextResponse.json({ success: false, message: 'Missing bookingId or userId' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Verify the authenticated user matches the userId in the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || user.id !== userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from('studio_bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
  }

  if (booking.status === 'cancelled' || booking.status === 'cancelled_late') {
    return NextResponse.json({ success: false, message: 'Booking already cancelled' }, { status: 400 });
  }

  // Compute hours until booking start in PST
  const nowPST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const bookingStart = new Date(`${booking.date}T${booking.start_time}`);
  const hoursUntil = (bookingStart.getTime() - nowPST.getTime()) / (1000 * 60 * 60);

  let newStatus: string;
  let hoursRestored = false;
  let strikeIssued = false;
  let strikeCount = 0;
  let suspendedUntil: string | null = null;

  if (hoursUntil >= 24) {
    newStatus = 'cancelled';
    hoursRestored = true;
  } else if (hoursUntil >= 6) {
    newStatus = 'cancelled_late';
    hoursRestored = false;
  } else {
    newStatus = 'cancelled_late';
    hoursRestored = false;
    strikeIssued = true;
  }

  const { error: updateBookingError } = await supabase
    .from('studio_bookings')
    .update({ status: newStatus, cancelled_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (updateBookingError) {
    return NextResponse.json({ success: false, message: 'Failed to cancel booking' }, { status: 500 });
  }

  if (strikeIssued) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('late_cancellation_strikes')
      .eq('id', userId)
      .maybeSingle();

    const currentStrikes = (userRecord?.late_cancellation_strikes ?? 0) + 1;
    strikeCount = currentStrikes;

    const nowForSuspension = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    let bookingSuspendedUntil: string | null = null;

    if (currentStrikes === 2) {
      const suspendUntil = new Date(nowForSuspension.getTime() + 7 * 24 * 60 * 60 * 1000);
      bookingSuspendedUntil = suspendUntil.toISOString();
      suspendedUntil = suspendUntil.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'long', day: 'numeric', year: 'numeric',
      });
    } else if (currentStrikes >= 3) {
      const endOfMonth = new Date(nowForSuspension.getFullYear(), nowForSuspension.getMonth() + 1, 0, 23, 59, 59);
      bookingSuspendedUntil = endOfMonth.toISOString();
      suspendedUntil = endOfMonth.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'long', day: 'numeric', year: 'numeric',
      });
    }

    await supabase
      .from('users')
      .update({
        late_cancellation_strikes: currentStrikes,
        ...(bookingSuspendedUntil ? { booking_suspended_until: bookingSuspendedUntil } : {}),
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true, hoursRestored, strike: true, strikeCount, suspendedUntil,
      message: suspendedUntil
        ? `Late cancellation recorded. Strike ${strikeCount}/3. Booking suspended until ${suspendedUntil}.`
        : `Late cancellation recorded. Strike ${strikeCount}/3.`,
    });
  }

  return NextResponse.json({
    success: true, hoursRestored, strike: false, strikeCount: 0, suspendedUntil: null,
    message: hoursRestored
      ? 'Booking cancelled — hours restored to your allocation'
      : 'Booking cancelled — hours forfeited (late cancellation)',
  });
}
