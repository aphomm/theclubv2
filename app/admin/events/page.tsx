'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, MoreVertical, X, Edit, Trash2, Eye } from 'lucide-react';
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
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const EventForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="text-sm text-stone-400 font-light mb-2 block">Event Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g., Songwriting Masterclass"
          className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
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
            className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
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
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600 transition-colors"
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
            className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
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
            className="w-full bg-stone-950 border border-stone-700 px-4 py-3 text-stone-100 focus:outline-none focus:border-amber-600"
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
          className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          required
        />
      </div>

      <div>
        <label className="text-sm text-stone-400 font-light mb-2 block">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe the event..."
          rows={4}
          className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
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
              className={`px-4 py-2 text-sm font-light border transition-colors ${
                formData.tier_access.includes(tier)
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-800 pt-6">
        <h4 className="text-sm text-stone-400 font-light mb-4">Instructor Details (Optional)</h4>
        <div className="space-y-4">
          <input
            type="text"
            name="instructor_name"
            value={formData.instructor_name}
            onChange={handleInputChange}
            placeholder="Instructor name"
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
          <input
            type="text"
            name="instructor_title"
            value={formData.instructor_title}
            onChange={handleInputChange}
            placeholder="Instructor title (e.g., Grammy-winning Producer)"
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
          />
          <textarea
            name="instructor_bio"
            value={formData.instructor_bio}
            onChange={handleInputChange}
            placeholder="Brief bio..."
            rows={2}
            className="w-full bg-transparent border border-stone-700 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => {
            isEdit ? setShowEditModal(false) : setShowCreateModal(false);
            resetForm();
            setEditingEvent(null);
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
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-light mb-2">Events</h1>
          <p className="text-stone-400 font-light">Manage club events and masterclasses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-stone-950 px-6 py-3 text-sm font-light hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      {/* Events Table */}
      <div className="border border-stone-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-12 w-12 bg-stone-900 rounded-full animate-pulse" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-stone-400 font-light">
            No events found. Create your first event to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={event.id} className={idx !== events.length - 1 ? 'border-b border-stone-800' : ''}>
                    <td className="px-6 py-4 font-light max-w-sm truncate">{event.title}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-amber-600/20 text-amber-600 px-3 py-1 font-light uppercase">
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-400 font-light">{event.location}</td>
                    <td className="px-6 py-4 font-light">{event.capacity}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === event.id ? null : event.id)}
                          className="text-stone-400 hover:text-amber-600 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeMenu === event.id && (
                          <div className="absolute right-0 top-8 z-10 bg-stone-900 border border-stone-800 shadow-lg py-2 min-w-[150px]">
                            <Link href={`/dashboard/events/${event.id}`}>
                              <button className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-stone-800 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            </Link>
                            <button
                              onClick={() => openEditModal(event)}
                              className="w-full px-4 py-2 text-left text-sm font-light text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
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
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            <EventForm onSubmit={handleCreateEvent} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-950 border border-stone-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            <EventForm onSubmit={handleEditEvent} isEdit />
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
