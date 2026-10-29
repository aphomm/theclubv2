import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeEqual, clientIp, isRateLimited } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  if (await isRateLimited(`admin-setup:${clientIp(request)}`, 3, 60 * 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email, passphrase } = await request.json();

    const expectedPassphrase = process.env.ADMIN_SETUP_PASSPHRASE;
    if (!expectedPassphrase || typeof passphrase !== 'string' || typeof email !== 'string' || !safeEqual(passphrase, expectedPassphrase)) {
      return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if any admin already exists
    const { count: adminCount, error: adminCheckError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'admin');

    if (adminCheckError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if ((adminCount ?? 0) > 0) {
      return NextResponse.json({ error: 'An admin already exists' }, { status: 409 });
    }

    // Find the user by email and promote them
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ status: 'admin', role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to set admin status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin setup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
