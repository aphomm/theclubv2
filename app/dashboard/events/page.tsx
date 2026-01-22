'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

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

      const query = supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');

      if (filter !== 'all') {
        query.eq('event_type', filter);
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
      <div className="flex gap-4 mb-10 border-b border-stone-800 pb-6">
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
            <div key={i} className="h-32 bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 border border-stone-800 p-12">
          <p className="text-stone-400 font-light text-lg">No events found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(event => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <div className="border border-stone-800 p-8 hover:border-amber-600 transition-colors cursor-pointer hover:bg-stone-900/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide">
                        {event.event_type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-light mb-2">{event.title}</h3>
                    <p className="text-stone-400 font-light line-clamp-2">{event.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-4 pt-4 border-t border-stone-900">
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

                {event.instructor_name && (
                  <div className="text-sm text-amber-600 font-light">Hosted by {event.instructor_name}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
