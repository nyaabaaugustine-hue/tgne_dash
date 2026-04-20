/**
 * src/app/api/credentials/route.ts
 * Drizzle ORM + Zod validated CRUD for Credential entity.
 * Passwords are stored as base64 to avoid plain-text exposure in DB logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { credentials } from '@/db/schema';
import { createCredentialSchema, deleteByIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/credentials — Create ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCredentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { password, ...rest } = parsed.data;

    const [credential] = await db
      .insert(credentials)
      .values({
        ...rest,
        // Base64-encode password before storing
        password: Buffer.from(password).toString('base64'),
      })
      .returning();

    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    console.error('[POST /api/credentials]', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}

// ── DELETE /api/credentials — Delete ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = deleteByIdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await db.delete(credentials).where(eq(credentials.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/credentials]', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
