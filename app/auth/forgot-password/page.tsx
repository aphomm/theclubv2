'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        toast.error('Please configure Supabase credentials');
        setIsLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Check Your Email</h1>
          <p className="text-stone-400 font-light">
            We've sent a password reset link to {email}
          </p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] p-6 rounded-xl mb-8">
          <p className="text-stone-300 text-sm font-light leading-relaxed">
            Click the link in the email to reset your password. If you don't see the email,
            check your spam folder or request a new link.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="w-full border border-white/10 py-3 text-sm font-light tracking-wide hover:border-amber-600 hover:text-amber-600 transition-colors rounded-full"
          >
            Try Another Email
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-amber-600 hover:underline text-sm font-light">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Reset Password</h1>
        <p className="text-stone-400 font-light">
          Enter your email to receive a password reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-light mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-amber-600 hover:underline text-sm font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
