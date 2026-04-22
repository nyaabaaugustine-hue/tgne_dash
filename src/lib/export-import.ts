/**
 * src/lib/export-import.ts
 * Export full agency data to Excel (.xlsx) or CSV, and import from CSV/Excel.
 * Uses SheetJS (xlsx) — already in package.json via SheetJS browser build (CDN).
 * For server-side we use the pure-JS approach with no native bindings.
 */

import { AppData, Client, Website, Payment, Task, Reminder, Credential } from './types';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCSV(row: unknown[]): string {
  return row.map(escapeCell).join(',');
}

function sheetToCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map(rowToCSV).join('\r\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── Export to CSV ────────────────────────────────────────────────────────────

export function exportClientsCSV(clients: Client[]) {
  const headers = ['ID','Business Name','Contact Name','Email','Phone','Status','Industry','Business Type','Currency','VAT','Payment Terms','Preferred Payment','Country','City','Account Manager','Tags','Notes','Created'];
  const rows = clients.map(c => [
    c.id, c.businessName, c.name, c.email ?? '', c.phone ?? '',
    c.status ?? '', c.industry ?? '', c.businessType ?? '',
    c.currency ?? 'GHS', c.vatEnabled ? 'Yes' : 'No',
    c.paymentTerms ?? '', c.preferredPayment ?? '',
    c.country ?? '', c.city ?? '', c.accountManager ?? '',
    c.tags ?? '', c.notes ?? '', c.createdAt,
  ]);
  downloadFile(sheetToCSV(headers, rows), `tgne_clients_${today()}.csv`, 'text/csv');
}

export function exportWebsitesCSV(websites: Website[], clients: Client[]) {
  const headers = ['ID','Client','Domain','URL','Platform','Hosting Provider','Project Price','Payment Status','Expiry Date','Date Created'];
  const rows = websites.map(w => {
    const c = clients.find(cl => cl.id === w.clientId);
    return [w.id, c?.businessName ?? w.clientId, w.domainName, w.url, w.platform, w.hostingProvider, w.projectPrice, w.paymentStatus, w.expiryDate ?? '', w.dateCreated];
  });
  downloadFile(sheetToCSV(headers, rows), `tgne_websites_${today()}.csv`, 'text/csv');
}

export function exportPaymentsCSV(payments: Payment[], clients: Client[]) {
  const headers = ['ID','Invoice #','Client','Amount (GHS)','Status','Payment Date','Description','Created'];
  const rows = payments.map(p => {
    const c = clients.find(cl => cl.id === p.clientId);
    return [p.id, p.invoiceNumber, c?.businessName ?? p.clientId, p.amount, p.status, p.paymentDate, p.description, p.createdAt];
  });
  downloadFile(sheetToCSV(headers, rows), `tgne_invoices_${today()}.csv`, 'text/csv');
}

export function exportTasksCSV(tasks: Task[], clients: Client[]) {
  const headers = ['ID','Client','Description','Status','Due Date'];
  const rows = tasks.map(t => {
    const c = clients.find(cl => cl.id === t.clientId);
    return [t.id, c?.businessName ?? t.clientId, t.description, t.status, t.dueDate];
  });
  downloadFile(sheetToCSV(headers, rows), `tgne_tasks_${today()}.csv`, 'text/csv');
}

export function exportRemindersCSV(reminders: Reminder[]) {
  const headers = ['ID','Title','Type','Date','Details','Read'];
  const rows = reminders.map(r => [r.id, r.title, r.type, r.date, r.details, r.isRead ? 'Yes' : 'No']);
  downloadFile(sheetToCSV(headers, rows), `tgne_reminders_${today()}.csv`, 'text/csv');
}

// ─── Export full data to Excel (.xlsx) via SheetJS ────────────────────────────

export async function exportAllToExcel(data: AppData) {
  // Dynamically import SheetJS — no native bindings needed
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // Clients sheet
  const clientRows = [
    ['ID','Business Name','Contact Name','Email','Phone','Status','Industry','Business Type','Currency','VAT','Payment Terms','Preferred Payment','Country','City','Account Manager','Tags','Notes','Created'],
    ...data.clients.map(c => [
      c.id, c.businessName, c.name, c.email ?? '', c.phone ?? '',
      c.status ?? '', c.industry ?? '', c.businessType ?? '',
      c.currency ?? 'GHS', c.vatEnabled ? 'Yes' : 'No',
      c.paymentTerms ?? '', c.preferredPayment ?? '',
      c.country ?? '', c.city ?? '', c.accountManager ?? '',
      c.tags ?? '', c.notes ?? '', c.createdAt,
    ]),
  ];
  const clientWS = XLSX.utils.aoa_to_sheet(clientRows);
  styleHeaderRow(clientWS, clientRows[0].length);
  XLSX.utils.book_append_sheet(wb, clientWS, 'Clients');

  // Websites sheet
  const webRows = [
    ['ID','Client','Domain','URL','Platform','Hosting Provider','Project Price','Payment Status','Expiry Date'],
    ...data.websites.map(w => {
      const c = data.clients.find(cl => cl.id === w.clientId);
      return [w.id, c?.businessName ?? w.clientId, w.domainName, w.url, w.platform, w.hostingProvider, w.projectPrice, w.paymentStatus, w.expiryDate ?? ''];
    }),
  ];
  const webWS = XLSX.utils.aoa_to_sheet(webRows);
  styleHeaderRow(webWS, webRows[0].length);
  XLSX.utils.book_append_sheet(wb, webWS, 'Websites');

  // Invoices sheet
  const invRows = [
    ['ID','Invoice #','Client','Amount (GHS)','Status','Payment Date','Description','Created'],
    ...data.payments.map(p => {
      const c = data.clients.find(cl => cl.id === p.clientId);
      return [p.id, p.invoiceNumber, c?.businessName ?? p.clientId, p.amount, p.status, p.paymentDate, p.description, p.createdAt];
    }),
  ];
  const invWS = XLSX.utils.aoa_to_sheet(invRows);
  styleHeaderRow(invWS, invRows[0].length);
  XLSX.utils.book_append_sheet(wb, invWS, 'Invoices');

  // Tasks sheet
  const taskRows = [
    ['ID','Client','Description','Status','Due Date'],
    ...data.tasks.map(t => {
      const c = data.clients.find(cl => cl.id === t.clientId);
      return [t.id, c?.businessName ?? t.clientId, t.description, t.status, t.dueDate];
    }),
  ];
  const taskWS = XLSX.utils.aoa_to_sheet(taskRows);
  styleHeaderRow(taskWS, taskRows[0].length);
  XLSX.utils.book_append_sheet(wb, taskWS, 'Tasks');

  // Reminders sheet
  const remRows = [
    ['ID','Title','Type','Date','Details','Read'],
    ...data.reminders.map(r => [r.id, r.title, r.type, r.date, r.details, r.isRead ? 'Yes' : 'No']),
  ];
  const remWS = XLSX.utils.aoa_to_sheet(remRows);
  styleHeaderRow(remWS, remRows[0].length);
  XLSX.utils.book_append_sheet(wb, remWS, 'Reminders');

  // Revenue summary sheet
  const totalPaid    = data.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalPending = data.payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const summaryRows = [
    ['TGNE Agency Data Export', '', `Generated: ${new Date().toLocaleString()}`],
    [],
    ['Metric', 'Value'],
    ['Total Clients',   data.clients.length],
    ['Total Websites',  data.websites.length],
    ['Total Invoices',  data.payments.length],
    ['Total Tasks',     data.tasks.length],
    ['Total Reminders', data.reminders.length],
    [],
    ['Revenue Collected (GHS)', totalPaid],
    ['Revenue Pending (GHS)',   totalPending],
    ['Total Revenue (GHS)',     totalPaid + totalPending],
  ];
  const summaryWS = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

  XLSX.writeFile(wb, `TGNE_Export_${today()}.xlsx`);
}

// ─── Import from CSV ──────────────────────────────────────────────────────────

export interface ImportResult {
  type: 'client' | 'website' | 'payment' | 'task' | 'reminder';
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote  = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function parseExcelSheet(file: File, sheetName?: string): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx');
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type: 'array' });
  const sheet = sheetName
    ? wb.Sheets[sheetName]
    : wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, string>[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// Applies bold + background to the header row of a SheetJS worksheet
function styleHeaderRow(ws: import('xlsx').WorkSheet, cols: number) {
  for (let c = 0; c < cols; c++) {
    const addr = String.fromCharCode(65 + c) + '1';
    if (ws[addr]) {
      ws[addr].s = {
        font:    { bold: true, color: { rgb: 'FFFFFF' } },
        fill:    { fgColor: { rgb: '6544D6' } },
        alignment: { horizontal: 'center' },
      };
    }
  }
  if (!ws['!cols']) {
    ws['!cols'] = Array(cols).fill({ wch: 20 });
  }
}
