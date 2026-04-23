/**
 * GET /api/auth/session-check
 *
 * Lightweight endpoint the client pings on mount to verify
 * the session cookie is still valid. Returns 200 if valid,
 * 401 if expired or absent.
 *
 * This route is in /api/auth/ so it is excluded from the
 * middleware session guard (auth routes are whitelisted).
 * The middleware itself verifies the cookie here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken, getSessionSecret } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    let secret: string;
    try {
      secret = getSessionSecret();
    } catch {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const payload = await verifySessionToken(token, secret);

    if (!payload) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
