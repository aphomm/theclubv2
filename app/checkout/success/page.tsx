'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type VerifyState = 'verifying' | 'success' | 'pending';

function CheckoutSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<VerifyState>('verifying');

  useEffect(() => {
    const verify = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setState('success');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // If no session_id it was a bypass mode activation — already active
      if (!sessionId) {
        setState('success');
        return;
      }

      // Poll membership status up to 5 times (10 seconds) to confirm webhook fired
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: membership } = await supabase
          .from('memberships')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership?.status === 'active') {
          setState('success');
          return;
        }

        if (attempt < 4) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Still not active after 10s — payment is processing
      setState('pending');
    };

    verify();
  }, [sessionId, router]);

  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => router.push('/dashboard'), 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  if (state === 'verifying') {
    return (
      <div className="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-600 mx-auto mb-4" />
          <p className="text-ink-400">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <Link href="/">
            <div className="text-2xl font-serif uppercase leading-none tracking-tight mb-12 cursor-pointer hover:text-accent-600 transition-colors">
              ICWT<span className="text-signal">.</span>
            </div>
          </Link>
          <div className="border border-ink-800 p-12">
            <AlertCircle className="w-16 h-16 text-accent-600 mx-auto mb-6" />
            <h1 className="text-3xl mb-4">Payment Processing</h1>
            <p className="text-ink-400 mb-8">
              Your payment was received and your membership is being activated. This usually completes within a minute.
            </p>
            <Link href="/dashboard">
              <button className="w-full bg-accent-600 text-ink-950 py-4 text-sm tracking-wide hover:bg-accent-700 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Link href="/">
          <div className="text-2xl font-serif uppercase leading-none tracking-tight mb-12 cursor-pointer hover:text-accent-600 transition-colors">
            ICWT<span className="text-signal">.</span>
          </div>
        </Link>

        <div className="border border-ink-800 p-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl mb-4">Welcome to ICWT</h1>

          <p className="text-ink-400 mb-8">
            Your membership is now active. You have full access to all your tier benefits.
          </p>

          <Link href="/dashboard">
            <button className="w-full bg-accent-600 text-ink-950 py-4 text-sm tracking-wide hover:bg-accent-700 transition-colors">
              Go to Dashboard
            </button>
          </Link>

          <p className="text-ink-500 text-xs mt-4">
            Redirecting automatically...
          </p>
        </div>
      </div>
    </div>
  );
}

// Next 15 requires useSearchParams() inside a Suspense boundary for prerendering.
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessPageContent />
    </Suspense>
  );
}
