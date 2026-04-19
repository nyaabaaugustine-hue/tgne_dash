import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const payment = await prisma.payment.create({
      data: {
        clientId: data.clientId,
        amount: data.amount,
        status: data.status,
        paymentDate: data.paymentDate,
        description: data.description || null,
        invoiceNumber: data.invoiceNumber || null,
      },
    });
    return NextResponse.json({ ...payment, createdAt: payment.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/payments]', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.paymentDate !== undefined && { paymentDate: updates.paymentDate }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.invoiceNumber !== undefined && { invoiceNumber: updates.invoiceNumber }),
      },
    });
    return NextResponse.json({ ...payment, createdAt: payment.createdAt.toISOString() });
  } catch (error) {
    console.error('[PUT /api/payments]', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.payment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/payments]', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
