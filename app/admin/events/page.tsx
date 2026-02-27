'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, MoreVertical, X, Edit, Trash2, Eye, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  instructor_name?: string;
  instructor_title?: string;
  instructor_bio?: string;
  tier_access: string[];
  external_rsvp_url?: string;
  image_url?: string;
  created_at: string;
}

const eventTypes = ['Masterclass', 'Networking', 'Studio Session', 'Workshop', 'Panel', 'Concert', 'Private Event'];
const tierOptions = ['Creator', 'Professional', 'Executive'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Masterclass',
    date: '',
    time: '18:00',
    location: 'WePlay Studios',
    capacity: 50,
    instructor_name: '',
    instructor_title: '',
    instructor_bio: '',
    tier_access: ['Creator', 'Professional', 'Executive'],
    external_rsvp_url: '',
    image_url: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    setEvents(data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'Masterclass',
      date: '',
      time: '18:00',
      location: 'WePlay Studios',
      capacity: 50,
      instructor_name: '',
      instructor_title: '',
      instructor_bio: '',
      tier_access: ['Creator', 'Professional', 'Executive'],
      external_rsvp_url: '',
      image_url: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTierToggle = (tier: string) => {
    setFormData(prev => ({
      ...prev,
      tier_access: prev.tier_access.includes(tier)
        ? prev.tier_access.filter(t => t !== tier)
        : [...prev.tier_access, tier],
    }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('events').insert([{
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      capacity: formData.capacity,
      instructor_name: formData.instructor_name || null,
      instructor_title: formData.instructor_title || null,
      instructor_bio: formData.instructor_bio || null,
      tier_access: formData.tier_access,
      external_rsvp_url: formData.external_rsvp_url || null,
      image_url: formData.image_url || null,
    }]);

    if (error) {
      toast.error('Failed to create event');
    } else {
      toast.success('Event created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchEvents();
    }

    setIsSubmitting(false);
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEvent) return;

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
      .from('events')
      .update({
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        capacity: formData.capacity,
        instructor_name: formData.instructor_name || null,
        instructor_title: formData.instructor_title || null,
        instructor_bio: formData.instructor_bio || null,
        tier_access: formData.tier_access,
        external_rsvp_url: formData.external_rsvp_url || null,
        image_url: formData.image_url || null,
      })
      .eq('id', editingEvent.id);

    if (error) {
      toast.error('Failed to update event');
    } else {
      toast.success('Event updated successfully');
      setShowEditModal(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    }

    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted');
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }

    setActiveMenu(null);
    setMenuPosition(null);
    setActiveEvent(null);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      instructor_name: event.instructor_name || '',
      instructor_title: event.instructor_title || '',
      instructor_bio: event.instructor_bio || '',
      tier_access: event.tier_access || ['Creator', 'Professional', 'Executive'],
      external_rsvp_url: event.external_rsvp_url || '',
      image_url: event.image_url || '',
    });
    setShowEditModal(true);
    setActiveMenu(null);
    setMenuPosition(null);
    setActiveEvent(null);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light mb-2">Events</h1>
          <p className="text-stone-400 font-light">Manage club events and masterclasses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-6 py-3 text-sm font-light hover:opacity-90 transition-opacity rounded-full"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-white/[0.08]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-white/[0.08] rounded-full animate-pulse" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">
            No events found. Create your first event to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Capacity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Tier Access
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-light text-stone-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={event.id} className={idx !== events.length - 1 ? 'border-b border-white/[0.06]' : ''}>
                    <td className="px-6 py-4 font-light max-w-sm truncate">{event.title}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase rounded-full">
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">{event.location}</td>
                    <td className="px-6 py-4 font-light">{event.capacity}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(event.tier_access || []).map(tier => (
                          <span key={tier} className="text-xs bg-white/[0.08] text-stone-400 px-2 py-0.5 font-light rounded-full">
                            {tier}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          if (activeMenu === event.id) {
                            setActiveMenu(null);
                            setMenuPosition(null);
                            setActiveEvent(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({ x: rect.right, y: rect.bottom });
                            setActiveMenu(event.id);
                            setActiveEvent(event);
                          }
                        }}
                        className="text-stone-400 hover:text-amber-600 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
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
          <div className="bg-stone-950 rounded-2xl border border-white/[0.08] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Create New Event</h2>
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
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Songwriting Masterclass"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Event Type *</label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., WePlay Studios - Main Room"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">External RSVP/Ticketing URL (Optional)</label>
                <input
                  type="url"
                  name="external_rsvp_url"
                  value={formData.external_rsvp_url}
                  onChange={handleInputChange}
                  placeholder="e.g., https://eventbrite.com/your-event"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
                <p className="text-xs text-stone-500 mt-1">If set, users will be redirected here for RSVP</p>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Event Flyer / Image URL (Optional)</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="e.g., https://your-storage.com/flyer.jpg"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
                {formData.image_url && (
                  <div className="mt-3 w-32 rounded-xl overflow-hidden border border-white/[0.08]">
                    <img src={formData.image_url} alt="Flyer preview" className="w-full h-auto" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the event..."
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-3 block">Tier Access</label>
                <div className="flex gap-3">
                  {tierOptions.map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleTierToggle(tier)}
                      className={`px-4 py-2 text-sm font-light border transition-colors rounded-full ${
                        formData.tier_access.includes(tier)
                          ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                          : 'border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h4 className="text-sm text-stone-400 font-light mb-4">Instructor Details (Optional)</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    placeholder="Instructor name"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  />
                  <input
                    type="text"
                    name="instructor_title"
                    value={formData.instructor_title}
                    onChange={handleInputChange}
                    placeholder="Instructor title (e.g., Grammy-winning Producer)"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  />
                  <textarea
                    name="instructor_bio"
                    value={formData.instructor_bio}
                    onChange={handleInputChange}
                    placeholder="Brief bio..."
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 border border-white/10 py-3 text-sm font-light hover:border-white/20 transition-colors rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
                >
                  {isSubmitting ? 'Saving...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 rounded-2xl border border-white/[0.08] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light">Edit Event</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditEvent} className="space-y-6">
              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Songwriting Masterclass"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Event Type *</label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-400 font-light mb-2 block">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., WePlay Studios - Main Room"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">External RSVP/Ticketing URL (Optional)</label>
                <input
                  type="url"
                  name="external_rsvp_url"
                  value={formData.external_rsvp_url}
                  onChange={handleInputChange}
                  placeholder="e.g., https://eventbrite.com/your-event"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
                <p className="text-xs text-stone-500 mt-1">If set, users will be redirected here for RSVP</p>
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Event Flyer / Image URL (Optional)</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="e.g., https://your-storage.com/flyer.jpg"
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                />
                {formData.image_url && (
                  <div className="mt-3 w-32 rounded-xl overflow-hidden border border-white/[0.08]">
                    <img src={formData.image_url} alt="Flyer preview" className="w-full h-auto" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the event..."
                  rows={4}
                  className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm text-stone-400 font-light mb-3 block">Tier Access</label>
                <div className="flex gap-3">
                  {tierOptions.map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleTierToggle(tier)}
                      className={`px-4 py-2 text-sm font-light border transition-colors rounded-full ${
                        formData.tier_access.includes(tier)
                          ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                          : 'border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h4 className="text-sm text-stone-400 font-light mb-4">Instructor Details (Optional)</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    placeholder="Instructor name"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  />
                  <input
                    type="text"
                    name="instructor_title"
                    value={formData.instructor_title}
                    onChange={handleInputChange}
                    placeholder="Instructor title (e.g., Grammy-winning Producer)"
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors rounded-xl"
                  />
                  <textarea
                    name="instructor_bio"
                    value={formData.instructor_bio}
                    onChange={handleInputChange}
                    placeholder="Brief bio..."
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="flex-1 border border-white/10 py-3 text-sm font-light hover:border-white/20 transition-colors rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 py-3 text-sm font-light hover:opacity-90 transition-opacity disabled:opacity-50 rounded-full"
                >
                  {isSubmitting ? 'Saving...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed-position dropdown (renders outside overflow-x-auto) */}
      {activeMenu && menuPosition && activeEvent && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setActiveMenu(null); setMenuPosition(null); setActiveEvent(null); }} />
          <div
            className="fixed z-50 bg-stone-900/95 rounded-xl border border-white/[0.08] shadow-xl py-2 min-w-[160px]"
            style={{ top: menuPosition.y + 4, left: menuPosition.x - 160 }}
          >
            <Link href={`/admin/events/${activeEvent.id}`}>
              <button className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-white/[0.06] flex items-center gap-2 rounded-lg">
                <Users className="w-4 h-4" />
                Attendance
              </button>
            </Link>
            <Link href={`/dashboard/events/${activeEvent.id}`}>
              <button className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-white/[0.06] flex items-center gap-2 rounded-lg">
                <Eye className="w-4 h-4" />
                View
              </button>
            </Link>
            <button
              onClick={() => openEditModal(activeEvent)}
              className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-white/[0.06] flex items-center gap-2 rounded-lg"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleDeleteEvent(activeEvent.id)}
              className="w-full px-4 py-2 text-left text-sm font-light text-red-500 hover:bg-white/[0.06] flex items-center gap-2 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
