import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/google-calendar';
import { createServiceClient, isAdmin, verifyState } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/admin?calendar=error', request.url));
  }

  const adminId = verifyState(state);
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.redirect(new URL('/admin?calendar=error', request.url));
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/admin?calendar=error', request.url));
    }

    const supabase = createServiceClient();

    await supabase.from('calendar_credentials').upsert({
      user_id: adminId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/admin?calendar=connected', request.url));
  } catch (err) {
    console.error('OAuth token exchange failed:', err);
    return NextResponse.redirect(new URL('/admin?calendar=error', request.url));
  }
}
