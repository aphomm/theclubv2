'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Users, DollarSign, Briefcase, Settings, LogOut, Menu, X, Bell, Music, MessageCircle, Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/events', label: 'Events', icon: Calendar },
  { href: '/dashboard/studio', label: 'Studio', icon: Music },
  { href: '/dashboard/directory', label: 'Directory', icon: Users },
  { href: '/dashboard/the-pool', label: 'The Pool', icon: DollarSign },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/resources', label: 'Resources', icon: Briefcase },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      router.push('/');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch unread notifications count (unread messages)
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', session.user.id)
        .eq('read', false);

      setUnreadCount(unreadMessages || 0);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

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

  if (!user) {
    return <div className="min-h-screen bg-stone-950" />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-stone-800 bg-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-stone-400 hover:text-amber-600"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/dashboard">
              <div className="text-xl font-light tracking-extra-wide cursor-pointer hover:text-amber-600 transition-colors">
                <span className="text-stone-100">THE</span>{' '}
                <span className="text-amber-600">CLUB</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.querySelector('input') as HTMLInputElement;
                if (input.value.trim()) {
                  router.push(`/dashboard/search?q=${encodeURIComponent(input.value.trim())}`);
                }
              }}
              className="hidden md:block relative"
            >
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search members, events..."
                className="bg-stone-900 border border-stone-700 pl-9 pr-4 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 w-64"
              />
            </form>
            <Link href="/dashboard/messages">
              <button className="relative text-stone-400 hover:text-amber-600">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-light">{userProfile?.name || 'Member'}</div>
                <div className="text-xs text-amber-600 capitalize">{userProfile?.tier || 'Creator'}</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-20 bottom-0 w-64 border-r border-stone-800 bg-stone-950 transform transition-transform z-30 lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-light tracking-wide transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-amber-600 border-l-2 border-amber-600'
                          : 'text-stone-400 hover:text-amber-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-shrink-0 p-6 space-y-2 border-t border-stone-800">
              <Link href="/dashboard/settings">
                <div className="flex items-center gap-3 px-4 py-3 text-sm font-light text-stone-400 hover:text-amber-600 cursor-pointer transition-colors">
                  <Settings className="w-5 h-5" />
                  Settings
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-light text-stone-400 hover:text-red-500 cursor-pointer transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Sidebar spacer for desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0" />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
