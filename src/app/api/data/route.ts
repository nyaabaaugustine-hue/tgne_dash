import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[API /data] Starting fetch...');
    
    // Sequential queries to avoid exhausting Neon's connection pool
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    console.log('[API /data] Clients fetched:', clients.length);
    
    const websites = await prisma.website.findMany();
    console.log('[API /data] Websites fetched:', websites.length);
    
    const credentials = await prisma.credential.findMany();
    console.log('[API /data] Credentials fetched:', credentials.length);
    
    const tasks = await prisma.task.findMany();
    console.log('[API /data] Tasks fetched:', tasks.length);
    
    const reminders = await prisma.reminder.findMany({ orderBy: { date: 'asc' } });
    console.log('[API /data] Reminders fetched:', reminders.length);
    
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
    console.log('[API /data] Payments fetched:', payments.length);

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
    console.error('[GET /api/data] ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}
