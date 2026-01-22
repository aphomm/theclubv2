'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
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
    <div className="border border-stone-800 p-6">
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
      <div className="mb-12">
        <h1 className="text-4xl font-light mb-2">THE POOL</h1>
        <p className="text-stone-400 font-light">
          Collaborative projects where members fund, create, and share in the success
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={DollarSign} label="Invested" value={`$${stats.totalInvested.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Active Projects" value={stats.activeProjects} />
        <StatCard icon={Calendar} label="Completed" value={stats.completedProjects} />
      </div>

      {/* Featured Section */}
      <div className="border border-amber-600/30 bg-gradient-to-br from-amber-600/5 to-transparent p-12 mb-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-light mb-4">Featured Opportunity</h2>
          <p className="text-stone-300 font-light leading-relaxed mb-8">
            Browse active projects, learn about investment opportunities, and gain equity ownership in
            collaborative music ventures. Every contribution—cash, time, or equipment—receives transparent equity allocation.
          </p>
          <Link href="/dashboard/the-pool/projects">
            <button className="border border-amber-600 text-amber-600 px-12 py-4 text-sm font-light tracking-wide hover:bg-amber-600 hover:text-stone-950 transition-colors">
              Browse All Projects
            </button>
          </Link>
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
              <div key={i} className="h-96 bg-stone-900 animate-pulse border border-stone-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-stone-800 p-12">
            <p className="text-stone-400 font-light">No active projects available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => {
              const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);

              return (
                <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                  <div className="border border-stone-800 p-8 hover:border-amber-600 transition-colors cursor-pointer hover:bg-stone-900/50 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide">
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
                    <div className="mb-6 pt-6 border-t border-stone-800">
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
                      <div className="w-full bg-stone-900 h-2">
                        <div
                          className="bg-amber-600 h-full transition-all"
                          style={{ width: `${percentFunded}%` }}
                        />
                      </div>
                    </div>

                    <button className="w-full border border-amber-600 text-amber-600 py-2 text-sm font-light hover:bg-amber-600 hover:text-stone-950 transition-colors">
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
      {userInvestments.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-light mb-8">Your Investments ({userInvestments.length})</h2>
          <div className="border border-stone-800 p-8">
            <div className="space-y-4">
              {userInvestments.slice(0, 3).map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-stone-800 last:border-b-0">
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
        </div>
      )}
    </div>
  );
}
