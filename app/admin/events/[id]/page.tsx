'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Users, UserX } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Attendee {
  id: string;
  guest_count: number;
  created_at: string;
  user_id: string;
  users: {
    name: string;
    email: string;
    tier: string;
  } | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
}

export default function EventAttendancePage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const [eventResult, rsvpResult] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, date, time, location, capacity')
        .eq('id', params.id)
        .maybeSingle(),
      supabase
        .from('event_rsvps')
        .select('id, guest_count, created_at, user_id, users(name, email, tier)')
        .eq('event_id', params.id)
        .order('created_at'),
    ]);

    setEvent(eventResult.data);
    setAttendees((rsvpResult.data as unknown as Attendee[]) || []);
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveRsvp = async (rsvpId: string, memberName: string) => {
    if (!confirm(`Remove RSVP for ${memberName}?`)) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('event_rsvps').delete().eq('id', rsvpId);

    if (error) {
      toast.error('Failed to remove RSVP');
    } else {
      toast.success('RSVP removed');
      fetchData();
    }
  };

  const totalGuests = attendees.reduce((sum, a) => sum + (a.guest_count || 1), 0);
  const pctFilled = event ? Math.min(100, (totalGuests / event.capacity) * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-5xl">
        <div className="h-8 w-32 bg-white/[0.06] rounded-sm animate-pulse mb-8" />
        <div className="h-64 bg-white/[0.04] animate-pulse rounded-sm border border-white/[0.08]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl">
        <Link href="/admin/events">
          <button className="flex items-center gap-2 text-accent-600 hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
        </Link>
        <p className="text-ink-400">Event not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Link href="/admin/events">
        <button className="flex items-center gap-2 text-accent-600 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl mb-2">{event.title}</h1>
        <p className="text-ink-400">
          {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/Los_Angeles',
          })}{' '}
          · {event.time} · {event.location}
        </p>
      </div>

      {/* Capacity overview */}
      <div className="rounded-sm border border-white/[0.08] p-6 mb-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-sm text-ink-400 mb-1">Total Attendance</div>
            <div className="text-3xl">
              <span className={totalGuests >= event.capacity ? 'text-red-500' : 'text-accent-600'}>
                {totalGuests}
              </span>
              <span className="text-ink-500 text-xl"> / {event.capacity}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-ink-400">Unique RSVPs</div>
            <div className="text-3xl">{attendees.length}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-ink-400">Remaining</div>
            <div className="text-3xl text-green-500">
              {Math.max(0, event.capacity - totalGuests)}
            </div>
          </div>
        </div>
        <div className="w-full bg-white/[0.08] h-2 rounded-full">
          <div
            className={`h-full rounded-full transition-all ${pctFilled >= 100 ? 'bg-red-500' : 'bg-accent-500'}`}
            style={{ width: `${pctFilled}%` }}
          />
        </div>
        <div className="text-xs text-ink-500 mt-2">{Math.round(pctFilled)}% capacity filled</div>
      </div>

      {/* Attendee list */}
      <div className="rounded-sm border border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-600" />
          <h2 className="text-lg">RSVP List</h2>
        </div>

        {attendees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-ink-700 mx-auto mb-3" />
            <p className="text-ink-400">No RSVPs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-xs text-ink-400 uppercase tracking-wide">Member</th>
                  <th className="px-6 py-4 text-left text-xs text-ink-400 uppercase tracking-wide">Tier</th>
                  <th className="px-6 py-4 text-left text-xs text-ink-400 uppercase tracking-wide">Guests</th>
                  <th className="px-6 py-4 text-left text-xs text-ink-400 uppercase tracking-wide">RSVP'd</th>
                  <th className="px-6 py-4 text-left text-xs text-ink-400 uppercase tracking-wide">Remove</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee, idx) => (
                  <tr
                    key={attendee.id}
                    className={idx !== attendees.length - 1 ? 'border-b border-white/[0.06]' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="">{attendee.users?.name || '—'}</div>
                      <div className="text-xs text-ink-500 mt-0.5">{attendee.users?.email || attendee.user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 uppercase rounded-sm ${
                        attendee.users?.tier === 'Executive' ? 'bg-accent-500 text-ink-950' :
                        attendee.users?.tier === 'Professional' ? 'bg-ink-700 text-ink-100' :
                        'bg-accent-600/20 text-accent-600'
                      }`}>
                        {attendee.users?.tier || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{attendee.guest_count || 1}</td>
                    <td className="px-6 py-4 text-sm text-ink-400">
                      {attendee.created_at
                        ? new Date(attendee.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveRsvp(attendee.id, attendee.users?.name || 'this member')}
                        className="text-ink-600 hover:text-red-500 transition-colors"
                        title="Remove RSVP"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
