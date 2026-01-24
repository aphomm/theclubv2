'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, MoreVertical, X, Edit, Trash2, FileText, Video, File, Star, StarOff, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  format: string;
  featured: boolean;
  created_at: string;
}

const categories = ['Business', 'Legal', 'Production', 'Marketing', 'Distribution', 'Samples', 'Templates', 'Tutorials'];
const formats = ['PDF', 'Video', 'Audio', 'Template', 'Document', 'Spreadsheet', 'Link'];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Business',
    file_url: '',
    file_name: '',
    file_size: 0,
    format: 'PDF',
    featured: false,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    setResources(data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Business',
      file_url: '',
      file_name: '',
      file_size: 0,
      format: 'PDF',
      featured: false,
    });
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect format from file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      let format = 'Document';
      if (ext === 'pdf') format = 'PDF';
      else if (['mp4', 'mov', 'webm'].includes(ext || '')) format = 'Video';
      else if (['mp3', 'wav', 'aac'].includes(ext || '')) format = 'Audio';
      else if (['xlsx', 'xls', 'csv'].includes(ext || '')) format = 'Spreadsheet';
      else if (['doc', 'docx', 'txt'].includes(ext || '')) format = 'Document';
      else if (['psd', 'ai', 'sketch'].includes(ext || '')) format = 'Template';

      setFormData(prev => ({
        ...prev,
        format,
        file_name: file.name,
        file_size: file.size,
      }));
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${timestamp}_${safeName}`;

    setUploadingFile(true);

    const { data, error } = await supabase.storage
      .from('resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setUploadingFile(false);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Make sure the resources bucket exists.');
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resources')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    let fileUrl = formData.file_url;
    let fileName = formData.file_name;
    let fileSize = formData.file_size;

    // If a file is selected, upload it first
    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile);
      if (uploadedUrl) {
        fileUrl = uploadedUrl;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      } else {
        setIsSubmitting(false);
        return;
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('resources').insert([{
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_size: fileSize || null,
      format: formData.format,
      featured: formData.featured,
    }]);

    if (error) {
      toast.error('Failed to create resource');
    } else {
      toast.success('Resource created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchResources();
    }

    setIsSubmitting(false);
  };

  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingResource) return;

    setIsSubmitting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Configuration error');
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('resources')
      .update({
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        file_url: formData.file_url || null,
        format: formData.format,
        featured: formData.featured,
      })
      .eq('id', editingResource.id);

    if (error) {
      toast.error('Failed to update resource');
    } else {
      toast.success('Resource updated successfully');
      setShowEditModal(false);
      setEditingResource(null);
      resetForm();
      fetchResources();
    }

    setIsSubmitting(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      toast.error('Failed to delete resource');
    } else {
      toast.success('Resource deleted');
      setResources(prev => prev.filter(r => r.id !== resourceId));
    }

    setActiveMenu(null);
  };

  const toggleFeatured = async (resource: Resource) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('resources')
      .update({ featured: !resource.featured })
      .eq('id', resource.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      setResources(prev =>
        prev.map(r => r.id === resource.id ? { ...r, featured: !r.featured } : r)
      );
    }

    setActiveMenu(null);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      category: resource.category,
      file_url: resource.file_url || '',
      file_name: resource.file_name || '',
      file_size: resource.file_size || 0,
      format: resource.format,
      featured: resource.featured,
    });
    setSelectedFile(null);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const filteredResources = filterCategory === 'all'
    ? resources
    : resources.filter(r => r.category === filterCategory);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light mb-2">Resources</h1>
          <p className="text-stone-400 font-light">Manage the member resource library</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-stone-950 px-6 py-3 text-sm font-light hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 text-sm font-light border transition-colors ${
            filterCategory === 'all'
              ? 'border-amber-600 text-amber-600 bg-amber-600/10'
              : 'border-stone-700 text-stone-400 hover:border-stone-600'
          }`}
        >
          All ({resources.length})
        </button>
        {categories.map(cat => {
          const count = resources.filter(r => r.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 text-sm font-light border transition-colors ${
                filterCategory === cat
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Resources Table */}
      <div className="border border-stone-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-stone-900 rounded-full animate-pulse" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">
            {resources.length === 0
              ? 'No resources yet. Add your first resource to get started.'
              : 'No resources in this category.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Format
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Featured
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Added
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource, idx) => (
                  <tr key={resource.id} className={idx !== filteredResources.length - 1 ? 'border-b border-stone-800' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-amber-600">
                          {getFormatIcon(resource.format)}
                        </div>
                        <div>
                          <div className="font-light">{resource.title}</div>
                          {resource.description && (
                            <div className="text-xs text-stone-500 line-clamp-1 max-w-xs">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-stone-800 text-stone-300 px-3 py-1 font-light">
                        {resource.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {resource.format}
                    </td>
                    <td className="px-6 py-4">
                      {resource.featured ? (
                        <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                      ) : (
                        <Star className="w-5 h-5 text-stone-700" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === resource.id ? null : resource.id)}
                          className="text-stone-400 hover:text-amber-600 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeMenu === resource.id && (
                          <div className="absolute right-0 top-8 z-10 bg-stone-900 border border-stone-800 shadow-lg py-2 min-w-[150px]">
                            <button
                              onClick={() => toggleFeatured(resource)}
                              className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              {resource.featured ? (
                                <>
                                  <StarOff className="w-4 h-4" />
                                  Unfeature
                                </>
                              ) : (
                                <>
                                  <Star className="w-4 h-4" />
                                  Feature
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(resource)}
                              className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="w-full px-4 py-2 text-left text-sm font-light text-red-500 hover:bg-stone-800 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Add New Resource</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateResource} className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Sample Recording Contract"
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Format *</label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                  >
                    {formats.map(fmt => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the resource..."
                  rows={3}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                />
              </div>

              {/* File Upload Section */}
              <div className="border border-stone-700 border-dashed p-6">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                  <p className="text-sm text-stone-400 font-light mb-3">
                    {selectedFile ? (
                      <span className="text-amber-600">{selectedFile.name}</span>
                    ) : (
                      'Upload a file'
                    )}
                  </p>
                  <label className="cursor-pointer">
                    <span className="bg-stone-800 text-stone-300 px-4 py-2 text-sm font-light hover:bg-stone-700 transition-colors inline-block">
                      {uploadingFile ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        'Choose File'
                      )}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.mp3,.wav,.mp4,.mov,.webm,.txt,.psd,.ai"
                    />
                  </label>
                  {selectedFile && (
                    <p className="text-xs text-stone-500 mt-2">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-stone-950 px-4 text-xs text-stone-500">OR</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">External URL / Link</label>
                <input
                  type="url"
                  name="file_url"
                  value={formData.file_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  disabled={!!selectedFile}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-stone-500 mt-2">
                  Or paste a link (Google Drive, Dropbox, etc.)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  id="featured-create"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 bg-stone-900 border border-stone-700 accent-amber-600"
                />
                <label htmlFor="featured-create" className="text-sm font-light">
                  Feature this resource (shows at the top of the library)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 border border-stone-700 py-3 text-sm font-light hover:border-stone-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingResource && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Edit Resource</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResource(null);
                  resetForm();
                }}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditResource} className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Sample Recording Contract"
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Format *</label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
                  >
                    {formats.map(fmt => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the resource..."
                  rows={3}
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">File URL / Link</label>
                <input
                  type="url"
                  name="file_url"
                  value={formData.file_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                />
                <p className="text-xs text-stone-500 mt-2">
                  Paste a link to the file (Google Drive, Dropbox, etc.) or direct URL
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  id="featured-edit"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 bg-stone-900 border border-stone-700 accent-amber-600"
                />
                <label htmlFor="featured-edit" className="text-sm font-light">
                  Feature this resource (shows at the top of the library)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingResource(null);
                    resetForm();
                  }}
                  className="flex-1 border border-stone-700 py-3 text-sm font-light hover:border-stone-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 text-stone-950 py-3 text-sm font-light hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
