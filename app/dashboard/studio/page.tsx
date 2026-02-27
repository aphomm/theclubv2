'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight, Clock, Music, CheckCircle, X, AlertCircle, AlertTriangle, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

// Monthly studio hour allocation per tier
const TIER_STUDIO_HOURS: Record<string, number> = {
  'Creator': 10,
  'Professional': 15,
  'Executive': 20,
};
// Hours per booking slot
const HOURS_PER_BOOKING = 2;

// Helper to get current date in PST
const getPSTDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
};

// Helper to format date as YYYY-MM-DD in PST
const formatDatePST = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Format time range in 12-hour format
const formatTimeRange = (start: string, end: string) => {
  return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
};

// Generate Google Calendar "Add to Calendar" link (no auth needed)
const generateAddToCalendarLink = (booking: {
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}) => {
  const dateStr = booking.date.replace(/-/g, '');
  const startStr = `${dateStr}T${booking.startTime.replace(':', '')}00`;
  const endStr = `${dateStr}T${booking.endTime.replace(':', '')}00`;
  const title = encodeURIComponent(`Studio: ${booking.studioName} - ICWT`);
  const details = encodeURIComponent(booking.purpose || 'Recording session at WePlay Studios');
  const location = encodeURIComponent('WePlay Studios, Inglewood, CA');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&ctz=America/Los_Angeles`;
};

interface Booking {
  id: string;
  user_id: string;
  studio_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  purpose?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

type CancelState = {
  bookingId: string;
  booking: Booking;
  hoursUntil: number;
} | null;

const studios = [
  {
    id: 'studio-a',
    name: 'Studio A',
    description: 'Main recording studio with SSL console',
    image: '/images/studio-a.jpg',
    placeholder: 'from-amber-950/40 to-stone-900',
  },
  {
    id: 'studio-b',
    name: 'Studio B',
    description: 'Vocal booth and production suite',
    image: '/images/studio-b.jpg',
    placeholder: 'from-stone-800 to-stone-950',
  },
  {
    id: 'studio-c',
    name: 'Studio C',
    description: 'Podcast and content creation studio',
    image: '/images/studio-c.jpg',
    placeholder: 'from-stone-700/40 to-stone-900',
  },
];

const timeSlots: TimeSlot[] = [
  { start: '09:00', end: '11:00', available: true },
  { start: '11:00', end: '13:00', available: true },
  { start: '13:00', end: '15:00', available: true },
  { start: '15:00', end: '17:00', available: true },
  { start: '17:00', end: '19:00', available: true },
  { start: '19:00', end: '21:00', available: true },
];

export default function StudioBookingPage() {
  const [selectedStudio, setSelectedStudio] = useState(studios[0]);
  const [selectedDate, setSelectedDate] = useState<Date>(getPSTDate());
  const [currentMonth, setCurrentMonth] = useState(getPSTDate());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('Creator');
  const [cancelState, setCancelState] = useState<CancelState>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<Date | null>(null);

  // Calculate remaining hours for the month based on tier
  const monthlyStudioHours = TIER_STUDIO_HOURS[userTier] || 0;
  const hoursUsed = monthlyBookings.length * HOURS_PER_BOOKING;
  const hoursRemaining = Math.max(0, monthlyStudioHours - hoursUsed);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      // Get user's tier and suspension status
      const { data: profile } = await supabase
        .from('users')
        .select('tier, booking_suspended_until')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.tier) setUserTier(profile.tier);
      if (profile?.booking_suspended_until) {
        const suspDate = new Date(profile.booking_suspended_until);
        if (suspDate > new Date()) setSuspendedUntil(suspDate);
      }

      // Get dates in PST
      const pstNow = getPSTDate();
      const startOfViewMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfViewMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const startOfCurrentMonth = new Date(pstNow.getFullYear(), pstNow.getMonth(), 1);
      const endOfCurrentMonth = new Date(pstNow.getFullYear(), pstNow.getMonth() + 1, 0);

      const [allBookingsResult, userBookingsResult, monthlyBookingsResult] = await Promise.all([
        supabase
          .from('studio_bookings')
          .select('*')
          .eq('studio_name', selectedStudio.name)
          .gte('date', formatDatePST(startOfViewMonth))
          .lte('date', formatDatePST(endOfViewMonth))
          .not('status', 'in', '("cancelled","cancelled_late")'),

        supabase
          .from('studio_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', formatDatePST(pstNow))
          .not('status', 'in', '("cancelled","cancelled_late")')
          .order('date')
          .limit(5),

        supabase
          .from('studio_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', formatDatePST(startOfCurrentMonth))
          .lte('date', formatDatePST(endOfCurrentMonth))
          .not('status', 'in', '("cancelled","cancelled_late")'),
      ]);

      setBookings(allBookingsResult.data || []);
      setMyBookings(userBookingsResult.data || []);
      setMonthlyBookings(monthlyBookingsResult.data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [currentMonth, selectedStudio]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isSlotBooked = (slot: TimeSlot, date: Date) => {
    const dateStr = formatDatePST(date);
    return bookings.some(
      b => b.date === dateStr && b.start_time === slot.start && b.studio_name === selectedStudio.name
    );
  };

  const isMyBooking = (slot: TimeSlot, date: Date) => {
    const dateStr = formatDatePST(date);
    return bookings.some(
      b => b.date === dateStr && b.start_time === slot.start && b.user_id === userId
    );
  };

  const handleSlotClick = (slot: TimeSlot) => {
    // Sunday closed
    if (selectedDate.getDay() === 0) {
      toast.error('Studio is closed on Sundays');
      return;
    }

    if (isSlotBooked(slot, selectedDate)) {
      if (isMyBooking(slot, selectedDate)) {
        toast.info('This is your booking');
      } else {
        toast.error('This slot is already booked');
      }
      return;
    }

    const today = getPSTDate();
    today.setHours(0, 0, 0, 0);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    if (selectedDateStart < today) {
      toast.error('Cannot book past dates');
      return;
    }

    // Check suspension
    if (suspendedUntil && suspendedUntil > new Date()) {
      toast.error(`Bookings suspended until ${suspendedUntil.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' })}`);
      return;
    }

    if (hoursRemaining < HOURS_PER_BOOKING) {
      toast.error(`You've used all ${monthlyStudioHours} studio hours this month. Hours reset on the 1st.`);
      return;
    }

    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !userId) return;

    if (hoursRemaining < HOURS_PER_BOOKING) {
      toast.error(`You've used all ${monthlyStudioHours} studio hours this month.`);
      return;
    }

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bookingDate = formatDatePST(selectedDate);

    const { data: newBooking, error } = await supabase.from('studio_bookings').insert([
      {
        user_id: userId,
        studio_name: selectedStudio.name,
        date: bookingDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        status: 'confirmed',
        purpose: bookingPurpose || null,
      },
    ]).select().single();

    if (error) {
      console.error('Studio booking error:', error);
      toast.error(`Failed to book studio: ${error.message || error.code || 'Unknown error'}`);
    } else {
      toast.success('Studio booked successfully!');

      // Try to sync with Google Calendar (non-blocking)
      if (newBooking) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch('/api/google-calendar/sync-booking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: 'create', bookingId: newBooking.id }),
          }).catch(() => {}); // Non-blocking, failures are silent
        }
      }

      setShowBookingModal(false);
      setSelectedSlot(null);
      setBookingPurpose('');

      const pstNow = getPSTDate();
      const startOfViewMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfViewMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const startOfCurrentMonth = new Date(pstNow.getFullYear(), pstNow.getMonth(), 1);
      const endOfCurrentMonth = new Date(pstNow.getFullYear(), pstNow.getMonth() + 1, 0);

      const [allBookingsResult, userBookingsResult, monthlyBookingsResult] = await Promise.all([
        supabase
          .from('studio_bookings')
          .select('*')
          .eq('studio_name', selectedStudio.name)
          .gte('date', formatDatePST(startOfViewMonth))
          .lte('date', formatDatePST(endOfViewMonth))
          .not('status', 'in', '("cancelled","cancelled_late")'),

        supabase
          .from('studio_bookings')
          .select('*')
          .eq('user_id', userId)
          .gte('date', formatDatePST(pstNow))
          .not('status', 'in', '("cancelled","cancelled_late")')
          .order('date')
          .limit(5),

        supabase
          .from('studio_bookings')
          .select('*')
          .eq('user_id', userId)
          .gte('date', formatDatePST(startOfCurrentMonth))
          .lte('date', formatDatePST(endOfCurrentMonth))
          .not('status', 'in', '("cancelled","cancelled_late")'),
      ]);

      setBookings(allBookingsResult.data || []);
      setMyBookings(userBookingsResult.data || []);
      setMonthlyBookings(monthlyBookingsResult.data || []);
    }

    setIsSubmitting(false);
  };

  const initiateCancelBooking = (booking: Booking) => {
    // Calculate hours until booking
    const pstNow = getPSTDate();
    const bookingDateTime = new Date(`${booking.date}T${booking.start_time}:00`);
    const hoursUntil = (bookingDateTime.getTime() - pstNow.getTime()) / (1000 * 60 * 60);

    setCancelState({ bookingId: booking.id, booking, hoursUntil });
  };

  const confirmCancelBooking = async () => {
    if (!cancelState || !userId) return;
    setIsCancelling(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setIsCancelling(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch('/api/cancel-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ bookingId: cancelState.bookingId, userId }),
    });

    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || 'Failed to cancel booking');
    } else {
      if (result.hoursRestored) {
        toast.success('Booking cancelled — hours restored to your monthly allocation');
      } else if (result.strikeIssued) {
        toast.warning(
          `Booking cancelled (late notice). ${result.strikesTotal >= 3
            ? 'Bookings suspended until end of month.'
            : result.strikesTotal === 2
            ? 'Bookings suspended for 7 days.'
            : 'Warning: 2 more strikes may result in suspension.'
          }`
        );
        // Refresh suspension status
        const { data: profile } = await supabase
          .from('users')
          .select('booking_suspended_until')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.booking_suspended_until) {
          const suspDate = new Date(profile.booking_suspended_until);
          if (suspDate > new Date()) setSuspendedUntil(suspDate);
        }
      } else {
        toast.success('Booking cancelled — hours not restored (less than 24h notice)');
      }

      setMyBookings(prev => prev.filter(b => b.id !== cancelState.bookingId));
      setBookings(prev => prev.filter(b => b.id !== cancelState.bookingId));
      setMonthlyBookings(prev => prev.filter(b => b.id !== cancelState.bookingId));

      // Try to remove Google Calendar event (non-blocking)
      if (session?.access_token) {
        fetch('/api/google-calendar/sync-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'delete', bookingId: cancelState.bookingId }),
        }).catch(() => {});
      }
    }

    setCancelState(null);
    setIsCancelling(false);
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDatePST(date);
    return bookings.filter(b => b.date === dateStr);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-light mb-2">Studio Booking</h1>
        <p className="text-stone-400 font-light">
          Book recording time at WePlay Studios
        </p>
        {/* Monthly Allocation Banner */}
        <div className={`mt-4 p-4 border rounded-xl ${hoursRemaining > 0 ? 'border-amber-600/50 bg-amber-600/10' : 'border-red-600/50 bg-red-600/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hoursRemaining > 0 ? (
                <Clock className="w-5 h-5 text-amber-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-light">
                <span className={hoursRemaining > 0 ? 'text-amber-600' : 'text-red-500'}>{hoursRemaining}h</span>
                <span className="text-stone-400"> remaining this month</span>
                <span className="text-stone-500 text-sm ml-2">({hoursUsed}h of {monthlyStudioHours}h used)</span>
              </span>
            </div>
            <span className="text-xs text-stone-500">Resets on the 1st • All times in PST</span>
          </div>
        </div>

        {/* Suspension Banner */}
        {suspendedUntil && suspendedUntil > new Date() && (
          <div className="mt-2 p-4 border border-red-600/50 bg-red-600/10 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-light">
                <span className="text-red-500">Bookings suspended</span>
                <span className="text-stone-400"> until {suspendedUntil.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Studio Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {studios.map(studio => (
          <button
            key={studio.id}
            onClick={() => setSelectedStudio(studio)}
            className={`rounded-2xl border text-left transition-colors overflow-hidden ${
              selectedStudio.id === studio.id
                ? 'border-amber-600 bg-amber-600/10'
                : 'border-white/[0.08] hover:border-amber-600/60'
            }`}
          >
            {/* Studio photo / placeholder */}
            <div className="relative h-36 w-full overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${studio.placeholder} flex items-center justify-center`} aria-hidden="true">
                <Music className="w-10 h-10 text-amber-600/25" />
              </div>
              <img
                src={studio.image}
                alt={studio.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {selectedStudio.id === studio.id && (
                <div className="absolute inset-0 bg-amber-600/10 border-b border-amber-600/40" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Music className="w-4 h-4 text-amber-600" />
                <h3 className="font-light text-lg">{studio.name}</h3>
              </div>
              <p className="text-sm text-stone-400 font-light">{studio.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 text-stone-400 hover:text-amber-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-light">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 text-stone-400 hover:text-amber-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={`text-center text-xs font-light py-2 ${day === 'Sun' ? 'text-stone-600' : 'text-stone-500'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="aspect-square" />;
                }

                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const isSunday = day.getDay() === 0;
                const dayBookings = getBookingsForDate(day);
                const hasBookings = dayBookings.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => !isPast && !isSunday && setSelectedDate(day)}
                    disabled={isPast || isSunday}
                    className={`aspect-square border p-1 flex flex-col items-center justify-center transition-colors relative ${
                      isSelected && !isSunday
                        ? 'border-amber-600 bg-amber-600/20'
                        : isToday
                        ? 'border-amber-600/50'
                        : isSunday
                        ? 'border-white/5 bg-white/[0.02]'
                        : 'border-white/[0.08] hover:border-amber-600/40'
                    } ${isPast || isSunday ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`text-sm font-light ${isToday && !isSunday ? 'text-amber-600' : ''}`}>
                      {day.getDate()}
                    </span>
                    {hasBookings && !isSunday && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayBookings.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-amber-600 rounded-full" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="rounded-2xl border border-white/[0.08] p-6 mt-6">
            <h3 className="text-lg font-light mb-1">
              Available Times — {selectedDate.toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            {selectedDate.getDay() === 0 ? (
              <div className="flex items-center gap-2 py-8 text-stone-500">
                <AlertCircle className="w-4 h-4" />
                <span className="font-light text-sm">Studio is closed on Sundays</span>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 bg-white/[0.04] animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {timeSlots.map(slot => {
                  const booked = isSlotBooked(slot, selectedDate);
                  const mine = isMyBooking(slot, selectedDate);
                  const pstToday = getPSTDate();
                  pstToday.setHours(0, 0, 0, 0);
                  const selectedDateStart = new Date(selectedDate);
                  selectedDateStart.setHours(0, 0, 0, 0);
                  const isPastDate = selectedDateStart < pstToday;
                  const noHoursLeft = hoursRemaining < HOURS_PER_BOOKING && !mine;
                  const isSuspended = suspendedUntil ? suspendedUntil > new Date() : false;

                  return (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isPastDate || (noHoursLeft && !booked) || (isSuspended && !mine)}
                      className={`p-4 border rounded-xl transition-colors flex items-center justify-between ${
                        mine
                          ? 'border-green-600 bg-green-600/10 text-green-500'
                          : booked
                          ? 'border-white/[0.06] bg-white/[0.02] text-stone-500 cursor-not-allowed'
                          : isPastDate || noHoursLeft || isSuspended
                          ? 'border-white/[0.06] text-stone-600 cursor-not-allowed'
                          : 'border-white/[0.08] hover:border-amber-600 hover:bg-amber-600/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-light text-sm">
                          {formatTimeRange(slot.start, slot.end)}
                        </span>
                      </div>
                      {mine ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : booked ? (
                        <span className="text-xs">Booked</span>
                      ) : noHoursLeft ? (
                        <span className="text-xs text-red-400">No hours</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* My Bookings Sidebar */}
        <div>
          <div className="rounded-2xl border border-white/[0.08] p-6">
            <h3 className="text-lg font-light mb-6">Your Upcoming Bookings</h3>

            {myBookings.length === 0 ? (
              <p className="text-stone-400 font-light text-sm">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {myBookings.map(booking => (
                  <div key={booking.id} className="rounded-xl border border-white/[0.08] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-light">{booking.studio_name}</h4>
                        <p className="text-sm text-stone-400 font-light">
                          {new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', {
                            timeZone: 'America/Los_Angeles',
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => initiateCancelBooking(booking)}
                        className="text-stone-500 hover:text-red-500 transition-colors"
                        title="Cancel booking"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-light mb-2">
                      <Clock className="w-4 h-4" />
                      {formatTimeRange(booking.start_time, booking.end_time)}
                    </div>
                    {booking.purpose && (
                      <p className="text-xs text-stone-500 mt-1 font-light">{booking.purpose}</p>
                    )}
                    <a
                      href={generateAddToCalendarLink({
                        studioName: booking.studio_name,
                        date: booking.date,
                        startTime: booking.start_time,
                        endTime: booking.end_time,
                        purpose: booking.purpose,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition-colors mt-2"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      Add to Calendar
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Cancellation Policy Notice */}
            <div className="mt-6 pt-6 border-t border-white/[0.08]">
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                <span className="text-stone-400">Cancellation Policy:</span><br />
                24h+ notice: hours restored<br />
                6–24h notice: hours forfeited, no penalty<br />
                Under 6h: hours forfeited + strike<br />
                3 strikes = month suspension
              </p>
            </div>
          </div>

          {/* Studio Info */}
          <div className="rounded-2xl border border-white/[0.08] p-6 mt-6">
            <h3 className="text-lg font-light mb-4">Studio Hours (PST)</h3>
            <div className="space-y-2 text-sm font-light text-stone-400">
              <p>Monday – Friday: 9:00 AM – 9:00 PM</p>
              <p>Saturday: 10:00 AM – 8:00 PM</p>
              <p className="text-stone-600">Sunday: Closed</p>
            </div>
            <div className="border-t border-white/[0.08] mt-4 pt-4">
              <p className="text-xs text-stone-500 font-light">
                2-hour booking slots • {monthlyStudioHours}h/month allocation • Resets on the 1st
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancelState && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 rounded-2xl border border-white/[0.08] p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-light mb-1">Cancel Booking?</h2>
                <p className="text-stone-400 font-light text-sm">
                  {cancelState.booking.studio_name} • {new Date(cancelState.booking.date + 'T12:00:00').toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric'
                  })} • {formatTimeRange(cancelState.booking.start_time, cancelState.booking.end_time)}
                </p>
              </div>
            </div>

            <div className={`p-3 mb-6 text-sm font-light border rounded-xl ${
              cancelState.hoursUntil >= 24
                ? 'border-green-600/30 bg-green-600/5 text-green-400'
                : cancelState.hoursUntil >= 6
                ? 'border-amber-600/30 bg-amber-600/5 text-amber-400'
                : 'border-red-600/30 bg-red-600/5 text-red-400'
            }`}>
              {cancelState.hoursUntil >= 24
                ? 'Good news: Your studio hours will be fully restored.'
                : cancelState.hoursUntil >= 6
                ? `Warning: Less than 24 hours notice. Your ${HOURS_PER_BOOKING}h will not be restored this month.`
                : `Late cancellation: Less than 6 hours notice. Your ${HOURS_PER_BOOKING}h will not be restored and a strike will be issued.`}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelState(null)}
                className="flex-1 border border-white/10 py-2 text-sm font-light hover:bg-white/[0.06] transition-colors rounded-full"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="flex-1 bg-red-600 text-white py-2 text-sm font-light hover:bg-red-700 transition-colors disabled:opacity-50 rounded-full"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 rounded-2xl border border-white/[0.08] p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Confirm Booking</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                  setBookingPurpose('');
                }}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Studio</div>
                <div className="font-light">{selectedStudio.name}</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Date</div>
                <div className="font-light">
                  {selectedDate.toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Time (PST)</div>
                <div className="font-light">{formatTimeRange(selectedSlot.start, selectedSlot.end)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Hours</div>
                <div className="font-light">
                  This booking uses <span className="text-amber-600">{HOURS_PER_BOOKING}h</span> of your monthly allocation
                  <span className="text-stone-500 text-sm ml-2">({hoursRemaining - HOURS_PER_BOOKING}h remaining after)</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">
                  Purpose (optional)
                </label>
                <input
                  type="text"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="Recording session, mixing, etc."
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
              </div>
              <p className="text-xs text-stone-500 font-light">
                Cancellations must be made 24+ hours in advance to restore hours.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                  setBookingPurpose('');
                }}
                className="flex-1 border border-white/10 py-3 text-sm font-light hover:border-white/20 transition-colors rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
