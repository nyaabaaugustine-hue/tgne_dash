/**
 * src/lib/email.ts
 * Brevo transactional email service for TGNE Dashboard.
 *
 * Supports multiple admin recipients via TGNE_ADMIN_EMAILS (comma-separated).
 * Falls back to TGNE_ADMIN_EMAIL for single-recipient compat.
 *
 * API docs: https://developers.brevo.com/docs/send-a-transactional-email
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 * Auth:     Header  api-key: <BREVO_API_KEY>
 */

export interface DueAlert {
  type:        'reminder' | 'website' | 'task';
  title:       string;
  detail:      string;
  daysLeft:    number;
  clientName?: string;
  date:        string;
}

export interface SendResult {
  sent:       boolean;
  sentCount?: number;
  recipients?: string[];
  messageIds?: string[];
  error?:     string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function parseAdminEmails(): string[] {
  // Support TGNE_ADMIN_EMAILS (comma-sep) with fallback to TGNE_ADMIN_EMAIL
  const multi  = process.env.TGNE_ADMIN_EMAILS ?? '';
  const single = process.env.TGNE_ADMIN_EMAIL  ?? '';
  const raw    = multi || single;
  return raw.split(',').map(e => e.trim()).filter(Boolean);
}

function urgencyBadge(daysLeft: number): string {
  if (daysLeft < 0)   return `OVERDUE by ${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'DUE TODAY';
  if (daysLeft <= 3)  return `URGENT — ${daysLeft}d left`;
  if (daysLeft <= 7)  return `${daysLeft} days left`;
  return `${daysLeft} days away`;
}

function urgencyHex(daysLeft: number): string {
  if (daysLeft < 0)  return '#ef4444';
  if (daysLeft <= 3) return '#f97316';
  if (daysLeft <= 7) return '#eab308';
  return '#22c55e';
}

function typeIcon(type: DueAlert['type']): string {
  return type === 'website' ? '🌐' : type === 'task' ? '✅' : '🔔';
}

// ─── Alert digest HTML ─────────────────────────────────────────────────────────

function buildAlertHtml(alerts: DueAlert[], recipientEmail?: string): string {
  const dateStr      = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
  const urgentCount  = alerts.filter(a => a.daysLeft >= 0 && a.daysLeft <= 7).length;

  // Group expiring websites separately for prominence
  const websiteAlerts = alerts.filter(a => a.type === 'website');
  const otherAlerts   = alerts.filter(a => a.type !== 'website');

  const domainRows = websiteAlerts.map(a => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:12px 16px;vertical-align:middle;">
        <span style="display:inline-block;background:${urgencyHex(a.daysLeft)}18;color:${urgencyHex(a.daysLeft)};
          border:1px solid ${urgencyHex(a.daysLeft)}40;border-radius:999px;font-size:9px;font-weight:900;
          padding:3px 10px;letter-spacing:0.08em;white-space:nowrap;">${urgencyBadge(a.daysLeft).toUpperCase()}</span>
      </td>
      <td style="padding:12px 16px;vertical-align:middle;">
        <div style="font-weight:700;color:#f1f5f9;font-size:14px;">🌐 ${a.title}</div>
        <div style="color:#64748b;font-size:11px;margin-top:2px;">${a.detail}</div>
      </td>
      <td style="padding:12px 16px;vertical-align:middle;color:#94a3b8;font-size:13px;">${a.clientName ?? '—'}</td>
      <td style="padding:12px 16px;vertical-align:middle;color:#64748b;font-size:12px;white-space:nowrap;">${a.date}</td>
    </tr>`).join('');

  const otherRows = otherAlerts.map(a => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:12px 16px;vertical-align:middle;">
        <span style="display:inline-block;background:${urgencyHex(a.daysLeft)}18;color:${urgencyHex(a.daysLeft)};
          border:1px solid ${urgencyHex(a.daysLeft)}40;border-radius:999px;font-size:9px;font-weight:900;
          padding:3px 10px;letter-spacing:0.08em;white-space:nowrap;">${urgencyBadge(a.daysLeft).toUpperCase()}</span>
      </td>
      <td style="padding:12px 16px;vertical-align:middle;">
        <div style="font-weight:700;color:#f1f5f9;font-size:14px;">${typeIcon(a.type)} ${a.title}</div>
        <div style="color:#64748b;font-size:11px;margin-top:2px;">${a.detail}</div>
      </td>
      <td style="padding:12px 16px;vertical-align:middle;color:#94a3b8;font-size:13px;">${a.clientName ?? '—'}</td>
      <td style="padding:12px 16px;vertical-align:middle;color:#64748b;font-size:12px;white-space:nowrap;">${a.date}</td>
    </tr>`).join('');

  const tableHead = `
    <tr style="background:#1e293b;">
      <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">STATUS</th>
      <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">ITEM</th>
      <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">CLIENT</th>
      <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">DATE</th>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#020817;font-family:'Inter',Arial,sans-serif;">
<div style="max-width:700px;margin:32px auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

  <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6d28d9,#4f46e5);"></div>

  <div style="padding:28px 36px 18px;background:linear-gradient(135deg,#0f172a,#1e1b4b);">
    <table style="width:100%;border-collapse:collapse;"><tr>
      <td>
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">TGNE CORE</div>
        <div style="font-size:10px;color:#7c3aed;margin-top:3px;font-weight:700;letter-spacing:0.15em;">
          🌐 DOMAIN EXPIRY &amp; DAILY ALERT DIGEST
        </div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="font-size:11px;color:#475569;">${dateStr}</div>
        ${recipientEmail ? `<div style="font-size:10px;color:#334155;margin-top:3px;">To: ${recipientEmail}</div>` : ''}
      </td>
    </tr></table>
  </div>

  <div style="padding:14px 36px;background:#0a0f1e;border-bottom:1px solid #1e293b;">
    <table><tr style="gap:8px;">
      <td style="padding-right:10px;">
        <span style="background:#ef444418;color:#ef4444;border:1px solid #ef444430;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          ⚡ ${overdueCount} OVERDUE
        </span>
      </td>
      <td style="padding-right:10px;">
        <span style="background:#f9741618;color:#f97316;border:1px solid #f9741630;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          🔥 ${urgentCount} URGENT
        </span>
      </td>
      <td style="padding-right:10px;">
        <span style="background:#1e40af18;color:#60a5fa;border:1px solid #1e40af30;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          🌐 ${websiteAlerts.length} DOMAINS
        </span>
      </td>
      <td>
        <span style="background:#7c3aed18;color:#a78bfa;border:1px solid #7c3aed30;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          📋 ${alerts.length} TOTAL
        </span>
      </td>
    </tr></table>
  </div>

  ${websiteAlerts.length > 0 ? `
  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#60a5fa;letter-spacing:0.15em;margin-bottom:10px;">
      🌐 EXPIRING DOMAINS (GHS)
    </div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e40af40;">
      <thead>${tableHead}</thead>
      <tbody>${domainRows}</tbody>
    </table>
  </div>` : ''}

  ${otherAlerts.length > 0 ? `
  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#7c3aed;letter-spacing:0.15em;margin-bottom:10px;">
      📋 OTHER ALERTS
    </div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e293b;">
      <thead>${tableHead}</thead>
      <tbody>${otherRows}</tbody>
    </table>
  </div>` : ''}

  <div style="padding:20px 36px 28px;">
    <div style="background:linear-gradient(135deg,#7c3aed18,#4f46e518);border:1px solid #7c3aed30;border-radius:12px;padding:16px 22px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 10px;">
        Action these items in your TGNE Dashboard before they become critical.
      </p>
      <a href="https://tgnewebdash.vercel.app/reminders"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:800;font-size:13px;padding:9px 22px;border-radius:8px;text-decoration:none;">
        Open Dashboard →
      </a>
    </div>
  </div>

  <div style="padding:14px 36px;border-top:1px solid #0f172a;background:#060a14;text-align:center;">
    <p style="color:#1e293b;font-size:11px;margin:0;">
      TGNE — Premium Web Solutions &bull; Accra, Ghana &bull; Reminder for Expiring Domains
    </p>
  </div>
</div>
</body></html>`;
}

// ─── Manual digest HTML (for period reports) ──────────────────────────────────

export interface DigestReport {
  period:             string;
  newClients:         { name: string; business: string; date: string }[];
  paidInvoices:       { invoiceNo: string; client: string; amount: number; date: string }[];
  pendingInvoices:    { invoiceNo: string; client: string; amount: number; date: string }[];
  completedTasks:     { desc: string; client: string; date: string }[];
  expiringDomains:    { domain: string; client: string; daysLeft: number; expiry: string }[];
  totalPaid:          number;
  totalPending:       number;
}

function buildDigestHtml(report: DigestReport, recipientEmail?: string): string {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const clientRows = report.newClients.map(c =>
    `<tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px 14px;color:#f1f5f9;font-weight:600;">${c.business}</td>
      <td style="padding:10px 14px;color:#94a3b8;">${c.name}</td>
      <td style="padding:10px 14px;color:#64748b;font-size:11px;">${c.date}</td>
    </tr>`).join('') || `<tr><td colspan="3" style="padding:14px;color:#475569;text-align:center;font-style:italic;">No new clients in this period</td></tr>`;

  const paidRows = report.paidInvoices.map(p =>
    `<tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px 14px;color:#f1f5f9;font-weight:600;">${p.invoiceNo}</td>
      <td style="padding:10px 14px;color:#94a3b8;">${p.client}</td>
      <td style="padding:10px 14px;color:#22c55e;font-weight:800;">GHS ${p.amount.toLocaleString()}</td>
      <td style="padding:10px 14px;color:#64748b;font-size:11px;">${p.date}</td>
    </tr>`).join('') || `<tr><td colspan="4" style="padding:14px;color:#475569;text-align:center;font-style:italic;">No paid invoices in this period</td></tr>`;

  const pendingRows = report.pendingInvoices.map(p =>
    `<tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px 14px;color:#f1f5f9;font-weight:600;">${p.invoiceNo}</td>
      <td style="padding:10px 14px;color:#94a3b8;">${p.client}</td>
      <td style="padding:10px 14px;color:#f97316;font-weight:800;">GHS ${p.amount.toLocaleString()}</td>
      <td style="padding:10px 14px;color:#64748b;font-size:11px;">${p.date}</td>
    </tr>`).join('') || `<tr><td colspan="4" style="padding:14px;color:#475569;text-align:center;font-style:italic;">No pending invoices in this period</td></tr>`;

  const domainRows = report.expiringDomains.map(d =>
    `<tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:10px 14px;color:#60a5fa;font-weight:700;">🌐 ${d.domain}</td>
      <td style="padding:10px 14px;color:#94a3b8;">${d.client}</td>
      <td style="padding:10px 14px;">
        <span style="background:${d.daysLeft < 0 ? '#ef444418' : d.daysLeft <= 7 ? '#f9741618' : '#eab30818'};
          color:${d.daysLeft < 0 ? '#ef4444' : d.daysLeft <= 7 ? '#f97316' : '#eab308'};
          border-radius:999px;padding:2px 10px;font-size:10px;font-weight:900;">
          ${d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d OVERDUE` : `${d.daysLeft}d left`}
        </span>
      </td>
      <td style="padding:10px 14px;color:#64748b;font-size:11px;">${d.expiry}</td>
    </tr>`).join('') || `<tr><td colspan="4" style="padding:14px;color:#475569;text-align:center;font-style:italic;">No expiring domains in this period</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#020817;font-family:'Inter',Arial,sans-serif;">
<div style="max-width:720px;margin:32px auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

  <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6d28d9,#4f46e5);"></div>

  <div style="padding:28px 36px 18px;background:linear-gradient(135deg,#0f172a,#1e1b4b);">
    <table style="width:100%;border-collapse:collapse;"><tr>
      <td>
        <div style="font-size:22px;font-weight:900;color:#fff;">TGNE CORE</div>
        <div style="font-size:10px;color:#7c3aed;margin-top:3px;font-weight:700;letter-spacing:0.15em;">
          📊 AGENCY DIGEST REPORT
        </div>
        <div style="font-size:12px;color:#475569;margin-top:5px;">Period: <strong style="color:#94a3b8;">${report.period}</strong></div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="font-size:11px;color:#475569;">${dateStr}</div>
        ${recipientEmail ? `<div style="font-size:10px;color:#334155;margin-top:3px;">To: ${recipientEmail}</div>` : ''}
      </td>
    </tr></table>
  </div>

  <!-- Summary Row -->
  <div style="padding:14px 36px;background:#0a0f1e;border-bottom:1px solid #1e293b;">
    <table><tr>
      <td style="padding-right:10px;">
        <span style="background:#22c55e18;color:#22c55e;border:1px solid #22c55e30;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          💰 GHS ${report.totalPaid.toLocaleString()} PAID
        </span>
      </td>
      <td style="padding-right:10px;">
        <span style="background:#f9741618;color:#f97316;border:1px solid #f9741630;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          ⏳ GHS ${report.totalPending.toLocaleString()} PENDING
        </span>
      </td>
      <td style="padding-right:10px;">
        <span style="background:#7c3aed18;color:#a78bfa;border:1px solid #7c3aed30;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          👥 ${report.newClients.length} NEW CLIENTS
        </span>
      </td>
      <td>
        <span style="background:#1e40af18;color:#60a5fa;border:1px solid #1e40af30;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:800;">
          🌐 ${report.expiringDomains.length} EXPIRING
        </span>
      </td>
    </tr></table>
  </div>

  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#60a5fa;letter-spacing:0.15em;margin-bottom:8px;">🌐 EXPIRING DOMAINS (GHS)</div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e40af30;">
      <tr style="background:#1e293b;">
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">DOMAIN</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">CLIENT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">STATUS</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">EXPIRY DATE</th>
      </tr>
      ${domainRows}
    </table>
  </div>

  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#22c55e;letter-spacing:0.15em;margin-bottom:8px;">💰 PAID INVOICES</div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e293b;">
      <tr style="background:#1e293b;">
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">INVOICE #</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">CLIENT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">AMOUNT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">DATE</th>
      </tr>
      ${paidRows}
    </table>
  </div>

  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#f97316;letter-spacing:0.15em;margin-bottom:8px;">⏳ PENDING INVOICES</div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e293b;">
      <tr style="background:#1e293b;">
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">INVOICE #</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">CLIENT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">AMOUNT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">DATE</th>
      </tr>
      ${pendingRows}
    </table>
  </div>

  <div style="padding:20px 36px 0;">
    <div style="font-size:11px;font-weight:900;color:#a78bfa;letter-spacing:0.15em;margin-bottom:8px;">👥 NEW CLIENTS</div>
    <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:10px;overflow:hidden;border:1px solid #1e293b;">
      <tr style="background:#1e293b;">
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">BUSINESS</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">CONTACT</th>
        <th style="padding:9px 14px;text-align:left;font-size:9px;color:#475569;font-weight:900;">ADDED</th>
      </tr>
      ${clientRows}
    </table>
  </div>

  <div style="padding:20px 36px 28px;">
    <div style="background:linear-gradient(135deg,#7c3aed18,#4f46e518);border:1px solid #7c3aed30;border-radius:12px;padding:16px 22px;margin-top:8px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 10px;">View full details in your TGNE Dashboard.</p>
      <a href="https://tgnewebdash.vercel.app"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:800;font-size:13px;padding:9px 22px;border-radius:8px;text-decoration:none;">
        Open Dashboard →
      </a>
    </div>
  </div>

  <div style="padding:14px 36px;border-top:1px solid #0f172a;background:#060a14;text-align:center;">
    <p style="color:#1e293b;font-size:11px;margin:0;">
      TGNE — Premium Web Solutions &bull; Accra, Ghana &bull; Reminder for Expiring Domains
    </p>
  </div>
</div>
</body></html>`;
}

// ─── Core send function via Brevo ──────────────────────────────────────────────

async function sendBrevoEmail(opts: {
  toEmail:     string;
  subject:     string;
  html:        string;
  senderEmail: string;
  senderName:  string;
  apiKey:      string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': opts.apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender:      { name: opts.senderName, email: opts.senderEmail },
        to:          [{ email: opts.toEmail, name: 'TGNE Admin' }],
        subject:     opts.subject,
        htmlContent: opts.html,
        tags:        ['tgne-alert'],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${(body as any)?.message ?? JSON.stringify(body)}` };
    return { ok: true, messageId: (body as any)?.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Public: send alert digest to ALL admin emails ────────────────────────────

export async function sendDueDateAlert(alerts: DueAlert[]): Promise<SendResult> {
  const apiKey      = process.env.BREVO_API_KEY;
  const senderName  = process.env.BREVO_SENDER_NAME  || 'Reminder for Expiring Domains';
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const recipients  = parseAdminEmails();

  if (!apiKey)              return { sent: false, error: 'BREVO_API_KEY not configured' };
  if (!senderEmail)         return { sent: false, error: 'BREVO_SENDER_EMAIL not configured' };
  if (recipients.length === 0) return { sent: false, error: 'No admin emails configured (TGNE_ADMIN_EMAILS)' };
  if (alerts.length === 0)  return { sent: false, error: 'No alerts to send' };

  const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
  const subject = overdueCount > 0
    ? `[TGNE] ${overdueCount} OVERDUE + ${alerts.length - overdueCount} upcoming - Domain & Alert Digest`
    : `[TGNE] ${alerts.length} item${alerts.length !== 1 ? 's' : ''} due soon - Domain & Alert Digest`;

  // Send individually to each admin so each gets their own copy
  const results = await Promise.all(
    recipients.map(email =>
      sendBrevoEmail({
        toEmail:     email,
        subject,
        html:        buildAlertHtml(alerts, email),
        senderEmail,
        senderName,
        apiKey,
      })
    )
  );

  const successes = results.filter(r => r.ok);
  const failures  = results.filter(r => !r.ok);

  console.log(`[Brevo] Alert digest: ${successes.length}/${recipients.length} sent`);
  if (failures.length) console.error('[Brevo] Failures:', failures.map(f => f.error));

  return {
    sent:       successes.length > 0,
    sentCount:  successes.length,
    recipients,
    messageIds: successes.map(r => r.messageId).filter(Boolean) as string[],
    error:      failures.length ? failures.map(f => f.error).join('; ') : undefined,
  };
}

// ─── Public: send manual period digest to ALL admin emails ────────────────────

export async function sendDigestReport(report: DigestReport): Promise<SendResult> {
  const apiKey      = process.env.BREVO_API_KEY;
  const senderName  = process.env.BREVO_SENDER_NAME  || 'Reminder for Expiring Domains';
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const recipients  = parseAdminEmails();

  if (!apiKey)              return { sent: false, error: 'BREVO_API_KEY not configured' };
  if (!senderEmail)         return { sent: false, error: 'BREVO_SENDER_EMAIL not configured' };
  if (recipients.length === 0) return { sent: false, error: 'No admin emails configured (TGNE_ADMIN_EMAILS)' };

  const subject = `[TGNE] Agency Digest - ${report.period} | ${report.expiringDomains.length} expiring domains`;

  const results = await Promise.all(
    recipients.map(email =>
      sendBrevoEmail({
        toEmail:     email,
        subject,
        html:        buildDigestHtml(report, email),
        senderEmail,
        senderName,
        apiKey,
      })
    )
  );

  const successes = results.filter(r => r.ok);
  const failures  = results.filter(r => !r.ok);

  console.log(`[Brevo] Digest report: ${successes.length}/${recipients.length} sent`);

  return {
    sent:       successes.length > 0,
    sentCount:  successes.length,
    recipients,
    messageIds: successes.map(r => r.messageId).filter(Boolean) as string[],
    error:      failures.length ? failures.map(f => f.error).join('; ') : undefined,
  };
}
