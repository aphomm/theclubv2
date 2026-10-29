import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

// Resolves the caller from the `Authorization: Bearer <supabase access token>` header.
export async function getRequestUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  const { data: { user }, error } = await createServiceClient().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await createServiceClient()
    .from('users')
    .select('status')
    .eq('id', userId)
    .maybeSingle();
  return data?.status === 'admin';
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Signed, expiring OAuth `state` so the callback can't be pointed at another user's row.
const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing OAuth state secret');
  return secret;
}

export function signState(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = createHmac('sha256', stateSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyState(state: string): string | null {
  const [userId, issuedAt, sig] = state.split('.');
  if (!userId || !issuedAt || !sig) return null;
  const expected = createHmac('sha256', stateSecret()).update(`${userId}.${issuedAt}`).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  if (Date.now() - Number(issuedAt) > STATE_TTL_MS) return null;
  return userId;
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Shared limiter backed by the hit_rate_limit() Postgres function, so limits hold
// across serverless instances. Fails open if the database call errors, so an outage
// there can't lock members out; the per-instance middleware limiter still applies.
export async function isRateLimited(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createServiceClient().rpc('hit_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return false;
    return data === false;
  } catch {
    return false;
  }
}
