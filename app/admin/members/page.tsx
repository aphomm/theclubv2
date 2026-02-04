'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MoreVertical, Edit, X, Check, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    // Use service role if available to bypass RLS
    const client = serviceKey 
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseKey);

    let query = client.from('users').select('*');

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

    console.log('Members fetched:', filtered.length, 'with service role:', !!serviceKey);
    setMembers(filtered);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterTier]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMemberAction = async (member: User, action: string) => {
    if (action === 'edit') {
      setEditingMember(member);
      setShowEditModal(true);
      setActiveMenu(null);
    } else if (action === 'toggle_status') {
      const newStatus = member.status === 'active' ? 'suspended' : 'active';
      await updateMemberStatus(member.id, newStatus);
    } else if (action === 'upgrade_tier') {
      await upgradeMemberTier(member);
    }
    setActiveMenu(null);
  };

  const updateMemberStatus = async (userId: string, newStatus: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return;
    
    // Use service role if available to bypass RLS
    const client = serviceKey 
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseKey);
    
    console.log('Updating member status:', userId, 'to:', newStatus);
    
    const { error } = await client
      .from('users')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update member status');
      console.error('Member status update error:', error);
    } else {
      toast.success(`Member ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchMembers();
    }
  };

  const upgradeMemberTier = async (member: User) => {
    const tierOrder = ['Creator', 'Professional', 'Executive'];
    const currentIndex = tierOrder.indexOf(member.tier);
    const nextTier = tierOrder[currentIndex + 1];
    
    if (!nextTier) {
      toast.error('Member is already at highest tier');
      return;
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return;
    
    // Use service role if available to bypass RLS
    const client = serviceKey 
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseKey);
    
    console.log('Upgrading member tier:', member.id, 'from:', member.tier, 'to:', nextTier);
    
    const { error } = await client
      .from('users')
      .update({ 
        tier: nextTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.id);
    
    if (error) {
      toast.error('Failed to upgrade member tier');
      console.error('Tier upgrade error:', error);
    } else {
      toast.success(`Member upgraded to ${nextTier}`);
      fetchMembers();
    }
  };

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
                      <div className="relative actions-menu">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                          className="text-stone-400 hover:text-amber-600 transition-colors p-1"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {activeMenu === member.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-stone-900 border border-stone-700 rounded shadow-lg z-50">
                            <button
                              onClick={() => handleMemberAction(member, 'edit')}
                              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleMemberAction(member, 'toggle_status')}
                              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              {member.status === 'active' ? (
                                <>
                                  <X className="w-4 h-4" />
                                  Suspend Member
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  Activate Member
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleMemberAction(member, 'upgrade_tier')}
                              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Upgrade Tier
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 border border-stone-700 rounded p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-light">Edit Member</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                }}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);

                const formData = new FormData(e.currentTarget);
                const updates = {
                  name: formData.get('name') as string,
                  tier: formData.get('tier') as string,
                  status: formData.get('status') as string,
                };

                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                if (!supabaseUrl || !supabaseKey) return;

                const supabase = createClient(supabaseUrl, supabaseKey);

                const { error } = await supabase
                  .from('users')
                  .update(updates)
                  .eq('id', editingMember.id);

                if (error) {
                  toast.error('Failed to update member');
                } else {
                  toast.success('Member updated successfully');
                  fetchMembers();
                  setShowEditModal(false);
                  setEditingMember(null);
                }

                setIsSubmitting(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-stone-400 mb-2">Name</label>
                <input
                  name="name"
                  defaultValue={editingMember.name}
                  className="w-full bg-transparent border border-stone-700 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Email</label>
                <input
                  value={editingMember.email}
                  disabled
                  className="w-full bg-stone-800 border border-stone-700 px-4 py-2 text-stone-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Tier</label>
                <select
                  name="tier"
                  defaultValue={editingMember.tier}
                  className="w-full bg-transparent border border-stone-700 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="Creator">Creator</option>
                  <option value="Professional">Professional</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingMember.status}
                  className="w-full bg-transparent border border-stone-700 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 text-stone-100 py-2 hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 border border-stone-700 text-stone-300 py-2 hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
