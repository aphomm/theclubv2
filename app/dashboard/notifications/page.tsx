'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, MessageCircle, Megaphone, Check, ExternalLink, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  name: string;
  role?: string;
  tier: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
}

interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'announcement' | 'update' | 'alert';
  action_url?: string;
  created_at: string;
  isRead: boolean;
}

type TabType = 'all' | 'messages' | 'announcements';

const NOTIFICATION_TYPE_CONFIG = {
  announcement: { label: 'Announcement', color: 'bg-blue-600' },
  update: { label: 'Update', color: 'bg-green-600' },
  alert: { label: 'Alert', color: 'bg-red-600' },
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [platformNotifications, setPlatformNotifications] = useState<PlatformNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setCurrentUserId(user.id);

    // Fetch user's tier
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle();

    // Fetch unread messages grouped by sender
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (messages && messages.length > 0) {
      const conversationMap = new Map<string, {
        partnerId: string;
        lastMessage: string;
        lastMessageDate: string;
        unreadCount: number;
      }>();

      messages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastMessageDate: msg.created_at,
            unreadCount: 0,
          });
        }

        if (msg.recipient_id === user.id && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      // Only include conversations with unread messages
      const unreadPartnerIds = Array.from(conversationMap.entries())
        .filter(([_, conv]) => conv.unreadCount > 0)
        .map(([id]) => id);

      if (unreadPartnerIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, role, tier')
          .in('id', unreadPartnerIds);

        const conversationsData: Conversation[] = (users || []).map(u => {
          const conv = conversationMap.get(u.id)!;
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            tier: u.tier,
            lastMessage: conv.lastMessage,
            lastMessageDate: conv.lastMessageDate,
            unreadCount: conv.unreadCount,
          };
        }).sort((a, b) => {
          const dateA = new Date(a.lastMessageDate || 0);
          const dateB = new Date(b.lastMessageDate || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setConversations(conversationsData);
      }
    }

    // Fetch platform notifications for user's tier
    const { data: platformNotifs } = await supabase
      .from('platform_notifications')
      .select('*')
      .contains('target_tiers', [profile?.tier || 'Creator'])
      .order('created_at', { ascending: false });

    // Fetch which notifications have been read
    const { data: readNotifs } = await supabase
      .from('platform_notification_reads')
      .select('notification_id')
      .eq('user_id', user.id);

    const readIds = new Set(readNotifs?.map(r => r.notification_id) || []);

    const platformData: PlatformNotification[] = (platformNotifs || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      notification_type: n.notification_type,
      action_url: n.action_url,
      created_at: n.created_at,
      isRead: readIds.has(n.id),
    }));

    setPlatformNotifications(platformData);
    setIsLoading(false);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || !currentUserId) return;

    setMarkingId(notificationId);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('platform_notification_reads')
      .insert([{ notification_id: notificationId, user_id: currentUserId }]);

    if (!error) {
      setPlatformNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    }
    setMarkingId(null);
  };

  const markAllPlatformAsRead = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || !currentUserId) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const unreadNotifs = platformNotifications.filter(n => !n.isRead);

    if (unreadNotifs.length === 0) return;

    const { error } = await supabase
      .from('platform_notification_reads')
      .insert(
        unreadNotifs.map(n => ({ notification_id: n.id, user_id: currentUserId }))
      );

    if (!error) {
      setPlatformNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      toast.success('All notifications marked as read');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const unreadMessagesCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const unreadPlatformCount = platformNotifications.filter(n => !n.isRead).length;
  const totalUnread = unreadMessagesCount + unreadPlatformCount;

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: totalUnread },
    { id: 'messages' as TabType, label: 'Messages', count: unreadMessagesCount },
    { id: 'announcements' as TabType, label: 'Announcements', count: unreadPlatformCount },
  ];

  const showMessages = activeTab === 'all' || activeTab === 'messages';
  const showAnnouncements = activeTab === 'all' || activeTab === 'announcements';

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Notifications</h1>
        <p className="text-stone-400 font-light">
          Stay updated with messages and announcements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-light transition-colors flex items-center gap-2 rounded-full ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                  : 'border border-white/10 text-stone-400 hover:border-amber-600/50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-stone-950/20 text-stone-950' : 'bg-amber-600/20 text-amber-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {showAnnouncements && unreadPlatformCount > 0 && (
          <button
            onClick={markAllPlatformAsRead}
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-amber-600 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/[0.08] rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-800 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-3 bg-white/[0.06] rounded-full w-48 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {/* Messages Section */}
          {showMessages && conversations.length > 0 && (
            <>
              {activeTab === 'all' && (
                <div className="px-6 py-3 bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs text-stone-400 uppercase tracking-wider">
                    <MessageCircle className="w-3 h-3" />
                    Messages
                  </div>
                </div>
              )}
              {conversations.map(conv => (
                <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
                  <div className="p-6 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                        <span className="text-stone-950 font-light">
                          {conv.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-stone-950 font-medium">{conv.unreadCount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-light text-stone-100">{conv.name}</h3>
                        <span className="text-xs text-stone-500">{formatDate(conv.lastMessageDate || '')}</span>
                      </div>
                      {conv.role && (
                        <p className="text-xs text-amber-600 font-light mb-1">{conv.role}</p>
                      )}
                      <p className="text-sm text-stone-400 font-light truncate">{conv.lastMessage}</p>
                    </div>

                    <Circle className="w-2 h-2 fill-amber-600 text-amber-600" />
                  </div>
                </Link>
              ))}
            </>
          )}

          {/* Platform Notifications Section */}
          {showAnnouncements && platformNotifications.length > 0 && (
            <>
              {activeTab === 'all' && (
                <div className="px-6 py-3 bg-white/[0.03]">
                  <div className="flex items-center gap-2 text-xs text-stone-400 uppercase tracking-wider">
                    <Megaphone className="w-3 h-3" />
                    Announcements
                  </div>
                </div>
              )}
              {platformNotifications.map(notif => {
                const typeConfig = NOTIFICATION_TYPE_CONFIG[notif.notification_type];

                return (
                  <div
                    key={notif.id}
                    className={`p-6 transition-colors ${notif.isRead ? 'opacity-60' : 'hover:bg-white/[0.03]'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 ${typeConfig.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Bell className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-light ${notif.isRead ? 'text-stone-400' : 'text-stone-100'}`}>
                              {notif.title}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded text-white ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          </div>
                          <span className="text-xs text-stone-500">{formatDate(notif.created_at)}</span>
                        </div>
                        <p className={`text-sm font-light mb-2 ${notif.isRead ? 'text-stone-500' : 'text-stone-400'}`}>
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-4">
                          {notif.action_url && (
                            <a
                              href={notif.action_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Learn more
                            </a>
                          )}
                          {!notif.isRead && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              disabled={markingId === notif.id}
                              className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                            >
                              {markingId === notif.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>

                      {!notif.isRead && (
                        <Circle className="w-2 h-2 fill-amber-600 text-amber-600 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Empty State */}
          {((showMessages && conversations.length === 0 && !showAnnouncements) ||
            (showAnnouncements && platformNotifications.length === 0 && !showMessages) ||
            (showMessages && showAnnouncements && conversations.length === 0 && platformNotifications.length === 0)) && (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-stone-700 mx-auto mb-4" />
              <p className="text-stone-400 font-light text-lg mb-2">
                {activeTab === 'messages' ? 'No unread messages' :
                 activeTab === 'announcements' ? 'No announcements' :
                 'No notifications'}
              </p>
              <p className="text-stone-500 font-light text-sm">
                {activeTab === 'messages' ? 'You\'re all caught up!' :
                 activeTab === 'announcements' ? 'Check back later for updates' :
                 'You\'re all caught up!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Link to all messages */}
      {showMessages && (
        <div className="mt-6 text-center">
          <Link href="/dashboard/messages">
            <span className="text-sm text-stone-400 hover:text-amber-600 transition-colors">
              View all conversations →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
