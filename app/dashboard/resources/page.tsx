'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  FileText, Video, Download, ExternalLink, File, Star,
  Briefcase, Scale, Mic2, TrendingUp, Share2, Music, LayoutGrid, BookOpen,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  featured: boolean;
  file_url?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.FC<{ className?: string }>, color: string, band: string, tile: string }> = {
  Business:     { icon: Briefcase,   color: 'text-amber-500',   band: 'bg-amber-500',   tile: 'border-amber-500/30 hover:border-amber-500/60' },
  Legal:        { icon: Scale,       color: 'text-blue-400',    band: 'bg-blue-400',    tile: 'border-blue-400/30 hover:border-blue-400/60' },
  Production:   { icon: Mic2,        color: 'text-purple-400',  band: 'bg-purple-400',  tile: 'border-purple-400/30 hover:border-purple-400/60' },
  Marketing:    { icon: TrendingUp,  color: 'text-emerald-400', band: 'bg-emerald-400', tile: 'border-emerald-400/30 hover:border-emerald-400/60' },
  Distribution: { icon: Share2,      color: 'text-teal-400',    band: 'bg-teal-400',    tile: 'border-teal-400/30 hover:border-teal-400/60' },
  Samples:      { icon: Music,       color: 'text-rose-400',    band: 'bg-rose-400',    tile: 'border-rose-400/30 hover:border-rose-400/60' },
  Templates:    { icon: LayoutGrid,  color: 'text-orange-400',  band: 'bg-orange-400',  tile: 'border-orange-400/30 hover:border-orange-400/60' },
  Tutorials:    { icon: BookOpen,    color: 'text-indigo-400',  band: 'bg-indigo-400',  tile: 'border-indigo-400/30 hover:border-indigo-400/60' },
};

const DEFAULT_CONFIG = { icon: FileText, color: 'text-amber-600', band: 'bg-amber-600', tile: 'border-amber-600/30 hover:border-amber-600/60' };

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || DEFAULT_CONFIG;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: allData } = await supabase
        .from('resources')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (allData) {
        const uniqueCategories = Array.from(new Set(allData.map((r) => r.category)));
        setAvailableCategories(uniqueCategories);

        if (filterCategory === 'all') {
          setResources(allData);
        } else {
          setResources(allData.filter((r) => r.category === filterCategory));
        }
      }

      setIsLoading(false);
    };

    fetchResources();
  }, [filterCategory]);

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5 text-amber-600" />;
      default:
        return <File className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Resource Library</h1>
        <p className="text-stone-400 font-light">Templates, guides, and materials to help you succeed</p>
      </div>

      {/* Category icon tiles */}
      {availableCategories.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {availableCategories.map((cat) => {
            const cfg = getCategoryConfig(cat);
            const IconComponent = cfg.icon;
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(isActive ? 'all' : cat)}
                className={`rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all ${
                  isActive
                    ? `${cfg.tile} bg-white/[0.06]`
                    : `border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] ${cfg.tile}`
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? cfg.color : 'text-stone-400'}`} />
                <span className={`text-[10px] font-light leading-tight text-center ${isActive ? cfg.color : 'text-stone-500'}`}>
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 text-sm font-light whitespace-nowrap transition-colors rounded-full border ${
            filterCategory === 'all'
              ? 'border-amber-600 text-amber-600 bg-amber-600/10'
              : 'border-white/10 text-stone-400 hover:border-amber-600/50'
          }`}
        >
          All
        </button>
        {availableCategories.map((cat) => {
          const cfg = getCategoryConfig(cat);
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 text-sm font-light whitespace-nowrap transition-colors rounded-full border ${
                filterCategory === cat
                  ? `border-amber-600 text-amber-600 bg-amber-600/10`
                  : 'border-white/10 text-stone-400 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-stone-900 animate-pulse rounded-2xl border border-white/[0.08]" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12">
          <p className="text-stone-400 font-light">No resources available yet</p>
          <p className="text-stone-500 font-light text-sm mt-2">Check back soon for new materials</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const cfg = getCategoryConfig(resource.category);
            return (
              <div
                key={resource.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  resource.featured
                    ? 'border-amber-600/40 bg-amber-600/5'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-amber-600/30 hover:bg-white/[0.04]'
                }`}
              >
                {/* Colored top band */}
                <div className={`h-1 ${cfg.band} opacity-70`} />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(resource.format)}
                      {resource.featured && <Star className="w-4 h-4 text-amber-600 fill-amber-600" />}
                    </div>
                    <span className="text-xs bg-white/[0.06] text-stone-400 px-3 py-1 font-light uppercase rounded-full">
                      {resource.format}
                    </span>
                  </div>

                  <h3 className="text-lg font-light mb-2 line-clamp-2">{resource.title}</h3>
                  <p className="text-stone-400 font-light text-sm mb-6 line-clamp-3">{resource.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1.5">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className="text-xs text-stone-500 font-light">{resource.category}</span>
                    </div>
                    {resource.file_url ? (
                      <button
                        onClick={() => handleResourceClick(resource)}
                        className="flex items-center gap-2 text-amber-600 hover:underline text-sm font-light"
                      >
                        {resource.format.toLowerCase() === 'link' ? (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-stone-600 font-light">Coming soon</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
