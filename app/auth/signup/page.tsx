'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';

// Normalize tier to proper capitalization
const normalizeTier = (tier: string | null): string => {
  if (!tier) return 'Creator';
  const tierLower = tier.toLowerCase();
  if (tierLower === 'professional') return 'Professional';
  if (tierLower === 'executive') return 'Executive';
  return 'Creator';
};

// Check if payment is bypassed (for development/testing)
const isPaymentBypassed = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === 'true';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = normalizeTier(searchParams.get('tier'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 10) {
      toast.error('Password must be at least 10 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one number');
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

      // Set initial status based on whether payment is bypassed
      const initialStatus = isPaymentBypassed ? 'active' : 'pending_payment';

      // Determine redirect URL after email verification
      // Use the auth callback page which handles the session and redirects appropriately
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectTo = `${appUrl}/auth/callback`;

      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name: formData.name,
            tier: tier,
            status: initialStatus,
            phone: formData.phone,
            company: formData.company,
          },
        },
      });

      if (signupError) {
        toast.error(signupError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Try to create/update user profile
        // Use upsert to handle cases where trigger already created the record
        const { error: profileError } = await supabase
          .from('users')
          .upsert(
            {
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              tier,
              status: initialStatus,
              phone: formData.phone || null,
              company: formData.company || null,
              address_line1: formData.address_line1 || null,
              address_line2: formData.address_line2 || null,
              city: formData.city || null,
              state: formData.state || null,
              postal_code: formData.postal_code || null,
              join_date: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Profile error:', profileError);
          // Don't block signup - trigger may have created the profile
        }

        // Try to create membership record
        const { error: membershipError } = await supabase
          .from('memberships')
          .upsert(
            {
              user_id: data.user.id,
              tier,
              status: initialStatus,
              start_date: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (membershipError) {
          console.error('Membership error:', membershipError);
          // Don't block signup - trigger may have created the membership
        }

        // Show appropriate message based on email confirmation requirement
        if (data.session) {
          // User is auto-confirmed (email confirmation disabled in Supabase)
          if (isPaymentBypassed) {
            toast.success('Account created successfully! Redirecting to dashboard...');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            toast.success('Account created! Redirecting to payment...');
            setTimeout(() => router.push(`/checkout?tier=${tier}`), 1500);
          }
        } else {
          // Email confirmation is required - show success screen
          setSignupEmail(formData.email);
          setSignupSuccess(true);
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after signup
  if (signupSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-light mb-2">Check Your Email</h1>
          <p className="text-stone-400 font-light">
            We've sent a verification link to
          </p>
          <p className="text-amber-600 font-light mt-1">{signupEmail}</p>
        </div>

        <div className="rounded-xl border border-white/[0.08] p-6 text-left mb-6">
          <h3 className="font-light mb-3">Next Steps:</h3>
          <ol className="space-y-2 text-sm text-stone-400 font-light">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">1.</span>
              Open your email inbox
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">2.</span>
              Click the verification link in the email from ICWT
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">3.</span>
              Complete your membership setup
            </li>
          </ol>
        </div>

        <p className="text-xs text-stone-500 font-light">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={() => setSignupSuccess(false)}
            className="text-amber-600 hover:underline"
          >
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Create Your Account</h1>
        <p className="text-stone-400 font-light">
          Join ICWT as a{' '}
          <span className="text-amber-600 capitalize">{tier}</span> member
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <label className="block text-sm font-light mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full legal name"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+1 (555) 000-0000"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Company/Organization</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="Your company or label"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        {/* Address Section */}
        <div className="border-t border-white/[0.06] pt-6">
          <h3 className="text-sm font-light text-stone-400 mb-4">Address (Optional)</h3>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                placeholder="Street address"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
            </div>
            <div>
              <input
                type="text"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
                placeholder="Apt, suite, unit (optional)"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
            </div>
            <div>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="ZIP / Postal code"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="border-t border-white/[0.06] pt-6">
          <h3 className="text-sm font-light text-stone-400 mb-4">Set Your Password</h3>
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-stone-500 hover:text-amber-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 mb-12 text-center">
        <p className="text-stone-400 text-sm font-light">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-amber-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
