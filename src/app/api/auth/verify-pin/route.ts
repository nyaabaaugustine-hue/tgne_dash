/**
 * src/app/api/auth/verify-pin/route.ts
 *
 * POST /api/auth/verify-pin
 * Body: { pin: string }
 *
 * Returns 200 { success: true } on correct PIN, 401 on wrong PIN.
 * Sets an httpOnly session cookie on success.
 *
 * PIN is read from ADMIN_PIN env var (server-only, never sent to browser).
 * Falls back to hardcoded default so the app works even without env config.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Default PIN — works out of the box without any env setup.
// Override by setting ADMIN_PIN in .env.local or Vercel Dashboard env vars.
const DEFAULT_PIN = '1234567a';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin  = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const adminPin = (process.env.ADMIN_PIN ?? DEFAULT_PIN).trim();

    // Small delay to slow brute-force (non-blocking to caller animation)
    await new Promise(r => setTimeout(r, 300));

    if (pin !== adminPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Set a simple session cookie — httpOnly so JS can't read it
    const res = NextResponse.json({ success: true });
    res.cookies.set('tgne_session', 'authenticated', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',   // 'lax' works on localhost; 'strict' can block cookie on redirects
      maxAge:   60 * 60 * 8, // 8 hours
      path:     '/',
    });
    return res;
  } catch (err) {
    console.error('[verify-pin]', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
