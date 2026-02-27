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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

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
  matcher: ['/api/checkout', '/api/cancel-booking', '/api/admin/:path*'],
};
