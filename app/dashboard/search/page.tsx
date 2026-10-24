'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Search, Users, Calendar, TrendingUp, FileText, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: string;
  name: string;
  role?: string;
  tier: string;
  location?: string;
}

interface Event {
  id: string;
  title: string;
  event_type: string;
  date: string;
  location: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  status: string;
  funding_goal: number;
  funding_raised: number;
}

interface Resource {
  id: string;
  title: string;
  category: string;
  format: string;
}

type SearchTab = 'all' | 'members' | 'events' | 'projects' | 'resources';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMembers([]);
      setEvents([]);
      setProjects([]);
      setResources([]);
      return;
    }

    setIsLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchTerm = `%${searchQuery}%`;

    const [membersResult, eventsResult, projectsResult, resourcesResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, role, tier, location')
        .eq('status', 'active')
        .or(`name.ilike.${searchTerm},role.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(20),
      supabase
        .from('events')
        .select('id, title, event_type, date, location')
        .or(`title.ilike.${searchTerm},location.ilike.${searchTerm},event_type.ilike.${searchTerm}`)
        .order('date', { ascending: false })
        .limit(20),
      supabase
        .from('pool_projects')
        .select('id, title, category, status, funding_goal, funding_raised')
        .or(`title.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(20),
      supabase
        .from('resources')
        .select('id, title, category, format')
        .or(`title.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(20),
    ]);

    setMembers(membersResult.data || []);
    setEvents(eventsResult.data || []);
    setProjects(projectsResult.data || []);
    setResources(resourcesResult.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const totalResults = members.length + events.length + projects.length + resources.length;

  const tabs: { id: SearchTab; label: string; count: number; icon: any }[] = [
    { id: 'all', label: 'All', count: totalResults, icon: Search },
    { id: 'members', label: 'Members', count: members.length, icon: Users },
    { id: 'events', label: 'Events', count: events.length, icon: Calendar },
    { id: 'projects', label: 'Projects', count: projects.length, icon: TrendingUp },
    { id: 'resources', label: 'Resources', count: resources.length, icon: FileText },
  ];

  const showMembers = activeTab === 'all' || activeTab === 'members';
  const showEvents = activeTab === 'all' || activeTab === 'events';
  const showProjects = activeTab === 'all' || activeTab === 'projects';
  const showResources = activeTab === 'all' || activeTab === 'resources';

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-4xl mb-2">Search</h1>
        <p className="text-ink-400">
          Find members, events, projects, and resources
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-4 w-5 h-5 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ICWT..."
          autoFocus
          className="w-full bg-white/[0.04] border border-white/10 pl-12 pr-4 py-4 text-lg text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-accent-600 transition-colors rounded-sm"
        />
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm border whitespace-nowrap transition-colors rounded-sm ${
                activeTab === tab.id
                  ? 'border-accent-600 text-accent-600 bg-accent-600/10'
                  : 'border-white/10 text-ink-400 hover:border-white/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="text-xs bg-ink-800 px-2 py-0.5 rounded-sm">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-white/[0.04] animate-pulse rounded-sm border border-white/[0.08]" />
          ))}
        </div>
      ) : !query ? (
        <div className="text-center py-20 rounded-sm border border-white/[0.08]">
          <Search className="w-12 h-12 text-ink-700 mx-auto mb-4" />
          <p className="text-ink-400">Enter a search term to find members, events, and more</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-20 rounded-sm border border-white/[0.08]">
          <Search className="w-12 h-12 text-ink-700 mx-auto mb-4" />
          <p className="text-ink-400">No results found for "{query}"</p>
          <p className="text-ink-500 text-sm mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Members Results */}
          {showMembers && members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-600" />
                  Members ({members.length})
                </h2>
                {activeTab === 'all' && members.length > 3 && (
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-sm text-accent-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(activeTab === 'all' ? members.slice(0, 3) : members).map(member => (
                  <Link key={member.id} href={`/dashboard/directory/${member.id}`}>
                    <div className="rounded-sm border border-white/[0.08] p-4 hover:border-accent-600/60 transition-all hover:bg-white/[0.02] flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-ink-950">
                          {member.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="">{member.name}</div>
                        <div className="flex items-center gap-3 text-sm">
                          {member.role && (
                            <span className="text-accent-600">{member.role}</span>
                          )}
                          {member.location && (
                            <span className="text-ink-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {member.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-accent-600/20 text-accent-600 px-2 py-1 rounded-sm">
                        {member.tier}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Events Results */}
          {showEvents && events.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-600" />
                  Events ({events.length})
                </h2>
                {activeTab === 'all' && events.length > 3 && (
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-sm text-accent-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(activeTab === 'all' ? events.slice(0, 3) : events).map(event => (
                  <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                    <div className="rounded-sm border border-white/[0.08] p-4 hover:border-accent-600/60 transition-all hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="mb-1">{event.title}</div>
                          <div className="flex items-center gap-3 text-sm text-ink-400">
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <span className="text-xs bg-accent-600/20 text-accent-600 px-2 py-1 rounded-sm uppercase">
                          {event.event_type}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {showProjects && projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-600" />
                  Projects ({projects.length})
                </h2>
                {activeTab === 'all' && projects.length > 3 && (
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-sm text-accent-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(activeTab === 'all' ? projects.slice(0, 3) : projects).map(project => {
                  const percentFunded = Math.min((project.funding_raised / project.funding_goal) * 100, 100);
                  return (
                    <Link key={project.id} href={`/dashboard/the-pool/projects/${project.id}`}>
                      <div className="rounded-sm border border-white/[0.08] p-4 hover:border-accent-600/60 transition-all hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="mb-1">{project.title}</div>
                            <span className="text-xs bg-white/[0.08] text-ink-300 px-2 py-1 rounded-sm">
                              {project.category}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 uppercase ${
                            project.status === 'active'
                              ? 'bg-green-600/20 text-green-500'
                              : 'bg-ink-600/20 text-ink-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex-1 bg-white/[0.08] h-1 rounded-full">
                            <div
                              className="bg-accent-600 h-full rounded-full"
                              style={{ width: `${percentFunded}%` }}
                            />
                          </div>
                          <span className="text-ink-400 text-xs">
                            {Math.round(percentFunded)}% funded
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resources Results */}
          {showResources && resources.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent-600" />
                  Resources ({resources.length})
                </h2>
                {activeTab === 'all' && resources.length > 3 && (
                  <button
                    onClick={() => setActiveTab('resources')}
                    className="text-sm text-accent-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(activeTab === 'all' ? resources.slice(0, 3) : resources).map(resource => (
                  <Link key={resource.id} href="/dashboard/resources">
                    <div className="rounded-sm border border-white/[0.08] p-4 hover:border-accent-600/60 transition-all hover:bg-white/[0.02] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-accent-600" />
                        <div>
                          <div className="">{resource.title}</div>
                          <span className="text-xs text-ink-500">{resource.category}</span>
                        </div>
                      </div>
                      <span className="text-xs bg-white/[0.08] text-ink-300 px-2 py-1 rounded-sm">
                        {resource.format}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Next 15 requires useSearchParams() inside a Suspense boundary for prerendering.
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
