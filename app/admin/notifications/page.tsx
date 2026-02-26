'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, Plus, Trash2, Edit2, ExternalLink, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'announcement' | 'update' | 'alert';
  target_tiers: string[];
  action_url?: string;
  created_by?: string;
  expires_at?: string;
  created_at: string;
  read_count?: number;
}

const NOTIFICATION_TYPES = [
  { value: 'announcement', label: 'Announcement', color: 'bg-blue-600' },
  { value: 'update', label: 'Update', color: 'bg-green-600' },
  { value: 'alert', label: 'Alert', color: 'bg-red-600' },
];

const TIERS = ['Creator', 'Professional', 'Executive'];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<PlatformNotification | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'announcement' | 'update' | 'alert'>('announcement');
  const [targetTiers, setTargetTiers] = useState<string[]>(['Creator', 'Professional', 'Executive']);
  const [actionUrl, setActionUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all notifications
    const { data: notifs } = await supabase
      .from('platform_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (notifs) {
      // Fetch read counts for each notification
      const notifsWithCounts = await Promise.all(
        notifs.map(async (notif) => {
          const { count } = await supabase
            .from('platform_notification_reads')
            .select('*', { count: 'exact', head: true })
            .eq('notification_id', notif.id);

          return { ...notif, read_count: count || 0 };
        })
      );

      setNotifications(notifsWithCounts);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setNotificationType('announcement');
    setTargetTiers(['Creator', 'Professional', 'Executive']);
    setActionUrl('');
    setExpiresAt('');
    setEditingNotification(null);
    setShowForm(false);
  };

  const handleEdit = (notif: PlatformNotification) => {
    setEditingNotification(notif);
    setTitle(notif.title);
    setMessage(notif.message);
    setNotificationType(notif.notification_type);
    setTargetTiers(notif.target_tiers);
    setActionUrl(notif.action_url || '');
    setExpiresAt(notif.expires_at ? notif.expires_at.slice(0, 16) : '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (targetTiers.length === 0) {
      toast.error('Select at least one target tier');
      return;
    }

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser();

    const notificationData = {
      title: title.trim(),
      message: message.trim(),
      notification_type: notificationType,
      target_tiers: targetTiers,
      action_url: actionUrl.trim() || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      created_by: user?.id,
    };

    let error;

    if (editingNotification) {
      const { error: updateError } = await supabase
        .from('platform_notifications')
        .update(notificationData)
        .eq('id', editingNotification.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('platform_notifications')
        .insert([notificationData]);
      error = insertError;
    }

    if (error) {
      toast.error(editingNotification ? 'Failed to update notification' : 'Failed to create notification');
      console.error(error);
    } else {
      toast.success(editingNotification ? 'Notification updated' : 'Notification created');
      resetForm();
      fetchNotifications();
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('platform_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete notification');
    } else {
      toast.success('Notification deleted');
      fetchNotifications();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
  };

  const toggleTier = (tier: string) => {
    setTargetTiers(prev =>
      prev.includes(tier)
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light mb-2">Notifications</h1>
          <p className="text-stone-400 font-light">
            Create and manage platform-wide notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 border border-amber-600 text-amber-600 px-4 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full"
        >
          <Plus className="w-4 h-4" />
          New Notification
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-white/[0.08] p-6 mb-8">
          <h2 className="text-xl font-light mb-6">
            {editingNotification ? 'Edit Notification' : 'Create Notification'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-stone-400 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none rounded-xl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-stone-400 mb-2">Type</label>
                <div className="flex gap-2">
                  {NOTIFICATION_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNotificationType(type.value as any)}
                      className={`px-4 py-2 text-sm font-light transition-colors rounded-full ${
                        notificationType === type.value
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                          : 'border border-white/10 text-stone-400 hover:border-amber-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Target Tiers</label>
                <div className="flex gap-2">
                  {TIERS.map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleTier(tier)}
                      className={`px-4 py-2 text-sm font-light transition-colors rounded-full ${
                        targetTiers.includes(tier)
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                          : 'border border-white/10 text-stone-400 hover:border-amber-600'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-stone-400 mb-2">Action URL (optional)</label>
                <input
                  type="url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-2">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="border border-amber-600 text-amber-600 px-6 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors disabled:opacity-50 rounded-full"
              >
                {isSubmitting ? 'Saving...' : (editingNotification ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-white/10 text-stone-400 px-6 py-2 text-sm font-light hover:border-white/20 transition-colors rounded-full"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications List */}
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/[0.06]">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6">
                <div className="h-5 bg-white/[0.08] rounded w-48 mb-3 animate-pulse" />
                <div className="h-4 bg-white/[0.08] rounded w-full mb-2 animate-pulse" />
                <div className="h-4 bg-white/[0.08] rounded w-2/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-400 font-light text-lg mb-2">No notifications yet</p>
            <p className="text-stone-500 font-light text-sm">
              Create your first notification to broadcast to members
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {notifications.map(notif => {
              const typeConfig = getTypeConfig(notif.notification_type);
              const isExpired = notif.expires_at && new Date(notif.expires_at) < new Date();

              return (
                <div key={notif.id} className={`p-6 ${isExpired ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded text-white ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        {isExpired && (
                          <span className="text-xs text-red-500">Expired</span>
                        )}
                        <span className="text-xs text-stone-500">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>

                      <h3 className="text-lg font-light text-stone-100 mb-2">{notif.title}</h3>
                      <p className="text-stone-400 font-light text-sm mb-3">{notif.message}</p>

                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {notif.target_tiers.join(', ')}
                        </div>
                        <div>
                          {notif.read_count} read
                        </div>
                        {notif.action_url && (
                          <a
                            href={notif.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Link
                          </a>
                        )}
                        {notif.expires_at && (
                          <div>
                            Expires: {formatDate(notif.expires_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(notif)}
                        className="p-2 text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
