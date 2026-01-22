'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MoreVertical } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  join_date: string;
}

export default function MembersPage() {
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

      let query = supabase.from('users').select('*');

      if (filterTier !== 'all') {
        query = query.eq('tier', filterTier);
      }

      const { data } = await query.order('join_date', { ascending: false });

      let filtered = data || [];

      if (searchQuery) {
        filtered = filtered.filter(
          m =>
            m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setMembers(filtered);
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterTier]);

  return (
    <div className="max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Members</h1>
        <p className="text-stone-400 font-light">Manage club members and subscriptions</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-stone-700 pl-12 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>

        <div className="flex gap-4">
          {['all', 'Creator', 'Professional', 'Executive'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-2 text-sm font-light transition-colors border ${
                filterTier === tier
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-stone-700 text-stone-400 hover:border-amber-600 hover:text-amber-600'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="border border-stone-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-stone-900 rounded-full animate-pulse" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">
            No members found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={member.id} className={idx !== members.length - 1 ? 'border-b border-stone-800' : ''}>
                    <td className="px-6 py-4 font-light">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase">
                        {member.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 font-light uppercase ${
                          member.status === 'active'
                            ? 'bg-green-600/20 text-green-500'
                            : 'bg-red-600/20 text-red-500'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {new Date(member.join_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-stone-400 hover:text-amber-600 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
