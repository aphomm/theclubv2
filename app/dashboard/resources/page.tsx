'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, Video, Download } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  featured: boolean;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase.from('resources').select('*');

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data } = await query.order('created_at', { ascending: false });

      setResources(data || []);
      setIsLoading(false);
    };

    fetchResources();
  }, [filterCategory]);

  const categories = [
    'all',
    'Legal Templates',
    'Marketing Resources',
    'Business Development',
    'Technical Guides',
    'Industry Reports',
  ];

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-light mb-2">Resource Library</h1>
        <p className="text-stone-400 font-light">Templates, guides, and materials to help you succeed</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap transition-colors border ${
              filterCategory === cat
                ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                : 'border-stone-700 text-stone-400 hover:border-amber-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-stone-900 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 border border-stone-800 p-12">
          <p className="text-stone-400 font-light">No resources found in this category</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <div key={resource.id} className="border border-stone-800 p-6 hover:border-amber-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                {getFormatIcon(resource.format)}
                <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase">
                  {resource.format}
                </span>
              </div>

              <h3 className="text-lg font-light mb-2 line-clamp-2">{resource.title}</h3>
              <p className="text-stone-400 font-light text-sm mb-6 line-clamp-3">{resource.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <span className="text-xs text-stone-500 font-light">{resource.category}</span>
                <button className="flex items-center gap-2 text-amber-600 hover:underline text-sm font-light">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
