/**
 * GET /api/auth/session-check
 * Returns 200 if the session cookie is present and valid, 401 otherwise.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('tgne_session')?.value;
  if (cookie === 'authenticated') {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false }, { status: 401 });
}
