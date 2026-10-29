'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  const pstDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return pstDate.toISOString().split('T')[0];
};

// Get first day of current month in PST
const getStartOfMonthPST = () => {
  const pst = getPSTDate();
  return new Date(pst.getFullYear(), pst.getMonth(), 1);
};

// Get last day of current month in PST
const getEndOfMonthPST = () => {
  const pst = getPSTDate();
  return new Date(pst.getFullYear(), pst.getMonth() + 1, 0);
};

interface DashboardStats {
  eventsRsvpd: number;
  studioHoursAvailable: number;
  studioHoursUsed: number;
  studioHoursTotal: number;
  networkConnections: number;
  activePoolProjects: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    eventsRsvpd: 0,
    studioHoursAvailable: 10,
    studioHoursUsed: 0,
    studioHoursTotal: 10,
    networkConnections: 0,
    activePoolProjects: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

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

      // Get current month boundaries in PST
      const startOfMonth = formatDatePST(getStartOfMonthPST());
      const endOfMonth = formatDatePST(getEndOfMonthPST());
      const today = formatDatePST(getPSTDate());

      const [eventRsvps, events, userCount, poolProjects, studioBookings, userProfile] = await Promise.all([
        supabase.from('event_rsvps').select('*').eq('user_id', user.id),
        supabase
          .from('events')
          .select('*')
          .gte('date', today)
          .order('date')
          .limit(5),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('pool_projects').select('*').eq('status', 'active').limit(5),
        // Fetch user's studio bookings for current month
        supabase
          .from('studio_bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .neq('status', 'cancelled'),
        // Fetch user's tier
        supabase.from('users').select('tier, name, full_name').eq('id', user.id).maybeSingle(),
      ]);

      // Set profile name for personalized greeting
      const displayName = userProfile.data?.name || userProfile.data?.full_name || null;
      setProfileName(displayName);

      // Get monthly hours based on user's tier
      const userTier = userProfile.data?.tier || 'Creator';
      const monthlyHours = TIER_STUDIO_HOURS[userTier] || 10;

      // Calculate hours used this month (each booking = 2 hours)
      const hoursUsed = (studioBookings.data?.length || 0) * HOURS_PER_BOOKING;
      const hoursAvailable = Math.max(0, monthlyHours - hoursUsed);

      setStats({
        eventsRsvpd: eventRsvps.data?.length || 0,
        studioHoursAvailable: hoursAvailable,
        studioHoursUsed: hoursUsed,
        studioHoursTotal: monthlyHours,
        networkConnections: userCount.count || 0,
        activePoolProjects: poolProjects.data?.length || 0,
      });

      setUpcomingEvents(events.data || []);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ label, value }: any) => (
    <div className="bg-ink-950 p-6">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500 mb-6">{label}</p>
      <div className="font-serif text-5xl leading-none">{value}</div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl mb-2">Welcome back{profileName ? `, ${profileName.split(' ')[0]}` : ''}</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-500">
          {new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink-800 border border-ink-800 mb-12">
        <StatCard label="Events RSVP'd" value={stats.eventsRsvpd} />
        <StatCard label="Studio hours left" value={`${stats.studioHoursAvailable}h`} />
        <StatCard label="Network" value={stats.networkConnections} />
        <StatCard label="Active Pool projects" value={stats.activePoolProjects} />
      </div>

      {/* Upcoming Events */}
      <div className="rounded-sm border border-white/[0.08] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl">Upcoming Events</h2>
          <a href="/dashboard/events" className="text-sm text-accent-600 hover:underline">
            View All
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/[0.04] animate-pulse rounded-sm" />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-400">No upcoming events scheduled</p>
            <a href="/dashboard/events" className="text-accent-600 hover:underline text-sm mt-2 inline-block">
              Browse all events
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="rounded-sm border border-white/[0.08] p-4 hover:border-accent-600/60 hover:bg-white/[0.02] transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg">{event.title}</h3>
                  <p className="text-sm text-ink-400">
                    {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                      timeZone: 'America/Los_Angeles',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} • {event.location}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-accent-600">{event.capacity} spots</div>
                    <div className="text-xs text-ink-400">Available</div>
                  </div>
                  <a href={`/dashboard/events/${event.id}`}>
                    <button className="border border-accent-600 text-accent-600 px-6 py-2 text-sm hover:bg-accent-600 hover:text-ink-950 transition-colors rounded-sm">
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
        <div className="rounded-sm border border-white/[0.08] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Studio Bookings</h2>
            <a href="/dashboard/studio" className="text-sm text-accent-600 hover:underline">
              Book Now
            </a>
          </div>
          <p className="text-ink-400 text-sm">
            You have <span className="text-accent-600">{stats.studioHoursAvailable}h</span> available this month
            {stats.studioHoursUsed > 0 && (
              <span> ({stats.studioHoursUsed}h used)</span>
            )}. Book your recording sessions.
          </p>
        </div>

        <div className="rounded-sm border border-white/[0.08] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">The Pool</h2>
            <a href="/dashboard/the-pool" className="text-sm text-accent-600 hover:underline">
              View
            </a>
          </div>
          <p className="text-ink-400 text-sm">
            Explore collaborative projects and investment opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
