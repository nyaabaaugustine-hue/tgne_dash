/**
 * src/app/api/payments/route.ts
 * Drizzle ORM + Zod validated CRUD for Payment entity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { createPaymentSchema, updatePaymentSchema, deleteByIdSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// ── POST /api/payments — Create ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const [payment] = await db
      .insert(payments)
      .values({
        clientId:      parsed.data.clientId,
        amount:        parsed.data.amount,
        status:        parsed.data.status,
        paymentDate:   parsed.data.paymentDate,
        description:   parsed.data.description   ?? null,
        invoiceNumber: parsed.data.invoiceNumber ?? null,
        createdAt:     now,
      })
      .returning();

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('[POST /api/payments]', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// ── PUT /api/payments — Update ────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const [payment] = await db
      .update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[PUT /api/payments]', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

// ── DELETE /api/payments — Delete ─────────────────────────────────────────────
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

    await db.delete(payments).where(eq(payments.id, parsed.data.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/payments]', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
