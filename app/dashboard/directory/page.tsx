'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';

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
        <h1 className="text-4xl font-light mb-2">Member Directory</h1>
        <p className="text-stone-400 font-light">
          Connect with {members.length} members in the ICWT community
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
          <input
            type="text"
            placeholder="Search by name, role, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 pl-12 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-full"
          />
        </div>

        <div className="flex gap-4">
          {['all', 'Creator', 'Professional', 'Executive'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-2 text-sm font-light transition-colors border rounded-full ${
                filterTier === tier
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-white/10 text-stone-400 hover:border-amber-600/50 hover:text-amber-600'
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
            <div key={i} className="h-80 bg-white/[0.04] animate-pulse rounded-2xl border border-white/[0.08]" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.08] p-12">
          <Users className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <p className="text-stone-400 font-light text-lg">No members found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <Link key={member.id} href={`/dashboard/directory/${member.id}`}>
              <div className="rounded-2xl border border-white/[0.08] p-6 hover:border-amber-600/50 transition-all cursor-pointer hover:bg-white/[0.03] h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full" />
                  <span className={`text-xs px-3 py-1 font-light uppercase tracking-wide ${
                    member.tier === 'Executive'
                      ? 'bg-purple-500/20 text-purple-400'
                      : member.tier === 'Professional'
                      ? 'bg-blue-500/20 text-blue-400'
                      : member.tier === 'Admin'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-600/20 text-amber-600'
                  } rounded-full`}>
                    {member.tier}
                  </span>
                </div>

                <h3 className="text-xl font-light mb-1 line-clamp-1">{member.name}</h3>
                {member.role && (
                  <p className="text-amber-600 text-sm font-light mb-3 line-clamp-1">{member.role}</p>
                )}
                {member.location && (
                  <p className="flex items-center gap-2 text-stone-400 text-sm font-light mb-4">
                    <MapPin className="w-4 h-4" />
                    {member.location}
                  </p>
                )}

                <p className="text-stone-400 font-light text-sm mb-6 flex-1 line-clamp-3">
                  {member.bio || 'No bio added yet'}
                </p>

                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <Link
                    href={`/dashboard/messages/${member.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 border border-white/10 py-2 text-xs font-light text-stone-400 hover:border-amber-600/60 hover:text-amber-600 transition-colors rounded-full"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Link>
                  <button className="flex-1 border border-white/10 py-2 text-xs font-light text-stone-400 hover:border-amber-600/60 hover:text-amber-600 transition-colors rounded-full">
                    Connect
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
