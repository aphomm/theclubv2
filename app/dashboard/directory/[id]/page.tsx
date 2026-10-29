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
  email?: string;
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
        return 'bg-accent-500 text-ink-950';
      case 'professional':
        return 'bg-ink-700 text-ink-100';
      default:
        return 'bg-ink-600/30 text-ink-300';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="h-96 bg-white/[0.04] animate-pulse rounded-sm border border-white/[0.08]" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/directory">
        <button className="flex items-center gap-2 text-accent-600 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      </Link>

      {/* Profile Header */}
      <div className="rounded-sm border border-white/[0.08] p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-accent-600 rounded-sm flex items-center justify-center">
              <span className="text-ink-950 text-5xl">
                {profile.name?.charAt(0) || '?'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl mb-2">{profile.name}</h1>
                {profile.role && (
                  <p className="text-lg text-accent-600 mb-2">{profile.role}</p>
                )}
                <span className={`text-xs px-3 py-1 uppercase tracking-wide rounded-sm ${getTierBadgeColor(profile.tier)}`}>
                  {profile.tier} Member
                </span>
              </div>

              {!isOwnProfile && (
                <Link href={`/dashboard/messages/${profile.id}`}>
                  <button className="border border-accent-600 text-accent-600 px-6 py-2 text-sm hover:bg-accent-600 hover:text-ink-950 transition-colors flex items-center gap-2 rounded-sm">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </Link>
              )}

              {isOwnProfile && (
                <Link href="/dashboard/settings">
                  <button className="border border-white/10 text-ink-400 px-6 py-2 text-sm hover:border-accent-600 hover:text-accent-600 transition-colors rounded-sm">
                    Edit Profile
                  </button>
                </Link>
              )}
            </div>

            {profile.location && (
              <p className="flex items-center gap-2 text-ink-400 mb-4">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}

            <p className="text-ink-500 text-sm">{formatJoinDate(profile.join_date)}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-8 pt-8 border-t border-white/[0.08]">
            <h3 className="text-sm text-ink-400 mb-3 uppercase tracking-wide">About</h3>
            <p className="text-ink-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-sm border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-accent-600" />
            <span className="text-sm text-ink-400">Events Attended</span>
          </div>
          <div className="text-3xl">{eventCount}</div>
        </div>
        <div className="rounded-sm border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-accent-600" />
            <span className="text-sm text-ink-400">Projects Created</span>
          </div>
          <div className="text-3xl">{projects.length}</div>
        </div>
        <div className="rounded-sm border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-5 h-5 text-accent-600" />
            <span className="text-sm text-ink-400">Membership Tier</span>
          </div>
          <div className="text-3xl capitalize">{profile.tier}</div>
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="rounded-sm border border-white/[0.08] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Projects</h2>
            <Link href="/dashboard/the-pool/projects">
              <button className="text-sm text-accent-600 hover:underline">
                View All
              </button>
            </Link>
          </div>

          <div className="space-y-4">
            {projects.map(project => {
              const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);

              return (
                <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                  <div className="rounded-sm border border-white/[0.08] p-6 hover:border-accent-600/60 transition-colors cursor-pointer hover:bg-white/[0.02]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-accent-600/20 text-accent-600 px-2 py-0.5 uppercase tracking-wide">
                            {project.category}
                          </span>
                          <span className={`text-xs px-2 py-0.5 uppercase tracking-wide ${
                            project.status === 'active'
                              ? 'bg-green-600/20 text-green-500'
                              : 'bg-ink-600/20 text-ink-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <h3 className="text-lg">{project.title}</h3>
                      </div>
                      <ExternalLink className="w-4 h-4 text-ink-500" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-400">
                        ${project.funding_raised.toLocaleString()} / ${project.funding_goal.toLocaleString()}
                      </span>
                      <span className="text-accent-600">{Math.round(percentFunded)}% funded</span>
                    </div>

                    <div className="w-full bg-white/[0.08] h-1 mt-3 rounded-full">
                      <div
                        className="bg-accent-500 h-full transition-all rounded-full"
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
        <div className="rounded-sm border border-white/[0.08] p-12 text-center">
          <TrendingUp className="w-12 h-12 text-ink-700 mx-auto mb-4" />
          <h3 className="text-lg mb-2">No Projects Yet</h3>
          <p className="text-ink-400 text-sm mb-6">
            Create your first project to start building your portfolio
          </p>
          <Link href="/dashboard/the-pool">
            <button className="border border-accent-600 text-accent-600 px-6 py-2 text-sm hover:bg-accent-600 hover:text-ink-950 transition-colors rounded-sm">
              Explore The Pool
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
