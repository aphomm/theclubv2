'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, ChevronRight, Clock, Music, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

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

const studios = [
  { id: 'studio-a', name: 'Studio A', description: 'Main recording studio with SSL console' },
  { id: 'studio-b', name: 'Studio B', description: 'Vocal booth and production suite' },
  { id: 'studio-c', name: 'Studio C', description: 'Podcast and content creation studio' },
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

      // Fetch all bookings for selected studio and month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: allBookings } = await supabase
        .from('studio_bookings')
        .select('*')
        .eq('studio_name', selectedStudio.name)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .neq('status', 'cancelled');

      setBookings(allBookings || []);

      // Fetch user's upcoming bookings
      const { data: userBookings } = await supabase
        .from('studio_bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .neq('status', 'cancelled')
        .order('date')
        .limit(5);

      setMyBookings(userBookings || []);
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

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isSlotBooked = (slot: TimeSlot, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(
      b => b.date === dateStr && b.start_time === slot.start && b.studio_name === selectedStudio.name
    );
  };

  const isMyBooking = (slot: TimeSlot, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(
      b => b.date === dateStr && b.start_time === slot.start && b.user_id === userId
    );
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (isSlotBooked(slot, selectedDate)) {
      if (isMyBooking(slot, selectedDate)) {
        toast.info('This is your booking');
      } else {
        toast.error('This slot is already booked');
      }
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error('Cannot book past dates');
      return;
    }

    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !userId) return;

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('studio_bookings').insert([
      {
        user_id: userId,
        studio_name: selectedStudio.name,
        date: selectedDate.toISOString().split('T')[0],
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        status: 'confirmed',
        purpose: bookingPurpose || null,
      },
    ]);

    if (error) {
      toast.error('Failed to book studio');
    } else {
      toast.success('Studio booked successfully!');
      setShowBookingModal(false);
      setSelectedSlot(null);
      setBookingPurpose('');

      // Refresh bookings
      const { data: allBookings } = await supabase
        .from('studio_bookings')
        .select('*')
        .eq('studio_name', selectedStudio.name)
        .gte('date', new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0])
        .lte('date', new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0])
        .neq('status', 'cancelled');

      setBookings(allBookings || []);

      const { data: userBookings } = await supabase
        .from('studio_bookings')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date().toISOString().split('T')[0])
        .neq('status', 'cancelled')
        .order('date')
        .limit(5);

      setMyBookings(userBookings || []);
    }

    setIsSubmitting(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('studio_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      toast.success('Booking cancelled');
      setMyBookings(prev => prev.filter(b => b.id !== bookingId));
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
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
      </div>

      {/* Studio Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {studios.map(studio => (
          <button
            key={studio.id}
            onClick={() => setSelectedStudio(studio)}
            className={`border p-6 text-left transition-colors ${
              selectedStudio.id === studio.id
                ? 'border-amber-600 bg-amber-600/10'
                : 'border-stone-800 hover:border-amber-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-5 h-5 text-amber-600" />
              <h3 className="font-light text-lg">{studio.name}</h3>
            </div>
            <p className="text-sm text-stone-400 font-light">{studio.description}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="border border-stone-800 p-6">
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
                <div key={day} className="text-center text-xs text-stone-500 font-light py-2">
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
                const dayBookings = getBookingsForDate(day);
                const hasBookings = dayBookings.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => !isPast && setSelectedDate(day)}
                    disabled={isPast}
                    className={`aspect-square border p-1 flex flex-col items-center justify-center transition-colors relative ${
                      isSelected
                        ? 'border-amber-600 bg-amber-600/20'
                        : isToday
                        ? 'border-amber-600/50'
                        : 'border-stone-800 hover:border-stone-700'
                    } ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`text-sm font-light ${isToday ? 'text-amber-600' : ''}`}>
                      {day.getDate()}
                    </span>
                    {hasBookings && (
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
          <div className="border border-stone-800 p-6 mt-6">
            <h3 className="text-lg font-light mb-4">
              Available Times - {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 bg-stone-900 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSlots.map(slot => {
                  const booked = isSlotBooked(slot, selectedDate);
                  const mine = isMyBooking(slot, selectedDate);
                  const isPastDate = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isPastDate}
                      className={`p-4 border transition-colors flex items-center justify-between ${
                        mine
                          ? 'border-green-600 bg-green-600/10 text-green-500'
                          : booked
                          ? 'border-stone-700 bg-stone-900 text-stone-500 cursor-not-allowed'
                          : isPastDate
                          ? 'border-stone-800 text-stone-600 cursor-not-allowed'
                          : 'border-stone-800 hover:border-amber-600 hover:bg-amber-600/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-light text-sm">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      {mine ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : booked ? (
                        <span className="text-xs">Booked</span>
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
          <div className="border border-stone-800 p-6">
            <h3 className="text-lg font-light mb-6">Your Upcoming Bookings</h3>

            {myBookings.length === 0 ? (
              <p className="text-stone-400 font-light text-sm">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {myBookings.map(booking => (
                  <div key={booking.id} className="border border-stone-800 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-light">{booking.studio_name}</h4>
                        <p className="text-sm text-stone-400 font-light">
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-stone-500 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-light">
                      <Clock className="w-4 h-4" />
                      {booking.start_time} - {booking.end_time}
                    </div>
                    {booking.purpose && (
                      <p className="text-xs text-stone-500 mt-2 font-light">{booking.purpose}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Studio Info */}
          <div className="border border-stone-800 p-6 mt-6">
            <h3 className="text-lg font-light mb-4">Studio Hours</h3>
            <div className="space-y-2 text-sm font-light text-stone-400">
              <p>Monday - Friday: 9am - 9pm</p>
              <p>Saturday: 10am - 8pm</p>
              <p>Sunday: Closed</p>
            </div>
            <div className="border-t border-stone-800 mt-4 pt-4">
              <p className="text-xs text-stone-500 font-light">
                2-hour booking slots • Cancel up to 24h in advance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-md w-full">
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
              <div className="border border-stone-800 p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Studio</div>
                <div className="font-light">{selectedStudio.name}</div>
              </div>
              <div className="border border-stone-800 p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Date</div>
                <div className="font-light">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="border border-stone-800 p-4">
                <div className="text-sm text-stone-400 font-light mb-1">Time</div>
                <div className="font-light">{selectedSlot.start} - {selectedSlot.end}</div>
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
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                  setBookingPurpose('');
                }}
                className="flex-1 border border-stone-700 py-3 text-sm font-light hover:border-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={isSubmitting}
                className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50"
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
