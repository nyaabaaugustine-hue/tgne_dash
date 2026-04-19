import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const website = await prisma.website.create({
      data: {
        clientId: data.clientId,
        domainName: data.domainName,
        url: data.url ?? null,
        hostingProvider: data.hostingProvider ?? null,
        platform: data.platform ?? null,
        projectPrice: data.projectPrice ?? null,
        paymentStatus: data.paymentStatus ?? null,
        dateCreated: data.dateCreated ? new Date(data.dateCreated) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });
    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error('[POST /api/websites]', error);
    return NextResponse.json({ error: 'Failed to create website' }, { status: 500 });
  }
}
