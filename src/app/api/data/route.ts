import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Sequential queries to avoid exhausting Neon's connection pool
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    const websites = await prisma.website.findMany();
    const credentials = await prisma.credential.findMany();
    const tasks = await prisma.task.findMany();
    const reminders = await prisma.reminder.findMany({ orderBy: { date: 'asc' } });
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });

    return NextResponse.json({
      clients: clients.map(c => ({
        ...c,
        phone: c.phone ?? undefined,
        email: c.email ?? undefined,
        location: c.location ?? '',
        avatarUrl: c.avatarUrl ?? undefined,
        notes: c.notes ?? undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      websites: websites.map(w => ({
        ...w,
        url: w.url ?? '',
        hostingProvider: w.hostingProvider ?? '',
        platform: w.platform ?? 'Other',
        projectPrice: w.projectPrice ?? 0,
        paymentStatus: w.paymentStatus ?? 'Unpaid',
        dateCreated: w.dateCreated?.toISOString() ?? '',
        expiryDate: w.expiryDate?.toISOString() ?? undefined,
      })),
      credentials: credentials.map(c => ({
        ...c,
        url: c.url ?? undefined,
      })),
      tasks: tasks.map(t => ({
        ...t,
        status: t.status ?? 'Pending',
        dueDate: t.dueDate ?? '',
      })),
      reminders: reminders.map(r => ({
        ...r,
        details: r.details ?? '',
      })),
      payments: payments.map(p => ({
        ...p,
        paymentDate: p.paymentDate || '',
        description: p.description || '',
        invoiceNumber: p.invoiceNumber || '',
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[GET /api/data]', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
