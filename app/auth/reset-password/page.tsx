'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery token from the URL hash automatically
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message || 'Failed to update password');
      setIsSubmitting(false);
    } else {
      toast.success('Password updated! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="text-2xl font-light tracking-extra-wide mb-12 text-center cursor-pointer hover:text-amber-600 transition-colors">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
        </Link>

        <div className="rounded-2xl border border-white/[0.08] p-8">
          <h1 className="text-2xl font-light mb-2">Set New Password</h1>
          <p className="text-stone-400 font-light text-sm mb-8">
            Enter a new password for your account.
          </p>

          {!isReady ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin mx-auto mb-3" />
              <p className="text-stone-400 font-light text-sm">Verifying reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2 rounded-full"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
