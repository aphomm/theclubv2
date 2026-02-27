'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Check, Loader2, AlertCircle } from 'lucide-react';

const TIER_DETAILS: Record<string, {
  price: number;
  features: string[];
}> = {
  'Creator': {
    price: 500,
    features: [
      'Basic access to networking events',
      'Member directory access',
      'Quarterly masterclasses',
      'Resource library access',
    ],
  },
  'Professional': {
    price: 1200,
    features: [
      'Everything in Creator, plus',
      '10 studio hours per month',
      'VIP event access',
      'Collaboration matching',
      'Pool platform access',
    ],
  },
  'Executive': {
    price: 2500,
    features: [
      'Everything in Professional, plus',
      '20 studio hours per month',
      'Executive lounge access',
      'Priority Pool investments',
      '1-on-1 advisory sessions',
    ],
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tier');
  const cancelled = searchParams.get('cancelled');

  const [user, setUser] = useState<{ id: string; email: string; tier: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize tier
  const normalizeTier = (t: string | null): string => {
    if (!t) return 'Creator';
    const lower = t.toLowerCase();
    if (lower === 'professional') return 'Professional';
    if (lower === 'executive') return 'Executive';
    return 'Creator';
  };

  const tier = normalizeTier(tierParam);
  const tierDetails = TIER_DETAILS[tier];

  useEffect(() => {
    if (cancelled === 'true') {
      toast.error('Payment was cancelled. You can try again when ready.');
    }
  }, [cancelled]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        // Not logged in, redirect to signup
        router.push('/auth/signup');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('id, email, tier, status')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // If already active, redirect to dashboard
        if (profile.status === 'active') {
          router.push('/dashboard');
          return;
        }
        setUser({
          id: profile.id,
          email: profile.email,
          tier: tierParam ? tier : profile.tier, // Use URL tier if provided, else user's tier
        });
      }

      setIsLoading(false);
    };

    fetchUser();
  }, [router, tier, tierParam]);

  const handleCheckout = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl!, supabaseKey!);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          tier: user.tier,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.bypassed) {
        // Payment was bypassed (dev mode)
        toast.success('Membership activated!');
        router.push('/dashboard');
        return;
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.error) {
        toast.error(data.error);
        setIsProcessing(false);
      }
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-light mb-4">Please sign in first</h1>
          <Link href="/auth/signup">
            <button className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <div className="text-2xl font-light tracking-extra-wide mb-12 text-center cursor-pointer hover:text-amber-600 transition-colors">
            <span className="text-stone-100">IC</span>
            <span className="text-amber-600">WT</span>
          </div>
        </Link>

        <div className="border border-stone-800 p-8">
          <h1 className="text-3xl font-light mb-2">Complete Your Membership</h1>
          <p className="text-stone-400 font-light mb-8">
            You're signing up for{' '}
            <span className="text-amber-600">{user.tier}</span> membership
          </p>

          {/* Tier Summary */}
          <div className="border border-stone-700 p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-light">{user.tier} Membership</h2>
                <p className="text-stone-400 text-sm font-light">Billed monthly</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-light text-amber-600">
                  ${tierDetails?.price.toLocaleString()}
                </div>
                <div className="text-stone-400 text-sm font-light">per month</div>
              </div>
            </div>

            <div className="border-t border-stone-800 pt-6">
              <h3 className="text-sm text-stone-400 font-light mb-4">INCLUDES</h3>
              <ul className="space-y-3">
                {tierDetails?.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-stone-300 font-light">
                    <Check className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-amber-600 text-stone-950 py-4 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${tierDetails?.price.toLocaleString()}/month`
            )}
          </button>

          <p className="text-stone-500 text-xs font-light text-center mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>

          {/* Change tier link */}
          <div className="text-center mt-6">
            <Link href="/#membership" className="text-amber-600 text-sm font-light hover:underline">
              Want a different tier? Go back to select
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
