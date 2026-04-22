/**
 * /api/email-digest
 * Generates and sends a daily HTML digest email via Resend.
 * Env vars: RESEND_API_KEY (required), DIGEST_EMAIL (required), RESEND_FROM_EMAIL (optional)
 *
 * Fixed: removed rollbar import (not needed), improved error messages.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, payments, websites, tasks, reminders } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const resendKey = (process.env.RESEND_API_KEY ?? '').trim();
    if (!resendKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not set. Add it to your .env.local file and restart the server.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const to   = ((body as Record<string, string>)?.email ?? process.env.DIGEST_EMAIL ?? '').trim();

    if (!to) {
      return NextResponse.json(
        { error: 'No recipient — pass { "email": "you@example.com" } in the request body, or set DIGEST_EMAIL in .env.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: `Invalid email address: "${to}"` }, { status: 400 });
    }

    const [allClients, allPayments, allWebsites, allTasks, allReminders] = await Promise.all([
      db.select().from(clients),
      db.select().from(payments).orderBy(desc(payments.createdAt)),
      db.select().from(websites),
      db.select().from(tasks),
      db.select().from(reminders),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending         = allPayments.filter(p => p.status === 'PENDING');
    const overdueTasks    = allTasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < today);
    const expiringIn30    = allWebsites.filter(w => {
      if (!w.expiryDate) return false;
      const diff = new Date(w.expiryDate).getTime() - today.getTime();
      return diff >= 0 && diff < 30 * 86400000;
    });
    const unreadReminders = allReminders.filter(r => !r.isRead);
    const totalPaid       = allPayments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount ?? 0), 0);

    const html        = buildDigestHtml({ today, allClients, pending, overdueTasks, expiringIn30, unreadReminders, totalPaid });
    const fromAddress = (process.env.RESEND_FROM_EMAIL ?? '').trim() || 'onboarding@resend.dev';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to: [to], subject: `TGNE Daily Digest — ${today.toDateString()}`, html }),
    });

    const resendBody = await resendRes.text();

    if (!resendRes.ok) {
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(resendBody); } catch {}
      const resendMsg = (parsed?.message as string) || resendBody;
      let friendly    = resendMsg;

      if (resendMsg.includes('domain is not verified')) {
        friendly = `The "from" domain in "${fromAddress}" is not verified in Resend. Leave RESEND_FROM_EMAIL unset to use onboarding@resend.dev (works without domain verification).`;
      } else if (resendMsg.includes('Invalid API key') || resendMsg.includes('Unauthorized')) {
        friendly = 'RESEND_API_KEY is invalid. Copy the correct key from resend.com → API Keys.';
      } else if (resendMsg.includes('not allowed to send') || resendMsg.includes('testing emails') || resendMsg.includes('You can only send')) {
        friendly = `Resend free tier only allows sending to your own verified email. Either: (1) use the same email you signed up to Resend with, or (2) upgrade your Resend plan.`;
      }

      console.error('[email-digest] Resend error:', resendRes.status, resendMsg);
      return NextResponse.json(
        { error: 'Email send failed', details: friendly, resendStatus: resendRes.status },
        { status: 502 }
      );
    }

    console.log('[email-digest] Sent to', to, 'from', fromAddress);
    return NextResponse.json({ success: true, to, from: fromAddress, sentAt: new Date().toISOString() });

  } catch (error) {
    console.error('[POST /api/email-digest]', error);
    return NextResponse.json({ error: 'Digest failed', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const hasKey   = !!process.env.RESEND_API_KEY;
  const hasEmail = !!process.env.DIGEST_EMAIL;
  return NextResponse.json({
    status:      'ok',
    configured:  hasKey && hasEmail,
    resendKey:   hasKey  ? 'set ✓' : '❌ MISSING — add RESEND_API_KEY to .env.local',
    digestEmail: hasEmail ? `set ✓ (${process.env.DIGEST_EMAIL})` : '❌ MISSING — add DIGEST_EMAIL to .env.local',
    fromEmail:   process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default — no domain verification needed)',
  });
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildDigestHtml({
  today, allClients, pending, overdueTasks, expiringIn30, unreadReminders, totalPaid,
}: {
  today:           Date;
  allClients:      { id: string; businessName: string }[];
  pending:         { status: string; clientId: string; amount: number; invoiceNumber: string | null; paymentDate: string }[];
  overdueTasks:    { clientId: string; description: string; dueDate: string | null }[];
  expiringIn30:    { clientId: string; domainName: string; expiryDate: string | null }[];
  unreadReminders: { title: string; type: string; date: string }[];
  totalPaid:       number;
}): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,sans-serif;background:#f4f3ff;padding:0;margin:0}
  .wrap{max-width:620px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2dff5;box-shadow:0 4px 30px rgba(101,68,214,.08)}
  .hdr{background:linear-gradient(135deg,#6544D6 0%,#8b6fff 100%);padding:30px 36px;color:#fff}
  .hdr h1{margin:0;font-size:24px;font-weight:900}.hdr p{margin:6px 0 0;opacity:.75;font-size:13px}
  .body{padding:28px 36px}
  .section{margin-bottom:28px}
  .section h2{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6544D6;margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid #f0ecff}
  .stat-row{display:flex;gap:12px;flex-wrap:wrap}
  .stat{flex:1;min-width:110px;background:#f8f7ff;border-radius:14px;padding:14px;text-align:center;border:1px solid #ede9ff}
  .stat .num{font-size:24px;font-weight:900;color:#1a1a2e}.stat .lbl{font-size:10px;color:#9b96b0;font-weight:700;text-transform:uppercase;margin-top:4px}
  .item{padding:11px 0;border-bottom:1px solid #f5f3ff;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .item:last-child{border-bottom:none}
  .il{flex:1;min-width:0}.il strong{display:block;font-weight:700;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .il span{font-size:11px;color:#9b96b0}
  .badge{font-size:10px;font-weight:800;padding:3px 10px;border-radius:99px;white-space:nowrap;flex-shrink:0}
  .badge-red{background:#fff0f0;color:#c0392b;border:1px solid #ffd5d5}
  .badge-amber{background:#fffbeb;color:#92600a;border:1px solid #fde68a}
  .badge-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
  .allclear{text-align:center;padding:18px;color:#9b96b0;font-size:13px;background:#f8f7ff;border-radius:12px}
  .ftr{background:#f8f7ff;padding:16px 36px;text-align:center;font-size:11px;color:#b0adbe;border-top:1px solid #ede9ff}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>TGNE Daily Digest</h1><p>Agency briefing for ${today.toDateString()}</p></div>
  <div class="body">
    <div class="section"><h2>Overview</h2><div class="stat-row">
      <div class="stat"><div class="num">${allClients.length}</div><div class="lbl">Clients</div></div>
      <div class="stat"><div class="num">${pending.length}</div><div class="lbl">Pending</div></div>
      <div class="stat"><div class="num">${overdueTasks.length}</div><div class="lbl">Overdue Tasks</div></div>
      <div class="stat"><div class="num">${expiringIn30.length}</div><div class="lbl">Expiring Domains</div></div>
      <div class="stat"><div class="num">GHS ${totalPaid.toLocaleString()}</div><div class="lbl">Revenue</div></div>
    </div></div>

    ${pending.length > 0 ? `<div class="section"><h2>Pending Invoices (${pending.length})</h2>
      ${pending.slice(0, 8).map(p => {
        const c   = allClients.find(c => c.id === p.clientId);
        const age = Math.round((today.getTime() - new Date(p.paymentDate).getTime()) / 86400000);
        return `<div class="item"><div class="il"><strong>${p.invoiceNumber || 'Invoice'}</strong><span>${c?.businessName ?? 'Unknown'}</span></div>
        <span class="badge ${age > 30 ? 'badge-red' : 'badge-amber'}">GHS ${p.amount.toLocaleString()} · ${age}d old</span></div>`;
      }).join('')}</div>` : `<div class="section"><h2>Pending Invoices</h2><div class="allclear">✓ All invoices paid</div></div>`}

    ${expiringIn30.length > 0 ? `<div class="section"><h2>Domains Expiring in 30 Days (${expiringIn30.length})</h2>
      ${expiringIn30.slice(0, 8).map(w => {
        const diff = Math.round((new Date(w.expiryDate!).getTime() - today.getTime()) / 86400000);
        const c    = allClients.find(c => c.id === w.clientId);
        return `<div class="item"><div class="il"><strong>${w.domainName}</strong><span>${c?.businessName ?? ''}</span></div>
        <span class="badge ${diff <= 7 ? 'badge-red' : 'badge-amber'}">${diff}d left</span></div>`;
      }).join('')}</div>` : ''}

    ${overdueTasks.length > 0 ? `<div class="section"><h2>Overdue Tasks (${overdueTasks.length})</h2>
      ${overdueTasks.slice(0, 6).map(t => {
        const c   = allClients.find(c => c.id === t.clientId);
        const age = Math.round((today.getTime() - new Date(t.dueDate!).getTime()) / 86400000);
        return `<div class="item"><div class="il"><strong>${t.description.slice(0, 55)}${t.description.length > 55 ? '…' : ''}</strong><span>${c?.businessName ?? ''}</span></div>
        <span class="badge badge-red">${age}d overdue</span></div>`;
      }).join('')}</div>` : ''}

    ${unreadReminders.length > 0 ? `<div class="section"><h2>Unread Reminders (${unreadReminders.length})</h2>
      ${unreadReminders.slice(0, 6).map(r => `<div class="item"><div class="il"><strong>${r.title}</strong><span>${r.type}</span></div>
      <span class="badge badge-blue">${r.date}</span></div>`).join('')}</div>` : ''}
  </div>
  <div class="ftr">TGNE Agency · Accra, Ghana · Automated Digest · Do not reply</div>
</div></body></html>`;
}
