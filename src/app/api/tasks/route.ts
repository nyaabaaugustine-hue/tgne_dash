import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const task = await prisma.task.create({
      data: {
        clientId: data.clientId,
        description: data.description,
        status: data.status || 'Pending',
        dueDate: data.dueDate ?? null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('[PUT /api/tasks]', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
