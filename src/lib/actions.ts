'use server';

import prisma from '@/lib/prisma';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';

export async function fetchAllData(): Promise<AppData> {
  const [clients, websites, credentials, tasks, reminders, payments] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.website.findMany(),
    prisma.credential.findMany(),
    prisma.task.findMany(),
    prisma.reminder.findMany({ orderBy: { date: 'asc' } }),
    prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    clients: clients.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })),
    websites: websites.map(w => ({ ...w, dateCreated: w.dateCreated?.toISOString(), expiryDate: w.expiryDate?.toISOString() })),
    credentials,
    tasks,
    reminders,
    payments: payments.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })),
  };
}

// Clients
export async function createClient(data: Partial<Client>) {
  return prisma.client.create({
    data: {
      name: data.name!,
      businessName: data.businessName!,
      phone: data.phone,
      email: data.email,
      location: data.location,
      avatarUrl: data.avatarUrl,
      notes: data.notes,
    }
  });
}

export async function updateClientAction(id: string, data: Partial<Client>) {
  return prisma.client.update({
    where: { id },
    data: {
      ...data,
      id: undefined,
    }
  });
}

export async function deleteClientAction(id: string) {
  return prisma.client.delete({ where: { id } });
}

// Websites
export async function createWebsite(data: Partial<Website>) {
  return prisma.website.create({
    data: {
      clientId: data.clientId!,
      domainName: data.domainName!,
      url: data.url,
      hostingProvider: data.hostingProvider,
      platform: data.platform,
      projectPrice: data.projectPrice,
      paymentStatus: data.paymentStatus,
      dateCreated: data.dateCreated ? new Date(data.dateCreated) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    }
  });
}

// Credentials
export async function createCredential(data: Partial<Credential>) {
  return prisma.credential.create({
    data: {
      clientId: data.clientId!,
      serviceName: data.serviceName!,
      username: data.username!,
      password: Buffer.from(data.password || '').toString('base64'),
      url: data.url,
    }
  });
}

// Tasks
export async function createTask(data: Partial<Task>) {
  return prisma.task.create({
    data: {
      clientId: data.clientId!,
      description: data.description!,
      status: data.status || 'Pending',
      dueDate: data.dueDate,
    }
  });
}

export async function updateTaskAction(id: string, status: string) {
  return prisma.task.update({
    where: { id },
    data: { status }
  });
}

// Reminders
export async function createReminder(data: Partial<Reminder>) {
  return prisma.reminder.create({
    data: {
      type: data.type!,
      title: data.title!,
      date: data.date!,
      details: data.details,
    }
  });
}

export async function deleteReminderAction(id: string) {
  return prisma.reminder.delete({ where: { id } });
}

// Payments
export async function createPayment(data: Partial<Payment>) {
  return prisma.payment.create({
    data: {
      clientId: data.clientId!,
      amount: data.amount!,
      status: data.status!,
      date: data.date!,
    }
  });
}

export async function updatePaymentAction(id: string, updates: Partial<Payment>) {
  return prisma.payment.update({
    where: { id },
    data: { ...updates, id: undefined }
  });
}

export async function deletePaymentAction(id: string) {
  return prisma.payment.delete({ where: { id } });
}