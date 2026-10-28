'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  tier: string;
  location?: string;
  bio?: string;
}

export default function DirectoryPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase.from('users').select('*').eq('status', 'active');

      if (filterTier !== 'all') {
        query = query.eq('tier', filterTier);
      }

      const { data } = await query.order('name');

      let filteredMembers = data || [];

      if (searchQuery) {
        filteredMembers = filteredMembers.filter(
          m =>
            m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setMembers(filteredMembers);
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterTier]);

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl mb-2">Member Directory</h1>
        <p className="text-ink-400">
          Connect with {members.length} members in the ICWT community
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-ink-500" />
          <input
            type="text"
            placeholder="Search by name, role, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 pl-12 pr-4 py-3 text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-accent-600 transition-colors rounded-sm"
          />
        </div>

        <div className="flex gap-4">
          {['all', 'Creator', 'Professional', 'Executive'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-2 text-sm transition-colors border rounded-sm ${
                filterTier === tier
                  ? 'border-accent-600 text-accent-600 bg-accent-600/10'
                  : 'border-white/10 text-ink-400 hover:border-accent-600/50 hover:text-accent-600'
              }`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-white/[0.04] animate-pulse rounded-sm border border-white/[0.08]" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 rounded-sm border border-accent-600/20 bg-accent-600/[0.03] p-12">
          <div className="w-16 h-16 rounded-sm border border-accent-600/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-7 h-7 text-accent-600/40" />
          </div>
          <h3 className="text-xl font-serif mb-3">No Members Found</h3>
          <p className="text-ink-500 text-sm max-w-xs mx-auto">
            Try adjusting your search or filter to find the right member.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <Link key={member.id} href={`/dashboard/directory/${member.id}`}>
              <div className="rounded-sm border border-white/[0.08] p-6 hover:border-accent-600/50 transition-all cursor-pointer hover:bg-white/[0.03] h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-accent-600 rounded-full" />
                  <span className={`text-xs px-3 py-1 uppercase tracking-wide ${
                    member.tier === 'Executive'
                      ? 'bg-accent-500 text-ink-950'
                      : member.tier === 'Professional'
                      ? 'bg-ink-700 text-ink-100'
                      : member.tier === 'Admin'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-accent-600/20 text-accent-600'
                  } rounded-full`}>
                    {member.tier}
                  </span>
                </div>

                <h3 className="text-xl mb-1 line-clamp-1">{member.name}</h3>
                {member.role && (
                  <p className="text-accent-600 text-sm mb-3 line-clamp-1">{member.role}</p>
                )}
                {member.location && (
                  <p className="flex items-center gap-2 text-ink-400 text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    {member.location}
                  </p>
                )}

                <p className="text-ink-400 text-sm mb-6 flex-1 line-clamp-3">
                  {member.bio || 'No bio added yet'}
                </p>

                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <Link
                    href={`/dashboard/messages/${member.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 py-2 text-xs text-ink-400 hover:border-accent-600/60 hover:text-accent-600 transition-colors rounded-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
