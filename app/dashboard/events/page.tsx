'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  external_rsvp_url?: string;
  image_url?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Use PST date for comparison (consistent with other pages)
      const today = formatDatePST(getPSTDate());

      let query = supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date');

      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }

      const { data } = await query;
      setEvents(data || []);
      setIsLoading(false);
    };

    fetchEvents();
  }, [filter]);

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Upcoming Events</h1>
        <p className="text-stone-400 font-light">Connect, learn, and collaborate with members</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-10 border-b border-white/10 pb-6">
        {['all', 'Masterclass', 'Networking', 'Studio Session'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-light transition-colors ${
              filter === f
                ? 'text-amber-600 border-b-2 border-amber-600 pb-4'
                : 'text-stone-400 hover:text-amber-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/[0.08] p-8">
              <div className="h-6 bg-white/[0.06] rounded-full w-1/4 mb-4 animate-pulse" />
              <div className="h-8 bg-white/[0.06] rounded-full w-1/2 mb-4 animate-pulse" />
              <div className="h-4 bg-white/[0.06] rounded-full w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.08] p-12">
          <p className="text-stone-400 font-light text-lg">No events found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(event => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <div className="rounded-2xl border border-white/[0.08] hover:border-amber-600/60 transition-all cursor-pointer hover:bg-white/[0.03] flex overflow-hidden min-h-[160px]">
                {/* Left: main content */}
                <div className="flex-1 p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide rounded-full">
                      {event.event_type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-light mb-2">{event.title}</h3>
                  <p className="text-stone-400 font-light line-clamp-2 mb-4">{event.description}</p>

                  <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-stone-300 font-light">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' at '}
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-300 font-light">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-300 font-light">
                      <Users className="w-4 h-4 text-amber-600" />
                      {event.capacity} spots available
                    </div>
                  </div>

                  {(event.instructor_name || event.external_rsvp_url) && (
                    <div className="flex items-center justify-between mt-4">
                      {event.instructor_name && (
                        <div className="text-sm text-amber-600 font-light">Hosted by {event.instructor_name}</div>
                      )}
                      {event.external_rsvp_url && (
                        <a
                          href={event.external_rsvp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          External RSVP
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: flyer thumbnail */}
                <div className="w-44 shrink-0 border-l border-white/[0.06] relative overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={`${event.title} flyer`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950 flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-amber-600/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-amber-600/40" />
                      </div>
                      <span className="text-xs text-stone-600 font-light text-center px-3 leading-relaxed">
                        Flyer<br/>Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}