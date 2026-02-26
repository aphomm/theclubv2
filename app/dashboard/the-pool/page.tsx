'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DollarSign, TrendingUp, Users, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
  creator_id: string;
}

export default function ThePoolPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);

  useEffect(() => {
    const fetchPoolData = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [projectsData, investmentsData, activeCount, completedCount] = await Promise.all([
        supabase.from('pool_projects').select('*').eq('status', 'active').limit(6),
        supabase.from('pool_investments').select('*').eq('user_id', user.id),
        supabase.from('pool_projects').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('pool_projects').select('*', { count: 'exact' }).eq('status', 'completed'),
      ]);

      setProjects(projectsData.data || []);
      setUserInvestments(investmentsData.data || []);

      const totalInvested = investmentsData.data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

      setStats({
        totalInvested,
        activeProjects: activeCount.count || 0,
        completedProjects: completedCount.count || 0,
      });

      setIsLoading(false);
    };

    fetchPoolData();
  }, []);

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex items-center gap-4 mb-4">
        <Icon className="w-6 h-6 text-amber-600" />
        <div>
          <div className="text-xs text-stone-400 font-light tracking-wide">TOTAL {label.toUpperCase()}</div>
          <div className="text-3xl font-light">{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="text-4xl font-light mb-2">THE POOL</h1>
          <p className="text-stone-400 font-light">
            Collaborative projects where members fund, create, and share in the success
          </p>
        </div>
        <Link href="/dashboard/the-pool/projects/new">
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-6 py-3 text-sm font-light hover:opacity-90 transition-opacity rounded-full">
            <Plus className="w-5 h-5" />
            Start a Project
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={DollarSign} label="Invested" value={`$${stats.totalInvested.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Active Projects" value={stats.activeProjects} />
        <StatCard icon={Calendar} label="Completed" value={stats.completedProjects} />
      </div>

      {/* Featured Section */}
      <div className="rounded-2xl border border-amber-600/20 bg-gradient-to-br from-amber-600/8 to-transparent p-12 mb-12 relative overflow-hidden">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-light mb-4">Build Together, Win Together</h2>
          <p className="text-stone-300 font-light leading-relaxed mb-8">
            Have a project that needs funding? Launch it here and get support from the ICWT community.
            Or browse active projects and invest your cash, time, or equipment for equity ownership.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/the-pool/projects/new">
              <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-8 py-4 text-sm font-light tracking-wide hover:opacity-90 transition-opacity rounded-full">
                Start Your Project
              </button>
            </Link>
            <Link href="/dashboard/the-pool/projects">
              <button className="border border-amber-600/60 text-amber-600 px-8 py-4 text-sm font-light tracking-wide hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full">
                Browse Projects
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light">Active Projects</h2>
          <Link href="/dashboard/the-pool/projects">
            <button className="text-sm text-amber-600 hover:underline font-light">View All</button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-white/[0.04] animate-pulse rounded-2xl border border-white/[0.08]" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/[0.08] p-12">
            <p className="text-stone-400 font-light">No active projects available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => {
              const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);

              return (
                <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                  <div className="rounded-2xl border border-white/[0.08] p-8 hover:border-amber-600/50 transition-all cursor-pointer hover:bg-white/[0.03] h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide rounded-full">
                        {project.category}
                      </span>
                      <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1 font-light uppercase tracking-wide">
                        {Math.round(percentFunded)}% Funded
                      </span>
                    </div>

                    <h3 className="text-xl font-light mb-2 line-clamp-2">{project.title}</h3>
                    <p className="text-stone-400 font-light text-sm mb-6 line-clamp-2 flex-1">
                      {project.description}
                    </p>

                    {/* Funding Progress */}
                    <div className="mb-6 pt-6 border-t border-white/[0.06]">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <div className="text-xs text-stone-400 font-light">Funded</div>
                          <div className="font-light">
                            ${(project.funding_raised / 1000).toFixed(0)}K{' '}
                            <span className="text-stone-400 text-sm">
                              / ${(project.funding_goal / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.08] h-2 rounded-full">
                        <div
                          className="bg-amber-600 h-full transition-all rounded-full"
                          style={{ width: `${percentFunded}%` }}
                        />
                      </div>
                    </div>

                    <button className="w-full border border-amber-600/60 text-amber-600 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors rounded-full">
                      View Details
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Your Investments */}
      <div className="mt-16">
        <h2 className="text-2xl font-light mb-8">
          Your Investments{userInvestments.length > 0 ? ` (${userInvestments.length})` : ''}
        </h2>
        {userInvestments.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] p-12 text-center">
            <TrendingUp className="w-10 h-10 text-amber-600/40 mx-auto mb-4" />
            <p className="text-stone-300 font-light mb-1">No investments yet</p>
            <p className="text-sm text-stone-500 font-light">
              Browse projects above to make your first investment
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] p-8">
            <div className="space-y-4">
              {userInvestments.slice(0, 3).map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-white/[0.06] last:border-b-0">
                  <div>
                    <div className="font-light capitalize">{inv.contribution_type}</div>
                    <div className="text-sm text-stone-400 font-light">{inv.equity_percentage}% equity</div>
                  </div>
                  <div className="text-right">
                    <div className="font-light">${inv.amount?.toLocaleString() || 'N/A'}</div>
                    <div className={`text-xs font-light ${inv.status === 'active' ? 'text-green-500' : 'text-stone-400'}`}>
                      {inv.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
