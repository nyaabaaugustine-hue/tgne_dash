/**
 * src/lib/export-utils.ts
 * Legacy export helpers used by the dashboard sidebar.
 * Wraps the main export-import.ts functions.
 */
import { Client, Website, Payment, Task, Reminder } from './types';
import {
  exportClientsCSV,
  exportPaymentsCSV,
  exportAllToExcel,
} from './export-import';

export function exportClientsCsv(clients: Client[]) {
  exportClientsCSV(clients);
}

export function exportPaymentsCsv(payments: Payment[], clients: Client[]) {
  exportPaymentsCSV(payments, clients);
}

export async function exportFullReportPdf(
  clients:   Client[],
  websites:  Website[],
  payments:  Payment[],
  tasks:     Task[],
  reminders: Reminder[],
) {
  // Full report via Excel export (jsPDF not available in all environments)
  await exportAllToExcel({ clients, websites, credentials: [], tasks, reminders, payments });
}
