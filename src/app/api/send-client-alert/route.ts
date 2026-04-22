/**
 * /api/send-client-alert
 * Sends a formatted alert email to a specific client.
 * Supports BOTH Resend (RESEND_API_KEY) and Brevo (BREVO_API_KEY).
 * Resend is tried first; Brevo is fallback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clients, websites, reminders, tasks, payments } from '@/db/schema';
import { differenceInCalendarDays } from 'date-fns';
import { rollbar } from '@/lib/rollbar';

export const runtime = 'nodejs';

interface AlertItem {
  type:     'website' | 'reminder' | 'invoice' | 'task';
  title:    string;
  detail:   string;
  daysLeft: number;
  date:     string;
  amount?:  number;
}

function urgencyColor(d: number) {
  if (d < 0)  return '#dc2626';
  if (d <= 3) return '#ea580c';
  if (d <= 7) return '#d97706';
  return '#059669';
}
function urgencyLabel(d: number) {
  if (d < 0)  return `OVERDUE BY ${Math.abs(d)} DAYS`;
  if (d === 0) return 'DUE TODAY';
  if (d <= 7) return `${d} DAYS LEFT — URGENT`;
  return `DUE IN ${d} DAYS`;
}

function buildHtml(clientName: string, businessName: string, alerts: AlertItem[]) {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
  const urgentCount  = alerts.filter(a => a.daysLeft >= 0 && a.daysLeft <= 7).length;

  const typeLabel = (t: AlertItem['type']) =>
    ({ website: 'Domain/Hosting Renewal', reminder: 'Reminder', invoice: 'Invoice Due', task: 'Task Due' })[t];

  const cards = alerts.map(a => `
    <div style="margin-bottom:12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="display:flex;">
        <div style="width:5px;background:${urgencyColor(a.daysLeft)};flex-shrink:0;"></div>
        <div style="padding:16px 20px;flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div>
              <div style="font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${urgencyColor(a.daysLeft)};margin-bottom:6px;">${typeLabel(a.type)}</div>
              <div style="font-size:15px;font-weight:700;color:#0f172a;">${a.title}</div>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">${a.detail}</div>
              ${a.amount ? `<div style="font-size:13px;font-weight:700;margin-top:6px;">Amount: GHS ${a.amount.toLocaleString()}</div>` : ''}
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:10px;font-weight:800;color:${urgencyColor(a.daysLeft)};white-space:nowrap;">${urgencyLabel(a.daysLeft)}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${a.date}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="height:5px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4);"></div>
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;">
    <div style="font-size:11px;color:#6366f1;font-weight:800;letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px;">TGNE PREMIUM WEB SOLUTIONS</div>
    <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px;">Account Alert <span style="color:#6366f1;">Notification</span></div>
    <div style="font-size:11px;color:#94a3b8;margin-top:8px;">${date}</div>
  </div>
  <div style="padding:28px 40px 0;">
    <p style="font-size:15px;color:#334155;margin:0 0 8px;">Hello <strong>${clientName}</strong>,</p>
    <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0;">
      This is a friendly reminder from TGNE regarding upcoming items for <strong>${businessName}</strong>.
    </p>
  </div>
  ${(overdueCount > 0 || urgentCount > 0) ? `
  <div style="margin:20px 40px 0;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px;padding:14px 18px;">
    ${overdueCount > 0 ? `<span style="font-size:13px;font-weight:700;color:#dc2626;">${overdueCount} item${overdueCount>1?'s':''} overdue.</span> ` : ''}
    ${urgentCount > 0 ? `<span style="font-size:13px;font-weight:700;color:#ea580c;">${urgentCount} item${urgentCount>1?'s':''} urgent.</span>` : ''}
    <div style="font-size:12px;color:#991b1b;margin-top:4px;">Please review and take action promptly.</div>
  </div>` : ''}
  <div style="padding:24px 40px;">
    <div style="font-size:10px;font-weight:800;color:#94a3b8;letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px;">${alerts.length} ITEM${alerts.length!==1?'S':''} REQUIRING ATTENTION</div>
    ${cards}
  </div>
  <div style="margin:0 40px 32px;background:#f8faff;border:1px solid #e0e7ff;border-radius:14px;padding:22px;text-align:center;">
    <p style="font-size:13px;color:#475569;margin:0 0 14px;">Please contact your account manager to resolve these items.</p>
    <a href="mailto:info@tgne.co" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:10px;text-decoration:none;">
      Contact Your Account Team
    </a>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center;font-size:11px;color:#94a3b8;">
    TGNE Premium Web Solutions · Accra, Ghana · info@tgne.co
  </div>
</div>
</body></html>`;
}

// ─── Send via Resend ──────────────────────────────────────────────────────────

async function sendViaResend(to: string, clientName: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key  = (process.env.RESEND_API_KEY ?? '').trim();
  const from = (process.env.RESEND_FROM_EMAIL ?? '').trim() || 'onboarding@resend.dev';

  if (!key) return { ok: false, error: 'RESEND_API_KEY not configured' };

  const res  = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (res.ok) return { ok: true };

  const body = await res.text();
  let msg = body;
  try { msg = (JSON.parse(body) as { message?: string })?.message ?? body; } catch {}

  if (msg.includes('testing emails') || msg.includes('not allowed to send')) {
    msg = `Resend free tier only allows sending to your own verified email. Upgrade Resend or use the DIGEST_EMAIL address that matches your Resend account.`;
  } else if (msg.includes('domain is not verified')) {
    msg = `The from-address domain "${from.split('@')[1]}" is not verified in Resend. Leave RESEND_FROM_EMAIL unset to use onboarding@resend.dev, or verify your domain.`;
  }

  return { ok: false, error: `Resend ${res.status}: ${msg}` };
}

// ─── Send via Brevo ───────────────────────────────────────────────────────────

async function sendViaBrevo(to: string, toName: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const key         = (process.env.BREVO_API_KEY ?? '').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL ?? '').trim();
  const senderName  = (process.env.BREVO_SENDER_NAME ?? 'TGNE Alerts').trim();

  if (!key || !senderEmail) return { ok: false, error: 'BREVO_API_KEY or BREVO_SENDER_EMAIL not configured' };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender:      { name: senderName, email: senderEmail },
      to:          [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => ({}));
  return { ok: false, error: `Brevo ${res.status}: ${(body as { message?: string })?.message ?? JSON.stringify(body)}` };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, types = ['website', 'reminder', 'invoice', 'task'], daysWindow = 30 } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    // Load client
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (!client.email) {
      return NextResponse.json({ error: `Client "${client.businessName}" has no email address on file. Add an email to this client first.` }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      return NextResponse.json({ error: `Client email "${client.email}" appears invalid.` }, { status: 400 });
    }

    const today  = new Date();
    const alerts: AlertItem[] = [];

    if (types.includes('website')) {
      const rows = await db.select().from(websites).where(eq(websites.clientId, clientId));
      for (const w of rows) {
        if (!w.expiryDate) continue;
        const d = differenceInCalendarDays(new Date(w.expiryDate), today);
        if (d <= daysWindow) alerts.push({ type: 'website', title: `${w.domainName} renewal`, detail: `${w.platform ?? 'Website'} on ${w.hostingProvider ?? 'your host'}`, daysLeft: d, date: w.expiryDate.split('T')[0], amount: w.projectPrice ?? undefined });
      }
    }
    if (types.includes('reminder')) {
      const rows = await db.select().from(reminders);
      for (const r of rows) {
        if (!r.date) continue;
        const d = differenceInCalendarDays(new Date(r.date), today);
        if (d <= daysWindow) alerts.push({ type: 'reminder', title: r.title, detail: r.details ?? r.type, daysLeft: d, date: r.date });
      }
    }
    if (types.includes('invoice')) {
      const rows = await db.select().from(payments).where(eq(payments.clientId, clientId));
      for (const p of rows) {
        if (p.status !== 'PENDING') continue;
        const d = differenceInCalendarDays(new Date(p.paymentDate), today);
        if (d <= daysWindow) alerts.push({ type: 'invoice', title: p.invoiceNumber ? `Invoice ${p.invoiceNumber}` : 'Outstanding Invoice', detail: p.description ?? 'Payment due', daysLeft: d, date: p.paymentDate, amount: p.amount });
      }
    }
    if (types.includes('task')) {
      const rows = await db.select().from(tasks).where(eq(tasks.clientId, clientId));
      for (const t of rows) {
        if (!t.dueDate || t.status === 'Completed') continue;
        const d = differenceInCalendarDays(new Date(t.dueDate), today);
        if (d <= daysWindow) alerts.push({ type: 'task', title: t.description.slice(0, 80), detail: `Status: ${t.status}`, daysLeft: d, date: t.dueDate });
      }
    }

    alerts.sort((a, b) => a.daysLeft - b.daysLeft);

    if (alerts.length === 0) {
      return NextResponse.json({ sent: false, message: `No items found for "${client.businessName}" within ${daysWindow} days for the selected types.` });
    }

    const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
    const subject      = overdueCount > 0
      ? `[TGNE] Action Required: ${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} on your account`
      : `[TGNE] Account reminder: ${alerts.length} upcoming item${alerts.length > 1 ? 's' : ''} for ${client.businessName}`;
    const html = buildHtml(client.name, client.businessName, alerts);

    // Try Resend first, then Brevo
    let result = await sendViaResend(client.email, client.name, subject, html);
    let provider = 'Resend';

    if (!result.ok) {
      const resendError = result.error;
      result = await sendViaBrevo(client.email, client.name, subject, html);
      provider = 'Brevo';

      if (!result.ok) {
        return NextResponse.json({
          sent:   false,
          error:  'Email could not be sent via Resend or Brevo.',
          resend: resendError,
          brevo:  result.error,
          hint:   'Set RESEND_API_KEY (and optionally RESEND_FROM_EMAIL) or BREVO_API_KEY + BREVO_SENDER_EMAIL in your .env file.',
        }, { status: 502 });
      }
    }

    return NextResponse.json({
      sent:       true,
      to:         client.email,
      alertCount: alerts.length,
      provider,
    });

  } catch (err) {
    rollbar.error('[POST /api/send-client-alert]', err);
    console.error('[POST /api/send-client-alert]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
