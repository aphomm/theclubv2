'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Users, Calendar, Settings, LogOut, Bell, DollarSign, Briefcase, Loader2 } from 'lucide-react';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: Settings },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/pool', label: 'The Pool', icon: DollarSign },
  { href: '/admin/resources', label: 'Resources', icon: Briefcase },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

type AdminAuthStatus = 'loading' | 'authorized' | 'denied';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus>('loading');

  useEffect(() => {
    const checkAdminAccess = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) { router.push('/'); return; }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: userProfile } = await supabase
        .from('users').select('status').eq('id', user.id).maybeSingle();

      setAuthStatus(userProfile?.status === 'admin' ? 'authorized' : 'denied');
    };
    checkAdminAccess();
  }, [router]);

  const handleLogout = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-stone-400 font-light text-sm tracking-wide">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'denied') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl font-light text-red-500 mb-6">401</div>
          <h1 className="text-3xl font-light mb-4">Access Denied</h1>
          <p className="text-stone-400 font-light mb-8">You don't have permission to access the admin panel.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="border border-amber-600 text-amber-600 px-8 py-3 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors">
              Go to Dashboard
            </Link>
            <a href="mailto:support@icwt.com" className="text-sm text-stone-400 hover:text-amber-600 transition-colors font-light">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/admin">
            <div className="text-xl font-light tracking-extra-wide cursor-pointer hover:text-amber-600 transition-colors">
              <span className="text-stone-100">IC</span><span className="text-amber-600">WT</span>
              <span className="text-stone-500 text-sm ml-2">ADMIN</span>
            </div>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 text-stone-400 hover:text-red-500 transition-colors text-sm font-light">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-stone-800 min-h-[calc(100vh-80px)]">
          <nav className="p-6 space-y-2">
            {adminNavItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 px-4 py-3 text-sm font-light text-stone-400 hover:text-amber-600 cursor-pointer transition-colors">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1"><div className="p-8">{children}</div></main>
      </div>
    </div>
  );
}
