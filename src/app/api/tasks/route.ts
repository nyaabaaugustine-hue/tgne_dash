/**
 * src/app/api/tasks/route.ts
 * Drizzle ORM + Zod validated CRUD for Task entity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { createTaskSchema, updateTaskSchema, deleteByIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/tasks — Create ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [task] = await db
      .insert(tasks)
      .values({
        clientId:    parsed.data.clientId,
        description: parsed.data.description,
        status:      parsed.data.status ?? 'Pending',
        dueDate:     parsed.data.dueDate ?? null,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// ── PUT /api/tasks — Update ───────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const [task] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[PUT /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// ── DELETE /api/tasks — Delete ────────────────────────────────────────────────
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

    await db.delete(tasks).where(eq(tasks.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
