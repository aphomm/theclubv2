'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
}

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data } = await supabase
        .from('pool_projects')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });

      setProjects(data || []);
      setIsLoading(false);
    };

    fetchProjects();
  }, [filter]);

  return (
    <div className="max-w-6xl">
      <Link href="/dashboard/the-pool">
        <button className="flex items-center gap-2 text-amber-600 hover:underline mb-8 font-light">
          <ArrowLeft className="w-4 h-4" />
          Back to The Pool
        </button>
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">All Projects</h1>
        <p className="text-stone-400 font-light">Browse and invest in community projects</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-10 border-b border-stone-800 pb-6">
        {['active', 'completed', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-light transition-colors ${
              filter === f
                ? 'text-amber-600 border-b-2 border-amber-600 pb-4'
                : 'text-stone-400 hover:text-amber-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-stone-800 p-12">
          <p className="text-stone-400 font-light">No {filter} projects found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map(project => {
            const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);

            return (
              <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                <div className="border border-stone-800 p-8 hover:border-amber-600 transition-colors cursor-pointer hover:bg-stone-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase tracking-wide">
                          {project.category}
                        </span>
                        <span className="text-xs bg-green-600/20 text-green-500 px-3 py-1 font-light uppercase tracking-wide">
                          {Math.round(percentFunded)}% Funded
                        </span>
                      </div>
                      <h3 className="text-2xl font-light mb-2">{project.title}</h3>
                      <p className="text-stone-400 font-light line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-stone-900">
                    <div>
                      <div className="text-xs text-stone-400 font-light mb-1">FUNDED</div>
                      <div className="font-light">
                        ${(project.funding_raised / 1000).toFixed(0)}K /{' '}
                        <span className="text-stone-400">
                          ${(project.funding_goal / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="w-full bg-stone-900 h-2 mt-2">
                        <div
                          className="bg-amber-600 h-full"
                          style={{ width: `${percentFunded}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
