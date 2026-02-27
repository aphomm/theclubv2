'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, Calendar, Users, DollarSign, Briefcase, Settings,
  LogOut, Menu, X, Bell, Music, MessageCircle, Search, Loader2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/studio', label: 'Studio', icon: Music },
  { href: '/dashboard/directory', label: 'Directory', icon: Users },
  { href: '/dashboard/the-pool', label: 'The Pool', icon: DollarSign },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/resources', label: 'Resources', icon: Briefcase },
];

type AuthStatus = 'loading' | 'authenticated' | 'suspended';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const refreshNotificationCount = async (supabase: any, userId: string, userTier: string) => {
    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    const { data: platformNotifs } = await supabase
      .from('platform_notifications')
      .select('id')
      .contains('target_tiers', [userTier || 'Creator']);

    const { data: readNotifs } = await supabase
      .from('platform_notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    const readIds = new Set(readNotifs?.map((r: { notification_id: string }) => r.notification_id) || []);
    const unreadPlatform = (platformNotifs || []).filter((n: { id: string }) => !readIds.has(n.id)).length;
    setUnreadCount((unreadMessages || 0) + unreadPlatform);
  };

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) { router.push('/'); return; }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }

      setUser(session.user);

      const { data: profile } = await supabase
        .from('users').select('*').eq('id', session.user.id).maybeSingle();

      if (profile) {
        setUserProfile(profile);
        if (profile.status === 'pending_payment') { router.push('/checkout'); return; }
        if (profile.status === 'suspended' || profile.status === 'deleted') {
          setAuthStatus('suspended'); return;
        }
      }

      setAuthStatus('authenticated');
      await refreshNotificationCount(supabase, session.user.id, profile?.tier);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.push('/auth/login');
    });

    return () => { subscription?.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || !user) return;
    const supabase = createClient(supabaseUrl, supabaseKey);
    refreshNotificationCount(supabase, user.id, userProfile?.tier);
  }, [pathname, user, userProfile?.tier]);

  const handleLogout = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-stone-400 font-light text-sm tracking-wide">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl font-light text-red-500 mb-6">⊘</div>
          <h1 className="text-3xl font-light mb-4">Account Suspended</h1>
          <p className="text-stone-400 font-light mb-8">
            Your account has been suspended. Contact support to resolve this.
          </p>
          <a href="mailto:support@icwt.com" className="inline-block border border-amber-600 text-amber-600 px-8 py-3 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full">
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-stone-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-stone-400 hover:text-amber-600">
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/dashboard">
              <div className="text-xl font-light tracking-extra-wide cursor-pointer hover:text-amber-600 transition-colors">
                <span className="text-stone-100">IC</span><span className="text-amber-600">WT</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement;
              if (input.value.trim()) router.push(`/dashboard/search?q=${encodeURIComponent(input.value.trim())}`);
            }} className="hidden md:block relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
              <input type="text" placeholder="Search members, events..." className="bg-white/[0.04] border border-white/10 pl-9 pr-4 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 w-64 rounded-full transition-colors" />
            </form>
            <Link href="/dashboard/notifications">
              <button className="relative text-stone-400 hover:text-amber-600">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-light">{userProfile?.name || 'Member'}</div>
                <div className="text-xs text-amber-600 capitalize">{userProfile?.tier || 'Creator'}</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-stone-950">
                  {(userProfile?.name || 'M').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        <aside className={`fixed left-0 top-20 bottom-0 w-64 border-r border-white/10 bg-stone-950 transform transition-transform z-30 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 text-sm font-light tracking-wide transition-colors cursor-pointer rounded-xl ${isActive ? 'bg-amber-600/15 text-amber-600' : 'text-stone-400 hover:text-stone-100 hover:bg-white/[0.04]'}`}>
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-shrink-0 p-6 space-y-2 border-t border-white/10">
              <Link href="/dashboard/settings" onClick={() => setIsSidebarOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 text-sm font-light text-stone-400 hover:text-stone-100 hover:bg-white/[0.04] cursor-pointer transition-colors rounded-xl">
                  <Settings className="w-5 h-5" />
                  Settings
                </div>
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-light text-stone-400 hover:text-red-500 cursor-pointer transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <div className="hidden lg:block w-64 flex-shrink-0" />

        <main className="flex-1 min-w-0">
          <div className="p-6 md:p-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
