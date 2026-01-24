'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setStatus('error');
        setMessage('Configuration error');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get the code from URL (Supabase sends this after email verification)
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Verification failed');
        return;
      }

      if (code) {
        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setStatus('error');
          setMessage(exchangeError.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Email verified! Redirecting...');

          // Get user profile to check status and tier
          const { data: profile } = await supabase
            .from('users')
            .select('status, tier')
            .eq('id', data.session.user.id)
            .single();

          // Determine where to redirect
          const bypassPayment = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === 'true';

          setTimeout(() => {
            if (bypassPayment || profile?.status === 'active') {
              router.push('/dashboard');
            } else {
              // Redirect to checkout with user's tier
              router.push(`/checkout?tier=${profile?.tier || 'Creator'}`);
            }
          }, 1500);
          return;
        }
      }

      // No code - check if we have an existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setStatus('success');
        setMessage('Already verified! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setStatus('error');
        setMessage('No verification code found. Please try again.');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-2xl font-light tracking-extra-wide mb-12">
          <span className="text-stone-100">IC</span>
          <span className="text-amber-600">WT</span>
        </div>

        <div className="border border-stone-800 p-12">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-6" />
              <p className="text-stone-400 font-light">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-light mb-4">Success!</h1>
              <p className="text-stone-400 font-light">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-light mb-4">Verification Failed</h1>
              <p className="text-stone-400 font-light mb-6">{message}</p>
              <a href="/auth/signup">
                <button className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
                  Try Again
                </button>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
