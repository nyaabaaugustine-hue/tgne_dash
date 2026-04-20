/**
 * src/app/api/clients/route.ts
 * Drizzle ORM + Zod validated CRUD for Client entity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import {
  createClientSchema,
  updateClientSchema,
  deleteByIdSchema,
} from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/clients — Create ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const [client] = await db
      .insert(clients)
      .values({
        ...parsed.data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('[POST /api/clients]', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

// ── PUT /api/clients — Update ─────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const [client] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, id))
      .returning();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('[PUT /api/clients]', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// ── DELETE /api/clients — Delete ──────────────────────────────────────────────
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

    await db.delete(clients).where(eq(clients.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/clients]', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
