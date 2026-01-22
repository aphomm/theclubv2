'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Users, Music, TrendingUp } from 'lucide-react';

interface DashboardStats {
  eventsRsvpd: number;
  studioHoursAvailable: number;
  networkConnections: number;
  activePoolProjects: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    eventsRsvpd: 0,
    studioHoursAvailable: 0,
    networkConnections: 0,
    activePoolProjects: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [eventRsvps, events, userCount, poolProjects] = await Promise.all([
        supabase.from('event_rsvps').select('*').eq('user_id', user.id),
        supabase
          .from('events')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date')
          .limit(5),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('pool_projects').select('*').eq('status', 'active').limit(5),
      ]);

      setStats({
        eventsRsvpd: eventRsvps.data?.length || 0,
        studioHoursAvailable: 10,
        networkConnections: userCount.count || 0,
        activePoolProjects: poolProjects.data?.length || 0,
      });

      setUpcomingEvents(events.data || []);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="border border-stone-800 p-6 hover:border-amber-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-6 h-6 text-amber-600" />
        <div className="text-3xl font-light text-amber-600">{value}</div>
      </div>
      <p className="text-sm text-stone-400 font-light">{label}</p>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-light mb-2">Welcome back</h1>
        <p className="text-stone-400 font-light">Here's what's happening at THE CLUB</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={Calendar} label="Events RSVP'd" value={stats.eventsRsvpd} />
        <StatCard icon={Music} label="Studio Hours" value={`${stats.studioHoursAvailable}h`} />
        <StatCard icon={Users} label="Network Connections" value={stats.networkConnections} />
        <StatCard icon={TrendingUp} label="Active Pool Projects" value={stats.activePoolProjects} />
      </div>

      {/* Upcoming Events */}
      <div className="border border-stone-800 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light">Upcoming Events</h2>
          <a href="/dashboard/events" className="text-sm text-amber-600 hover:underline font-light">
            View All
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-stone-900 animate-pulse" />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 font-light">No upcoming events scheduled</p>
            <a href="/dashboard/events" className="text-amber-600 hover:underline text-sm font-light mt-2 inline-block">
              Browse all events
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="border border-stone-800 p-4 hover:border-amber-600 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="font-light text-lg">{event.title}</h3>
                  <p className="text-sm text-stone-400 font-light">
                    {new Date(event.date).toLocaleDateString()} • {event.location}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-amber-600 font-light">{event.capacity} spots</div>
                    <div className="text-xs text-stone-400">Available</div>
                  </div>
                  <a href={`/dashboard/events/${event.id}`}>
                    <button className="border border-amber-600 text-amber-600 px-6 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors">
                      RSVP
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Studio Bookings Preview */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="border border-stone-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">Studio Bookings</h2>
            <a href="/dashboard/studio" className="text-sm text-amber-600 hover:underline font-light">
              Book Now
            </a>
          </div>
          <p className="text-stone-400 font-light text-sm">
            You have 10 studio hours available this month. Book your recording sessions.
          </p>
        </div>

        <div className="border border-stone-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">The Pool</h2>
            <a href="/dashboard/the-pool" className="text-sm text-amber-600 hover:underline font-light">
              View
            </a>
          </div>
          <p className="text-stone-400 font-light text-sm">
            Explore collaborative projects and investment opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
