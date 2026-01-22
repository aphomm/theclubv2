'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  tier: string;
  bio?: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchConversation = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setCurrentUserId(user.id);
      const partnerId = params.userId as string;

      // Fetch partner profile
      const { data: partnerData } = await supabase
        .from('users')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle();

      if (!partnerData) {
        toast.error('User not found');
        router.push('/dashboard/messages');
        return;
      }

      setPartner(partnerData);

      // Fetch messages between current user and partner
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('recipient_id', user.id)
        .eq('read', false);

      setIsLoading(false);
    };

    fetchConversation();
  }, [params.userId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || !currentUserId) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const partnerId = params.userId as string;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === partnerId) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read immediately
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, params.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUserId || !partner) return;

    setIsSending(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSending(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const messageData = {
      sender_id: currentUserId,
      recipient_id: partner.id,
      content: newMessage.trim(),
      read: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      toast.error('Failed to send message');
    } else if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    }

    setIsSending(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl h-[calc(100vh-180px)] flex flex-col">
        <div className="h-20 bg-stone-900 animate-pulse" />
        <div className="flex-1 bg-stone-900/50 animate-pulse" />
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div className="max-w-4xl h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="border border-stone-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/messages">
            <button className="text-stone-400 hover:text-amber-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Link href={`/dashboard/directory/${partner.id}`}>
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <span className="text-stone-950 font-light">
                  {partner.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <h2 className="font-light">{partner.name}</h2>
                {partner.role && (
                  <p className="text-xs text-amber-600 font-light">{partner.role}</p>
                )}
              </div>
            </div>
          </Link>
        </div>
        <button className="text-stone-400 hover:text-amber-600 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border-x border-stone-800 p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 font-light">No messages yet</p>
            <p className="text-stone-500 font-light text-sm mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Date Divider */}
              <div className="flex items-center justify-center mb-6">
                <div className="h-px bg-stone-800 flex-1" />
                <span className="px-4 text-xs text-stone-500 font-light">
                  {formatDate(group.date)}
                </span>
                <div className="h-px bg-stone-800 flex-1" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {group.messages.map(msg => {
                  const isMine = msg.sender_id === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isMine
                            ? 'bg-amber-600 text-stone-950'
                            : 'bg-stone-900 border border-stone-800'
                        } px-4 py-3`}
                      >
                        <p className="font-light text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMine ? 'text-stone-800' : 'text-stone-500'
                          } font-light`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border border-stone-800 p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-amber-600 text-stone-950 p-3 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
