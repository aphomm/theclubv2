'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Users, Calendar, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: Settings },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/events', label: 'Events', icon: Calendar },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        router.push('/');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('status')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.status !== 'admin') {
        toast.error('Admin access required');
        router.push('/dashboard');
      }
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/admin">
            <div className="text-xl font-light tracking-extra-wide cursor-pointer hover:text-amber-600 transition-colors">
              <span className="text-stone-100">THE</span>{' '}
              <span className="text-amber-600">CLUB</span> ADMIN
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-stone-400 hover:text-red-500 transition-colors"
          >
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
                  <div className="flex items-center gap-3 px-4 py-3 rounded text-sm font-light text-stone-400 hover:text-amber-600 cursor-pointer transition-colors">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
