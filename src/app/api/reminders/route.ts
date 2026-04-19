import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const reminder = await prisma.reminder.create({
      data: {
        type: data.type,
        title: data.title,
        date: data.date,
        details: data.details ?? null,
      },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reminders]', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/reminders]', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
