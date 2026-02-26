'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, MapPin, Users, Heart, Share2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  event_type: string;
  capacity: number;
  instructor_name?: string;
  instructor_title?: string;
  instructor_bio?: string;
  agenda?: any[];
  image_url?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [isRsvped, setIsRsvped] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (eventData) {
        setEvent(eventData);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Fetch current RSVP count to compute remaining spots
        const { data: currentRsvps } = await supabase
          .from('event_rsvps')
          .select('guest_count')
          .eq('event_id', params.id);
        const totalBooked = currentRsvps?.reduce((sum, r) => sum + (r.guest_count || 1), 0) || 0;
        setRemainingSpots(Math.max(0, eventData.capacity - totalBooked));

        if (user) {
          const { data: rsvp } = await supabase
            .from('event_rsvps')
            .select('*')
            .eq('event_id', params.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (rsvp) {
            setIsRsvped(true);
            setGuestCount(rsvp.guest_count);
          }
        }
      }

      setIsLoading(false);
    };

    fetchEvent();
  }, [params.id]);

  const handleRsvp = async () => {
    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (isRsvped) {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', params.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Error cancelling RSVP');
      } else {
        toast.success('RSVP cancelled');
        setIsRsvped(false);
      }
    } else {
      // First check current capacity
      const { data: currentRsvps } = await supabase
        .from('event_rsvps')
        .select('guest_count')
        .eq('event_id', params.id);

      const totalGuests = (currentRsvps?.reduce((sum, rsvp) => sum + rsvp.guest_count, 0) || 0) + guestCount;
      
      if (totalGuests > (event?.capacity || 0)) {
        toast.error(`Cannot RSVP: Only ${(event?.capacity || 0) - (currentRsvps?.reduce((sum, rsvp) => sum + rsvp.guest_count, 0) || 0)} spots remaining`);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('event_rsvps').insert([
        {
          event_id: params.id,
          user_id: user.id,
          guest_count: guestCount,
        },
      ]);

      if (error) {
        toast.error('Error confirming RSVP');
      } else {
        toast.success('RSVP confirmed!');
        setIsRsvped(true);
      }
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="h-96 bg-white/[0.06] animate-pulse rounded-2xl border border-white/[0.08]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl">
        <Link href="/dashboard/events">
          <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
        </Link>
        <p className="text-stone-400 font-light">Event not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/events">
        <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide rounded-full">
            {event.event_type}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-stone-400 hover:text-red-500 transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <button className="text-stone-400 hover:text-amber-600 transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <h1 className="text-4xl font-light mb-6">{event.title}</h1>

      {/* Event Flyer */}
      <div className="flex justify-center mb-10">
        {event.image_url ? (
          <div className="w-64 md:w-80 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
            <img
              src={event.image_url}
              alt={`${event.title} flyer`}
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="w-64 md:w-80 h-96 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-stone-900 to-stone-950 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border border-amber-600/20 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-amber-600/40" />
            </div>
            <div className="text-center">
              <p className="text-stone-500 font-light">Event Flyer</p>
              <p className="text-stone-600 font-light text-sm">Coming Soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12 py-8 border-y border-white/[0.08]">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-amber-600" />
          <div>
            <div className="text-sm text-stone-400 font-light">Date & Time</div>
            <div className="font-light">
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="text-sm text-stone-400 font-light">{event.time}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MapPin className="w-6 h-6 text-amber-600" />
          <div>
            <div className="text-sm text-stone-400 font-light">Location</div>
            <div className="font-light">{event.location}</div>
          </div>
        </div>
      </div>

      {/* Instructor */}
      {event.instructor_name && (
        <div className="rounded-2xl border border-white/[0.08] p-8 mb-12">
          <h3 className="text-lg font-light mb-4">Hosted By</h3>
          <div>
            <h4 className="text-xl font-light">{event.instructor_name}</h4>
            <p className="text-amber-600 text-sm font-light mb-3">{event.instructor_title}</p>
            <p className="text-stone-400 font-light leading-relaxed">{event.instructor_bio}</p>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-12">
        <h2 className="text-2xl font-light mb-4">About this event</h2>
        <p className="text-stone-300 font-light leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Agenda */}
      {event.agenda && event.agenda.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-light mb-6">Agenda</h2>
          <div className="space-y-4">
            {event.agenda.map((item: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-white/[0.08] p-6">
                <div className="flex items-start gap-4">
                  <div className="text-lg font-light text-amber-600 w-20">{item.time}</div>
                  <div>
                    <h4 className="font-light text-lg">{item.title}</h4>
                    <p className="text-stone-400 font-light text-sm">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Section */}
      <div className="rounded-2xl border border-amber-600/30 bg-gradient-to-br from-amber-600/5 to-transparent p-8 sticky bottom-6">
        {isRsvped ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <div className="font-light">You're Going!</div>
                <div className="text-sm text-stone-400 font-light">
                  {guestCount} guest{guestCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <button
              onClick={handleRsvp}
              disabled={isSubmitting}
              className="border border-red-500 text-red-500 px-8 py-3 text-sm font-light hover:bg-red-500 hover:text-stone-950 transition-colors disabled:opacity-50 rounded-full"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel RSVP'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-light">Spots Available</div>
                <div className={`text-lg font-light ${remainingSpots === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                  {remainingSpots === null ? `${event.capacity} spots` : remainingSpots === 0 ? 'Event Full' : `${remainingSpots} of ${event.capacity} spots`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-light">Guests:</label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                  className="bg-white/[0.06] border border-white/10 px-3 py-2 text-sm font-light rounded-lg"
                >
                  {[1, 2, 3, 4, 5].map(i => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleRsvp}
              disabled={isSubmitting || remainingSpots === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-4 text-sm font-light tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
            >
              {isSubmitting ? 'Confirming...' : remainingSpots === 0 ? 'Event Full' : 'Confirm RSVP'}
            </button>
            <p className="text-xs text-stone-400 font-light mt-3 text-center">
              Free for members • Confirmation sent to your email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
