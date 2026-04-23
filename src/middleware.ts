/**
 * src/middleware.ts
 *
 * Protects all /api/* routes except:
 *   /api/auth/*        — login endpoints (have their own auth)
 *   /api/data          — read-only data fetch; excluded so TanStack Query
 *                        can re-fetch immediately after login
 *   /api/cron/*        — secured via Bearer CRON_SECRET header
 *
 * Session check: reads the tgne_session cookie set by /api/auth/verify-pin.
 * If absent or wrong value, returns 401.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Rate limiting (in-memory, per-instance) ──────────────────────────────────

interface RateRecord { count: number; resetAt: number; }

const ipMap   = new Map<string, RateRecord>();
const authMap = new Map<string, RateRecord>();

const WINDOW_MS   = 60_000;
const MAX_GENERAL = 120;
const MAX_AUTH    = 10;

function rateCheck(map: Map<string, RateRecord>, key: string, max: number): boolean {
  const now = Date.now();
  let rec   = map.get(key);
  if (!rec || now > rec.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  rec.count++;
  return rec.count <= max;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const ip           = getIp(req);

  const isAuth = pathname.startsWith('/api/auth/');
  const isCron = pathname.startsWith('/api/cron/');

  // Rate limiting
  if (isAuth) {
    if (!rateCheck(authMap, ip, MAX_AUTH)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  } else {
    if (!rateCheck(ipMap, ip, MAX_GENERAL)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // Auth routes and cron routes skip session check
  if (isAuth || isCron) {
    return NextResponse.next();
  }

  // Session check — read the simple cookie set by verify-pin
  const session = req.cookies.get('tgne_session')?.value;
  if (session !== 'authenticated') {
    return NextResponse.json(
      { error: 'Unauthorized — please log in.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all /api/* routes EXCEPT:
   *   /api/auth/*   — whitelisted above in the handler
   *   /api/data     — excluded here so it's never blocked on first load
   */
  matcher: ['/api/((?!auth/|data(?:/|$)).*)',],
};
