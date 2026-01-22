'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, MessageCircle, Circle } from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  id: string;
  name: string;
  email: string;
  role?: string;
  tier: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);

      // Get all messages involving the current user
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        setIsLoading(false);
        return;
      }

      // Group by conversation partner
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

        // Count unread messages from this partner
        if (msg.recipient_id === user.id && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount++;
        }
      });

      // Fetch user details for each conversation partner
      const partnerIds = Array.from(conversationMap.keys());

      if (partnerIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, role, tier')
        .in('id', partnerIds);

      const conversationsData: Conversation[] = (users || []).map(u => {
        const conv = conversationMap.get(u.id)!;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
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
      setIsLoading(false);
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
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

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Messages</h1>
        <p className="text-stone-400 font-light">
          Connect with other members in THE CLUB
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-stone-700 pl-12 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="border border-stone-800">
        {isLoading ? (
          <div className="divide-y divide-stone-800">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-800 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-stone-800 rounded w-32 mb-2 animate-pulse" />
                    <div className="h-3 bg-stone-800 rounded w-48 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-400 font-light text-lg mb-2">No messages yet</p>
            <p className="text-stone-500 font-light text-sm mb-6">
              Start a conversation from the member directory
            </p>
            <Link href="/dashboard/directory">
              <button className="border border-amber-600 text-amber-600 px-6 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors">
                Browse Members
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {filteredConversations.map(conv => (
              <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
                <div className="p-6 hover:bg-stone-900/50 transition-colors cursor-pointer flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                      <span className="text-stone-950 font-light text-lg">
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
                      <h3 className={`font-light ${conv.unreadCount > 0 ? 'text-stone-100' : 'text-stone-300'}`}>
                        {conv.name}
                      </h3>
                      <span className="text-xs text-stone-500 font-light">
                        {formatDate(conv.lastMessageDate)}
                      </span>
                    </div>
                    {conv.role && (
                      <p className="text-xs text-amber-600 font-light mb-1">{conv.role}</p>
                    )}
                    <p className={`text-sm font-light truncate ${
                      conv.unreadCount > 0 ? 'text-stone-300' : 'text-stone-500'
                    }`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <Circle className="w-2 h-2 fill-amber-600 text-amber-600" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
