/**
 * src/app/api/send-digest/route.ts
 *
 * POST /api/send-digest
 * Body: { duration: number, unit: 'days' | 'weeks' | 'months' }
 *
 * Queries the database for the selected time window, builds a digest report,
 * and fires it to ALL admin emails (TGNE_ADMIN_EMAILS) via Brevo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, websites, payments, tasks } from '@/db/schema';
import { subDays, subWeeks, subMonths, differenceInCalendarDays, parseISO } from 'date-fns';
import { sendDigestReport, parseAdminEmails, DigestReport } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const duration = Math.max(1, parseInt(body.duration ?? '1', 10));
    const unit: 'days' | 'weeks' | 'months' = ['days', 'weeks', 'months'].includes(body.unit)
      ? body.unit : 'days';

    const now   = new Date();
    let cutoff: Date;
    switch (unit) {
      case 'weeks':  cutoff = subWeeks(now, duration);  break;
      case 'months': cutoff = subMonths(now, duration); break;
      default:       cutoff = subDays(now, duration);   break;
    }
    const cutoffISO = cutoff.toISOString();
    const period    = `Last ${duration} ${unit}`;

    // ── Fetch all data ────────────────────────────────────────────────────
    const [allClients, allWebsites, allPayments, allTasks] = await Promise.all([
      db.select().from(clients),
      db.select().from(websites),
      db.select().from(payments),
      db.select().from(tasks),
    ]);

    const clientMap = new Map(allClients.map(c => [c.id, c.businessName]));

    // ── New clients in period ─────────────────────────────────────────────
    const newClients = allClients
      .filter(c => c.createdAt >= cutoffISO)
      .map(c => ({
        name:     c.name,
        business: c.businessName,
        date:     c.createdAt.split('T')[0],
      }));

    // ── Paid invoices in period ───────────────────────────────────────────
    const paidInvoices = allPayments
      .filter(p => p.status === 'PAID' && p.createdAt >= cutoffISO)
      .map(p => ({
        invoiceNo: p.invoiceNumber ?? p.id.slice(0, 8).toUpperCase(),
        client:    clientMap.get(p.clientId) ?? 'Unknown',
        amount:    p.amount,
        date:      p.paymentDate,
      }));

    // ── Pending invoices (all pending, not just period) ───────────────────
    const pendingInvoices = allPayments
      .filter(p => p.status === 'PENDING')
      .map(p => ({
        invoiceNo: p.invoiceNumber ?? p.id.slice(0, 8).toUpperCase(),
        client:    clientMap.get(p.clientId) ?? 'Unknown',
        amount:    p.amount,
        date:      p.paymentDate,
      }));

    // ── Completed tasks in period ─────────────────────────────────────────
    const completedTasks = allTasks
      .filter(t => t.status === 'Completed' && t.dueDate && t.dueDate >= cutoffISO.split('T')[0])
      .map(t => ({
        desc:   t.description.slice(0, 60),
        client: clientMap.get(t.clientId) ?? 'Unknown',
        date:   t.dueDate ?? '',
      }));

    // ── Expiring domains (within the look-ahead window or already overdue) ─
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiringDomains = allWebsites
      .filter(w => w.expiryDate)
      .map(w => {
        let daysLeft = 9999;
        try {
          const expDate = new Date(w.expiryDate!.replace(' ', 'T'));
          daysLeft = differenceInCalendarDays(expDate, today);
        } catch {}
        return { w, daysLeft };
      })
      .filter(({ daysLeft }) => daysLeft <= 30) // anything expiring within 30 days or overdue
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .map(({ w, daysLeft }) => ({
        domain:   w.domainName,
        client:   clientMap.get(w.clientId) ?? 'Unknown',
        daysLeft,
        expiry:   w.expiryDate?.split('T')[0] ?? '',
      }));

    // ── Build report ──────────────────────────────────────────────────────
    const report: DigestReport = {
      period,
      newClients,
      paidInvoices,
      pendingInvoices,
      completedTasks,
      expiringDomains,
      totalPaid:    paidInvoices.reduce((s, p) => s + p.amount, 0),
      totalPending: pendingInvoices.reduce((s, p) => s + p.amount, 0),
    };

    const recipients = parseAdminEmails();
    const result     = await sendDigestReport(report);

    return NextResponse.json({
      ...result,
      period,
      recipients,
      stats: {
        newClients:      newClients.length,
        paidInvoices:    paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        completedTasks:  completedTasks.length,
        expiringDomains: expiringDomains.length,
      },
    });

  } catch (error) {
    console.error('[POST /api/send-digest]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
