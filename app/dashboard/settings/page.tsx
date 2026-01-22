'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
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
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(userProfile);
      setIsLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSaving(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('users')
      .update({
        name: profile.name,
        role: profile.role,
        bio: profile.bio,
        location: profile.location,
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Error saving profile');
    } else {
      toast.success('Profile updated successfully');
    }

    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Settings</h1>
        <p className="text-stone-400 font-light">Manage your account and preferences</p>
      </div>

      {isLoading ? (
        <div className="h-96 bg-stone-900 animate-pulse border border-stone-800" />
      ) : (
        <div className="border border-stone-800 p-8">
          <h2 className="text-2xl font-light mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-light mb-2">Full Name</label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2">Role/Title</label>
              <input
                type="text"
                value={profile?.role || ''}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                placeholder="e.g., Producer, Artist, Executive"
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2">Location</label>
              <input
                type="text"
                value={profile?.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, State"
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-2">Bio</label>
              <textarea
                value={profile?.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-amber-600 text-stone-950 px-8 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
