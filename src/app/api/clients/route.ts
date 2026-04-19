import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await prisma.client.create({
      data: {
        name: data.name,
        businessName: data.businessName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        location: data.location ?? null,
        avatarUrl: data.avatarUrl ?? null,
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('[POST /api/clients]', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        businessName: data.businessName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        location: data.location ?? null,
        avatarUrl: data.avatarUrl ?? null,
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error('[PUT /api/clients]', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/clients]', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
