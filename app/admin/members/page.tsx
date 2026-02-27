'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MoreVertical, Edit, X, Check, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  join_date: string;
}

type ConfirmAction = {
  type: 'suspend' | 'activate' | 'upgrade_tier';
  member: Member;
  nextTier?: string;
} | null;

async function getAuthToken(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const fetchMembers = async () => {
    const token = await getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action: 'list',
        data: { tier: filterTier !== 'all' ? filterTier : undefined },
      }),
    });

    if (!res.ok) {
      toast.error('Failed to load members');
      setIsLoading(false);
      return;
    }

    const { members: data } = await res.json();
    let filtered = data || [];

    if (searchQuery) {
      filtered = filtered.filter(
        (m: Member) =>
          m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setMembers(filtered);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => { fetchMembers(); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterTier]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu')) setActiveMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const apiAction = async (body: object): Promise<boolean> => {
    const token = await getAuthToken();
    if (!token) { toast.error('Authentication error'); return false; }

    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast.error(error || 'Action failed');
      return false;
    }
    return true;
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);

    const { type, member, nextTier } = confirmAction;
    let ok = false;

    if (type === 'suspend') {
      ok = await apiAction({ action: 'update_status', memberId: member.id, data: { status: 'suspended' } });
      if (ok) toast.success('Member suspended');
    } else if (type === 'activate') {
      ok = await apiAction({ action: 'update_status', memberId: member.id, data: { status: 'active' } });
      if (ok) toast.success('Member activated');
    } else if (type === 'upgrade_tier' && nextTier) {
      ok = await apiAction({ action: 'update_tier', memberId: member.id, data: { tier: nextTier } });
      if (ok) toast.success(`Member upgraded to ${nextTier}`);
    }

    if (ok) fetchMembers();
    setConfirmAction(null);
    setIsSubmitting(false);
  };

  const handleMemberAction = (member: Member, action: string) => {
    setActiveMenu(null);
    if (action === 'edit') {
      setEditingMember(member);
      setShowEditModal(true);
    } else if (action === 'toggle_status') {
      setConfirmAction({ type: member.status === 'active' ? 'suspend' : 'activate', member });
    } else if (action === 'upgrade_tier') {
      const tierOrder = ['Creator', 'Professional', 'Executive'];
      const nextTier = tierOrder[tierOrder.indexOf(member.tier) + 1];
      if (!nextTier) { toast.error('Member is already at highest tier'); return; }
      setConfirmAction({ type: 'upgrade_tier', member, nextTier });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const ok = await apiAction({
      action: 'update_profile',
      memberId: editingMember.id,
      data: {
        name: formData.get('name') as string,
        tier: formData.get('tier') as string,
        status: formData.get('status') as string,
      },
    });

    if (ok) {
      toast.success('Member updated');
      fetchMembers();
      setShowEditModal(false);
      setEditingMember(null);
    }
    setIsSubmitting(false);
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
            className="w-full bg-white/[0.04] border border-white/10 pl-12 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-full"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          {['all', 'Creator', 'Professional', 'Executive', 'Admin'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-2 text-sm font-light transition-colors border rounded-full ${
                filterTier === tier
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-white/10 text-stone-400 hover:border-amber-600 hover:text-amber-600'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-white/[0.08]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-white/[0.08] rounded-full animate-pulse" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">No members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={member.id} className={idx !== members.length - 1 ? 'border-b border-white/[0.06]' : ''}>
                    <td className="px-6 py-4 font-light">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 font-light uppercase rounded-full ${
                        member.tier === 'Executive' ? 'bg-purple-500/20 text-purple-400' :
                        member.tier === 'Professional' ? 'bg-blue-500/20 text-blue-400' :
                        member.tier === 'Admin' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-600/20 text-amber-600'
                      }`}>
                        {member.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 font-light uppercase rounded-full ${
                        member.status === 'active'
                          ? 'bg-green-600/20 text-green-500'
                          : member.status === 'admin'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-red-600/20 text-red-500'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {member.join_date ? new Date(member.join_date).toLocaleDateString() : '—'}
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
                          <div className="absolute right-0 top-full mt-1 w-48 bg-stone-900/95 border border-white/[0.08] rounded-xl shadow-xl z-50">
                            <button
                              onClick={() => handleMemberAction(member, 'edit')}
                              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleMemberAction(member, 'toggle_status')}
                              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"
                            >
                              {member.status === 'active' ? (
                                <><X className="w-4 h-4" />Suspend Member</>
                              ) : (
                                <><Check className="w-4 h-4" />Activate Member</>
                              )}
                            </button>
                            {!['Executive', 'Admin'].includes(member.tier) && (
                              <button
                                onClick={() => handleMemberAction(member, 'upgrade_tier')}
                                className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4" />
                                Upgrade Tier
                              </button>
                            )}
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

      {/* Confirm Action Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl border border-white/[0.08] p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <h2 className="text-lg font-light">Confirm Action</h2>
            </div>
            <p className="text-stone-300 font-light text-sm mb-6">
              {confirmAction.type === 'suspend' && `Suspend ${confirmAction.member.name}? They will lose access to the platform.`}
              {confirmAction.type === 'activate' && `Reactivate ${confirmAction.member.name}? They will regain full access.`}
              {confirmAction.type === 'upgrade_tier' && `Upgrade ${confirmAction.member.name} from ${confirmAction.member.tier} to ${confirmAction.nextTier}?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-white/10 py-2 text-sm font-light hover:bg-white/[0.06] transition-colors rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={isSubmitting}
                className={`flex-1 py-2 text-sm font-light transition-colors disabled:opacity-50 rounded-full ${
                  confirmAction.type === 'suspend'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:opacity-90'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl border border-white/[0.08] p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-light">Edit Member</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingMember(null); }}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-2">Name</label>
                <input
                  name="name"
                  defaultValue={editingMember.name}
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Email</label>
                <input
                  value={editingMember.email}
                  disabled
                  className="w-full bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-stone-400 cursor-not-allowed rounded-xl opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Tier</label>
                <select
                  name="tier"
                  defaultValue={editingMember.tier}
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                >
                  <option value="Creator">Creator</option>
                  <option value="Professional">Professional</option>
                  <option value="Executive">Executive</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingMember.status}
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-2 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingMember(null); }}
                  className="flex-1 border border-white/10 text-stone-300 py-2 hover:bg-white/[0.06] transition-colors rounded-full"
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
