/**
 * src/app/api/cron/check-due-dates/route.ts
 * Vercel Cron Job — runs daily at 08:00 UTC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reminders, websites, tasks, clients, payments } from '@/db/schema';
import { differenceInCalendarDays } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';
import { sendDueDateAlert, DueAlert, SendResult } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVOICE_WINDOW_DAYS = 30;
const DEDUP_WINDOW_DAYS   = 25;
const ALERT_WINDOW_DAYS   = 30;
const TASK_ALERT_DAYS     = 7;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0];

  try {
    const [allReminders, allWebsites, allTasks, allClients, allPayments] = await Promise.all([
      db.select().from(reminders),
      db.select().from(websites),
      db.select().from(tasks),
      db.select().from(clients),
      db.select().from(payments),
    ]);

    const clientMap = new Map(allClients.map(c => [c.id, c]));

    // ── Part 1: Auto-invoice generation ───────────────────────────────────
    const autoInvoicesCreated: { domain: string; clientName: string; amount: number }[] = [];

    for (const w of allWebsites) {
      if (!w.expiryDate) continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(w.expiryDate), today); } catch { continue; }
      if (daysLeft < 0 || daysLeft > INVOICE_WINDOW_DAYS) continue;

      const client = clientMap.get(w.clientId);
      if (!client) continue;

      const dedupCutoff  = new Date(today.getTime() - DEDUP_WINDOW_DAYS * 86_400_000).toISOString();
      const alreadyExists = allPayments.some(p =>
        p.clientId  === w.clientId &&
        p.status    === 'PENDING' &&
        p.createdAt >= dedupCutoff &&
        p.description?.toLowerCase().includes(w.domainName.toLowerCase())
      );
      if (alreadyExists) continue;

      const amount        = w.projectPrice ?? 0;
      const invoiceNumber = `REN-${w.domainName.replace(/\./g, '-').toUpperCase()}-${todayStr}`;
      const description   = `Website Renewal: ${w.domainName} (${w.platform ?? 'Website'} · ${w.hostingProvider ?? 'Hosting'}) — expires ${w.expiryDate?.split('T')[0] ?? daysLeft + 'd'}`;

      await db.insert(payments).values({
        id: createId(), clientId: w.clientId, amount,
        status: 'PENDING', paymentDate: todayStr,
        description, invoiceNumber, createdAt: new Date().toISOString(),
      });

      autoInvoicesCreated.push({ domain: w.domainName, clientName: client.businessName, amount });
    }

    // ── Part 2: Build alert items ──────────────────────────────────────────
    const clientName = (id: string) => clientMap.get(id)?.businessName ?? undefined;
    const alerts: DueAlert[] = [];

    for (const r of allReminders) {
      if (!r.date) continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(r.date), today); } catch { continue; }
      if (daysLeft <= ALERT_WINDOW_DAYS) {
        alerts.push({ type: 'reminder', title: r.title, detail: r.details ? r.details.slice(0, 80) : r.type, daysLeft, date: r.date });
      }
    }

    for (const w of allWebsites) {
      if (!w.expiryDate) continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(w.expiryDate), today); } catch { continue; }
      if (daysLeft <= ALERT_WINDOW_DAYS) {
        alerts.push({ type: 'website', title: `${w.domainName} renewal`, detail: `${w.platform ?? 'Website'} · ${w.hostingProvider ?? 'Hosting provider'}`, daysLeft, clientName: clientName(w.clientId), date: w.expiryDate.split('T')[0] });
      }
    }

    for (const t of allTasks) {
      if (!t.dueDate || t.status === 'Completed') continue;
      let daysLeft = 999;
      try { daysLeft = differenceInCalendarDays(new Date(t.dueDate), today); } catch { continue; }
      if (daysLeft <= TASK_ALERT_DAYS) {
        alerts.push({ type: 'task', title: t.description.slice(0, 70), detail: `Status: ${t.status}`, daysLeft, clientName: clientName(t.clientId), date: t.dueDate });
      }
    }

    alerts.sort((a, b) => a.daysLeft - b.daysLeft);

    const autoInvoiceAlerts: DueAlert[] = autoInvoicesCreated.map(inv => ({
      type:       'reminder' as const,
      title:      `🧾 Auto-invoice created: ${inv.domain}`,
      detail:     `Renewal invoice of GHS ${inv.amount.toLocaleString()} queued as PENDING`,
      daysLeft:   0,
      clientName: inv.clientName,
      date:       todayStr,
    }));

    const allAlerts = [...alerts, ...autoInvoiceAlerts];

    // FIX: type the variable as SendResult to match what sendDueDateAlert returns
    let emailResult: SendResult = { sent: false, error: 'No items to report' };
    if (allAlerts.length > 0) {
      emailResult = await sendDueDateAlert(allAlerts);
    }

    const summary = {
      checked:             today.toISOString(),
      alertCount:          alerts.length,
      autoInvoicesCreated: autoInvoicesCreated.length,
      autoInvoices:        autoInvoicesCreated,
      email:               emailResult,
    };

    console.log('[cron/check-due-dates] Run complete →', JSON.stringify(summary, null, 2));
    return NextResponse.json(summary);

  } catch (error) {
    console.error('[cron/check-due-dates] Fatal error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
