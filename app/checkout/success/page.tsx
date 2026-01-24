'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Give webhook time to process, then redirect
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVerifying) {
      // Auto-redirect to dashboard after showing success message
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isVerifying, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-stone-400 font-light">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <Link href="/">
          <div className="text-2xl font-light tracking-extra-wide mb-12 cursor-pointer hover:text-amber-600 transition-colors">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
        </Link>

        <div className="border border-stone-800 p-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl font-light mb-4">Welcome to ICWT</h1>

          <p className="text-stone-400 font-light mb-8">
            Your membership is now active. You have full access to all your tier benefits.
          </p>

          <Link href="/dashboard">
            <button className="w-full bg-amber-600 text-stone-950 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
              Go to Dashboard
            </button>
          </Link>

          <p className="text-stone-500 text-xs font-light mt-4">
            Redirecting automatically...
          </p>
        </div>
      </div>
    </div>
  );
}
