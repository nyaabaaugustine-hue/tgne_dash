/**
 * src/app/api/reminders/route.ts
 * Drizzle ORM + Zod validated CRUD for Reminder entity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { reminders } from '@/db/schema';
import { createReminderSchema, updateReminderSchema, deleteByIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/reminders — Create ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [reminder] = await db
      .insert(reminders)
      .values({
        type:    parsed.data.type,
        title:   parsed.data.title,
        date:    parsed.data.date,
        details: parsed.data.details ?? null,
        isRead:  false,
      })
      .returning();

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reminders]', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

// ── PUT /api/reminders — Mark as read ─────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateReminderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [reminder] = await db
      .update(reminders)
      .set({ isRead: parsed.data.isRead ?? true })
      .where(eq(reminders.id, parsed.data.id))
      .returning();

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('[PUT /api/reminders]', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

// ── DELETE /api/reminders — Delete ───────────────────────────────────────────
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

    await db.delete(reminders).where(eq(reminders.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/reminders]', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
