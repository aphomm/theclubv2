import { NextRequest, NextResponse } from 'next/server';
import { clientIp, createServiceClient, isRateLimited } from '@/lib/server-auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  if (await isRateLimited(`waitlist:${clientIp(request)}`, 5, 60 * 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }

  const { error } = await createServiceClient().from('waitlist').insert([{ email: normalized }]);
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already on the waitlist' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
