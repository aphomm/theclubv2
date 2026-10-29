import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (per edge worker instance)
// For multi-instance production, replace with Vercel KV or Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function isRateLimited(ip: string, path: string, maxRequests: number, windowMs: number): boolean {
  const key = getRateLimitKey(ip, path);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Clean up expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return 'https://*.supabase.co';
  }
})();

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    // Only scripts carrying this response's nonce (and what they load) can run
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^https:/, 'wss:')}${isDev ? ' ws:' : ''}`,
    'frame-src https://www.youtube.com https://player.vimeo.com https://www.loom.com',
    "media-src 'self' https:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function withPageCsp(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return withPageCsp(request);
  }
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // Rate limit sensitive API endpoints
  if (request.method === 'POST') {
    // Checkout: 5 requests per 10 minutes per IP
    if (pathname === '/api/checkout') {
      if (isRateLimited(ip, '/api/checkout', 5, 10 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Admin setup: 3 requests per hour per IP
    if (pathname === '/api/admin/setup') {
      if (isRateLimited(ip, '/api/admin/setup', 3, 60 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Waitlist: 10 requests per 10 minutes per IP
    if (pathname === '/api/waitlist') {
      if (isRateLimited(ip, '/api/waitlist', 10, 10 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Cancel booking: 10 requests per 5 minutes per IP
    if (pathname === '/api/cancel-booking') {
      if (isRateLimited(ip, '/api/cancel-booking', 10, 5 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }
  }

  // Periodically clean expired entries (rough cleanup, not triggered on every request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Pages (for the nonce CSP) and API routes; skip static assets and prefetches
    {
      source: '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
