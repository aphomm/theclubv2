import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables');
  return createClient(supabaseUrl, serviceRoleKey);
}

async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const serviceClient = createServiceClient();
  const { data: { user }, error } = await serviceClient.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await serviceClient
    .from('users')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status !== 'admin') return null;
  return user.id;
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, memberId, data } = body as {
      action: string;
      memberId?: string;
      data?: Record<string, unknown>;
    };

    const serviceClient = createServiceClient();

    if (action === 'list') {
      const { tier } = (data || {}) as { tier?: string };
      let query = serviceClient.from('users').select('*');
      if (tier && tier !== 'all') query = query.eq('tier', tier);
      const { data: members, error } = await query.order('join_date', { ascending: false });
      if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
      return NextResponse.json({ members });
    }

    if (action === 'update_status') {
      if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
      const { status } = (data || {}) as { status?: string };
      const allowed = ['active', 'suspended', 'pending', 'deleted'];
      if (!status || !allowed.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${allowed.join(', ')}` }, { status: 400 });
      }
      const { error } = await serviceClient.from('users').update({ status }).eq('id', memberId);
      if (error) return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'update_tier') {
      if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
      const { tier } = (data || {}) as { tier?: string };
      const allowed = ['Creator', 'Professional', 'Executive'];
      if (!tier || !allowed.includes(tier)) {
        return NextResponse.json({ error: `tier must be one of: ${allowed.join(', ')}` }, { status: 400 });
      }
      const { error } = await serviceClient.from('users').update({ tier }).eq('id', memberId);
      if (error) return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
      const { error } = await serviceClient.from('users').update({ status: 'deleted' }).eq('id', memberId);
      if (error) return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'update_profile') {
      if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });
      const { name, tier, status } = (data || {}) as { name?: string; tier?: string; status?: string };
      const updates: Record<string, string> = {};
      if (name) updates.name = name;
      if (tier) {
        const allowedTiers = ['Creator', 'Professional', 'Executive', 'Admin'];
        if (!allowedTiers.includes(tier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        updates.tier = tier;
      }
      if (status) {
        const allowedStatuses = ['active', 'suspended', 'pending', 'deleted'];
        if (!allowedStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        updates.status = status;
      }
      if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      const { error } = await serviceClient.from('users').update(updates).eq('id', memberId);
      if (error) return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('Admin members route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
