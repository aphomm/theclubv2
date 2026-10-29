import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/google-calendar';
import { getRequestUser, isAdmin, signState } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const oauth2Client = getOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: signState(user.id),
  });

  return NextResponse.redirect(authUrl);
}
