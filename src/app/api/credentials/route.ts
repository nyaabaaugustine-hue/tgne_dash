import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const credential = await prisma.credential.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        username: data.username,
        password: Buffer.from(data.password || '').toString('base64'),
        url: data.url ?? null,
      },
    });
    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    console.error('[POST /api/credentials]', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}
