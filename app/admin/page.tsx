'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

interface Stats {
  totalMembers: number;
  creatorTier: number;
  professionalTier: number;
  executiveTier: number;
  totalEvents: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    creatorTier: 0,
    professionalTier: 0,
    executiveTier: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const [members, creator, professional, executive, events] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact' }).eq('tier', 'Creator'),
        supabase.from('users').select('id', { count: 'exact' }).eq('tier', 'Professional'),
        supabase.from('users').select('id', { count: 'exact' }).eq('tier', 'Executive'),
        supabase.from('events').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalMembers: members.count || 0,
        creatorTier: creator.count || 0,
        professionalTier: professional.count || 0,
        executiveTier: executive.count || 0,
        totalEvents: events.count || 0,
        totalRevenue: (creator.count || 0) * 500 + (professional.count || 0) * 1200 + (executive.count || 0) * 2500,
      });

      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="border border-stone-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-stone-400 font-light tracking-wide mb-2">{label}</div>
          <div className="text-3xl font-light">{value}</div>
        </div>
        <Icon className="w-8 h-8 text-amber-600 opacity-50" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-light mb-2">Admin Dashboard</h1>
        <p className="text-stone-400 font-light">Platform overview and management</p>
      </div>

      {isLoading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <StatCard icon={Users} label="Total Members" value={stats.totalMembers} />
            <StatCard icon={Calendar} label="Events" value={stats.totalEvents} />
            <StatCard icon={TrendingUp} label="Creator Tier" value={stats.creatorTier} />
            <StatCard icon={TrendingUp} label="Professional Tier" value={stats.professionalTier} />
            <StatCard icon={TrendingUp} label="Executive Tier" value={stats.executiveTier} />
            <StatCard icon={DollarSign} label="Monthly Revenue (Est)" value={`$${stats.totalRevenue.toLocaleString()}`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="border border-stone-800 p-8">
              <h2 className="text-2xl font-light mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <a href="/admin/members">
                  <button className="w-full border border-stone-700 py-3 px-4 text-sm font-light hover:border-amber-600 hover:text-amber-600 transition-colors text-left">
                    Manage Members →
                  </button>
                </a>
                <a href="/admin/events">
                  <button className="w-full border border-stone-700 py-3 px-4 text-sm font-light hover:border-amber-600 hover:text-amber-600 transition-colors text-left">
                    Manage Events →
                  </button>
                </a>
                <a href="/admin/resources">
                  <button className="w-full border border-stone-700 py-3 px-4 text-sm font-light hover:border-amber-600 hover:text-amber-600 transition-colors text-left">
                    Manage Resources →
                  </button>
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="border border-stone-800 p-8">
              <h2 className="text-2xl font-light mb-6">System Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-sm font-light">Database</span>
                  <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1 font-light">Connected</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-sm font-light">API</span>
                  <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1 font-light">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-light">Auth</span>
                  <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1 font-light">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
