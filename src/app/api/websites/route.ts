/**
 * src/app/api/websites/route.ts
 * Drizzle ORM + Zod validated CRUD for Website entity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { websites } from '@/db/schema';
import { createWebsiteSchema, updateWebsiteSchema, deleteByIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/websites — Create ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createWebsiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { dateCreated, expiryDate, ...rest } = parsed.data;

    const [website] = await db
      .insert(websites)
      .values({
        ...rest,
        dateCreated: dateCreated ?? null,
        expiryDate:  expiryDate  ?? null,
      })
      .returning();

    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error('[POST /api/websites]', error);
    return NextResponse.json({ error: 'Failed to create website' }, { status: 500 });
  }
}

// ── PUT /api/websites — Update ────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateWebsiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const [website] = await db
      .update(websites)
      .set(data)
      .where(eq(websites.id, id))
      .returning();

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error('[PUT /api/websites]', error);
    return NextResponse.json({ error: 'Failed to update website' }, { status: 500 });
  }
}

// ── DELETE /api/websites — Delete ─────────────────────────────────────────────
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

    await db.delete(websites).where(eq(websites.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/websites]', error);
    return NextResponse.json({ error: 'Failed to delete website' }, { status: 500 });
  }
}
