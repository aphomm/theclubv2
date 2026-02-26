'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminSetupPage() {
  const router = useRouter();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('status', 'admin')
        .maybeSingle();

      setAdminExists(!!data);
    };
    checkAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passphrase }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Setup failed');
        setIsSubmitting(false);
        return;
      }

      toast.success('Admin account configured! Redirecting...');
      setTimeout(() => router.push('/admin'), 1500);
    } catch {
      toast.error('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-amber-600 mx-auto mb-6" />
          <h1 className="text-2xl font-light mb-4">Admin Already Configured</h1>
          <p className="text-stone-400 font-light text-sm mb-8">
            An admin account already exists for this platform.
          </p>
          <Link href="/admin">
            <button className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light hover:bg-amber-700 transition-colors">
              Go to Admin Panel
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-2xl font-light tracking-extra-wide mb-12 text-center">
          <span className="text-stone-100">IC</span>
          <span className="text-amber-600">WT</span>
          <span className="text-stone-400 text-base ml-2">Admin Setup</span>
        </div>

        <div className="border border-stone-800 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-light">First-Run Admin Setup</h1>
          </div>
          <p className="text-stone-400 font-light text-sm mb-8">
            No admin exists yet. Enter your account email and the setup passphrase to become the platform admin. This can only be done once.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-stone-400 font-light mb-2 block">Your Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sm text-stone-400 font-light mb-2 block">Setup Passphrase</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter setup passphrase"
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                required
              />
              <p className="text-xs text-stone-500 mt-1">Set via ADMIN_SETUP_PASSPHRASE environment variable</p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
              ) : 'Activate Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
