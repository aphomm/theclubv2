'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, X, Eye, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface PoolProject {
  id: string;
  title: string;
  description: string;
  tagline: string;
  creator_id: string;
  category: string;
  funding_goal: number;
  funding_raised: number;
  status: string;
  expected_completion: string;
  location: string;
  created_at: string;
  creator?: {
    name: string;
    email: string;
    tier: string;
  };
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  active: 'text-green-500 bg-green-500/10 border-green-500/30',
  completed: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  rejected: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Review',
  active: 'Live',
  completed: 'Completed',
  rejected: 'Rejected',
};

export default function AdminPoolPage() {
  const [projects, setProjects] = useState<PoolProject[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PoolProject | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const client = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await client
      .from('pool_projects')
      .select(`
        *,
        creator:users!pool_projects_creator_id_fkey (
          name,
          email,
          tier
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } else {
      console.log('Projects fetched:', data?.map(p => ({ id: p.id, title: p.title, status: p.status })));
      setProjects(data || []);
    }

    setIsLoading(false);
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const client = createClient(supabaseUrl, supabaseKey);

    const { error } = await client
      .from('pool_projects')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update project status');
      console.error('Status update error:', error);
    } else {
      toast.success(`Project ${newStatus === 'active' ? 'approved and now live' : newStatus}`);
      
      // Force immediate local state update multiple ways
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      
      // Multiple refetch attempts
      setTimeout(async () => {
        await fetchProjects();
        console.log('First refetch completed');
      }, 500);
      
      setTimeout(async () => {
        await fetchProjects();
        console.log('Second refetch completed');
      }, 2000);
      
      setShowDetailModal(false);
    }
  };

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter);

  const pendingCount = projects.filter(p => p.status === 'pending').length;

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light mb-2">The Pool - Projects</h1>
          <p className="text-stone-400 font-light">
            Review and manage member-submitted projects
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-500">({pendingCount} pending review)</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-8 border-b border-stone-800 pb-4">
        {['all', 'pending', 'active', 'completed', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-light transition-colors ${
              filter === status
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-stone-400 hover:text-amber-600'
            }`}
          >
            {status === 'all' ? 'All' : statusLabels[status] || status}
            {status === 'pending' && pendingCount > 0 && (
              <span className="ml-1 text-xs bg-yellow-500 text-stone-950 px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Projects Table */}
      <div className="border border-stone-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-stone-900 rounded-full animate-pulse" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">
            No projects found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Creator
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Funding Goal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, idx) => (
                  <tr
                    key={project.id}
                    className={idx !== filteredProjects.length - 1 ? 'border-b border-stone-800' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-light truncate">{project.title}</div>
                        <div className="text-xs text-stone-500 truncate">{project.tagline}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-light">{project.creator?.name || 'Unknown'}</div>
                      <div className="text-xs text-stone-500">{project.creator?.tier}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-stone-800 text-stone-300 px-3 py-1 font-light">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-light">
                      ${project.funding_goal?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 border font-light ${statusColors[project.status] || ''}`}>
                        {statusLabels[project.status] || project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-stone-400 hover:text-amber-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {project.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateProjectStatus(project.id, 'active')}
                              className="p-2 text-stone-400 hover:text-green-500 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateProjectStatus(project.id, 'rejected')}
                              className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Project Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <span className={`text-xs px-3 py-1 border font-light ${statusColors[selectedProject.status] || ''}`}>
                  {statusLabels[selectedProject.status] || selectedProject.status}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-light mb-1">{selectedProject.title}</h3>
                <p className="text-amber-600 font-light">{selectedProject.tagline}</p>
              </div>

              <div className="border border-stone-800 p-4">
                <h4 className="text-sm text-stone-400 font-light mb-2">Creator</h4>
                <div className="font-light">{selectedProject.creator?.name}</div>
                <div className="text-sm text-stone-500">{selectedProject.creator?.email}</div>
                <div className="text-xs text-amber-600 mt-1">{selectedProject.creator?.tier} tier</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-stone-800 p-4">
                  <h4 className="text-sm text-stone-400 font-light mb-2">Funding Goal</h4>
                  <div className="text-xl font-light text-amber-600">
                    ${selectedProject.funding_goal?.toLocaleString()}
                  </div>
                </div>
                <div className="border border-stone-800 p-4">
                  <h4 className="text-sm text-stone-400 font-light mb-2">Category</h4>
                  <div className="font-light">{selectedProject.category}</div>
                </div>
              </div>

              <div className="border border-stone-800 p-4">
                <h4 className="text-sm text-stone-400 font-light mb-2">Description</h4>
                <p className="font-light text-stone-300 whitespace-pre-wrap">
                  {selectedProject.description}
                </p>
              </div>

              {selectedProject.expected_completion && (
                <div className="border border-stone-800 p-4">
                  <h4 className="text-sm text-stone-400 font-light mb-2">Expected Completion</h4>
                  <div className="font-light">
                    {new Date(selectedProject.expected_completion).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}

              <div className="text-xs text-stone-500">
                Submitted on{' '}
                {new Date(selectedProject.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              {/* Action Buttons */}
              {selectedProject.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-stone-800">
                  <button
                    onClick={() => updateProjectStatus(selectedProject.id, 'active')}
                    className="flex-1 bg-green-600 text-white py-3 text-sm font-light hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Make Live
                  </button>
                  <button
                    onClick={() => updateProjectStatus(selectedProject.id, 'rejected')}
                    className="flex-1 border border-red-600 text-red-500 py-3 text-sm font-light hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {selectedProject.status === 'active' && (
                <div className="pt-4 border-t border-stone-800">
                  <Link href={`/dashboard/the-pool/projects/${selectedProject.id}`}>
                    <button className="w-full bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors">
                      View Public Project Page
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
