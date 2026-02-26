'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, MapPin, MessageCircle, Calendar, Music, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  tier: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  join_date?: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  status: string;
  funding_goal: number;
  funding_raised: number;
}

interface EventRSVP {
  id: string;
  event_id: string;
  events?: {
    id: string;
    title: string;
    date: string;
    event_type: string;
  };
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        setIsOwnProfile(user.id === params.id);
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (!profileData) {
        toast.error('Member not found');
        router.push('/dashboard/directory');
        return;
      }

      setProfile(profileData);

      // Fetch user's projects (as creator)
      const { data: projectsData } = await supabase
        .from('pool_projects')
        .select('id, title, category, status, funding_goal, funding_raised')
        .eq('creator_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setProjects(projectsData || []);

      // Fetch event count
      const { count: eventAttendanceCount } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', params.id);

      setEventCount(eventAttendanceCount || 0);

      setIsLoading(false);
    };

    fetchProfile();
  }, [params.id, router]);

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Member';
    const date = new Date(dateStr);
    return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'executive':
        return 'bg-amber-600/30 text-amber-500';
      case 'professional':
        return 'bg-blue-600/30 text-blue-400';
      default:
        return 'bg-stone-600/30 text-stone-300';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="h-96 bg-white/[0.04] animate-pulse rounded-2xl border border-white/[0.08]" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/directory">
        <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      </Link>

      {/* Profile Header */}
      <div className="rounded-2xl border border-white/[0.08] p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
              <span className="text-stone-950 text-5xl font-light">
                {profile.name?.charAt(0) || '?'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-light mb-2">{profile.name}</h1>
                {profile.role && (
                  <p className="text-lg text-amber-600 font-light mb-2">{profile.role}</p>
                )}
                <span className={`text-xs px-3 py-1 font-light uppercase tracking-wide rounded-full ${getTierBadgeColor(profile.tier)}`}>
                  {profile.tier} Member
                </span>
              </div>

              {!isOwnProfile && (
                <Link href={`/dashboard/messages/${profile.id}`}>
                  <button className="border border-amber-600 text-amber-600 px-6 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors flex items-center gap-2 rounded-full">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </Link>
              )}

              {isOwnProfile && (
                <Link href="/dashboard/settings">
                  <button className="border border-white/10 text-stone-400 px-6 py-2 text-sm font-light hover:border-amber-600 hover:text-amber-600 transition-colors rounded-full">
                    Edit Profile
                  </button>
                </Link>
              )}
            </div>

            {profile.location && (
              <p className="flex items-center gap-2 text-stone-400 font-light mb-4">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}

            <p className="text-stone-500 font-light text-sm">{formatJoinDate(profile.join_date)}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-8 pt-8 border-t border-white/[0.08]">
            <h3 className="text-sm text-stone-400 font-light mb-3 uppercase tracking-wide">About</h3>
            <p className="text-stone-300 font-light leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-stone-400 font-light">Events Attended</span>
          </div>
          <div className="text-3xl font-light">{eventCount}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-stone-400 font-light">Projects Created</span>
          </div>
          <div className="text-3xl font-light">{projects.length}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-stone-400 font-light">Membership Tier</span>
          </div>
          <div className="text-3xl font-light capitalize">{profile.tier}</div>
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light">Projects</h2>
            <Link href="/dashboard/the-pool/projects">
              <button className="text-sm text-amber-600 hover:underline font-light">
                View All
              </button>
            </Link>
          </div>

          <div className="space-y-4">
            {projects.map(project => {
              const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);

              return (
                <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                  <div className="rounded-xl border border-white/[0.08] p-6 hover:border-amber-600/60 transition-colors cursor-pointer hover:bg-white/[0.02]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-amber-600/20 text-amber-600 px-2 py-0.5 font-light uppercase tracking-wide">
                            {project.category}
                          </span>
                          <span className={`text-xs px-2 py-0.5 font-light uppercase tracking-wide ${
                            project.status === 'active'
                              ? 'bg-green-600/20 text-green-500'
                              : 'bg-stone-600/20 text-stone-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <h3 className="font-light text-lg">{project.title}</h3>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-500" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400 font-light">
                        ${project.funding_raised.toLocaleString()} / ${project.funding_goal.toLocaleString()}
                      </span>
                      <span className="text-amber-600 font-light">{Math.round(percentFunded)}% funded</span>
                    </div>

                    <div className="w-full bg-white/[0.08] h-1 mt-3 rounded-full">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all rounded-full"
                        style={{ width: `${percentFunded}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State for Own Profile */}
      {isOwnProfile && projects.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] p-12 text-center">
          <TrendingUp className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <h3 className="text-lg font-light mb-2">No Projects Yet</h3>
          <p className="text-stone-400 font-light text-sm mb-6">
            Create your first project to start building your portfolio
          </p>
          <Link href="/dashboard/the-pool">
            <button className="border border-amber-600 text-amber-600 px-6 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full">
              Explore The Pool
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
