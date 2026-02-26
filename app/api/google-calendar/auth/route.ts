import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOAuthClient } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const anonSupabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader || '' } },
  });

  const { data: { user } } = await anonSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminSupabase
    .from('users')
    .select('status')
    .eq('id', user.id)
    .single();

  if (profile?.status !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const oauth2Client = getOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: user.id,
  });

  return NextResponse.redirect(authUrl);
}
