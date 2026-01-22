'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'Creator';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
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

      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signupError) {
        toast.error(signupError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              tier,
              status: 'active',
              join_date: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          toast.error('Error creating profile');
          setIsLoading(false);
          return;
        }

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert([
            {
              user_id: data.user.id,
              tier,
              status: 'active',
              start_date: new Date().toISOString(),
            },
          ]);

        if (membershipError) {
          toast.error('Error creating membership');
          setIsLoading(false);
          return;
        }

        toast.success('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Create Your Account</h1>
        <p className="text-stone-400 font-light">
          Join THE CLUB as a{' '}
          <span className="text-amber-600 capitalize">{tier}</span> member
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <label className="block text-sm font-light mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your name"
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
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
          <label className="block text-sm font-light mb-2">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-600 text-stone-950 py-3 text-sm font-light tracking-wide hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center">
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
