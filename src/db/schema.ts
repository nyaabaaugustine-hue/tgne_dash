/**
 * src/db/schema.ts
 * Drizzle ORM schema — mirrors the existing Prisma schema exactly.
 * Table names and column names match what Prisma created in Neon
 * so no migration is needed; existing data is preserved.
 *
 * Prisma convention: PascalCase model name → quoted PascalCase table ("Client")
 * Prisma convention: camelCase field name  → quoted camelCase column ("businessName")
 */

import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a cuid2 — same format as Prisma's @default(cuid()) */
const cuid = () => createId();

// ─── Client ───────────────────────────────────────────────────────────────────

export const clients = pgTable(
  'Client',
  {
    id:           text('id').primaryKey().$defaultFn(cuid),
    name:         text('name').notNull(),
    businessName: text('businessName').notNull(),
    phone:        text('phone'),
    email:        text('email'),
    location:     text('location'),
    avatarUrl:    text('avatarUrl'),
    notes:        text('notes'),
    createdAt:    timestamp('createdAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
    updatedAt:    timestamp('updatedAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index('Client_email_idx').on(t.email),
  })
);

// ─── Website ──────────────────────────────────────────────────────────────────

export const websites = pgTable(
  'Website',
  {
    id:              text('id').primaryKey().$defaultFn(cuid),
    clientId:        text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    domainName:      text('domainName').notNull(),
    url:             text('url'),
    hostingProvider: text('hostingProvider'),
    platform:        text('platform'),
    dateCreated:     timestamp('dateCreated', { precision: 3, mode: 'string' }),
    projectPrice:    real('projectPrice'),
    paymentStatus:   text('paymentStatus'),
    expiryDate:      timestamp('expiryDate', { precision: 3, mode: 'string' }),
  },
  (t) => ({
    clientIdx: index('Website_clientId_idx').on(t.clientId),
  })
);

// ─── Credential ───────────────────────────────────────────────────────────────

export const credentials = pgTable(
  'Credential',
  {
    id:       text('id').primaryKey().$defaultFn(cuid),
    clientId: text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    type:     text('type').notNull(),
    username: text('username').notNull(),
    password: text('password').notNull(), // stored as base64
    url:      text('url'),
  },
  (t) => ({
    clientIdx: index('Credential_clientId_idx').on(t.clientId),
  })
);

// ─── Task ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  'Task',
  {
    id:          text('id').primaryKey().$defaultFn(cuid),
    clientId:    text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    status:      text('status').default('Pending').notNull(),
    dueDate:     text('dueDate'),
  },
  (t) => ({
    clientIdx: index('Task_clientId_idx').on(t.clientId),
    statusIdx: index('Task_status_idx').on(t.status),
  })
);

// ─── Reminder ─────────────────────────────────────────────────────────────────

export const reminders = pgTable(
  'Reminder',
  {
    id:      text('id').primaryKey().$defaultFn(cuid),
    type:    text('type').notNull(),
    title:   text('title').notNull(),
    date:    text('date').notNull(),
    isRead:  boolean('isRead').default(false).notNull(),
    details: text('details'),
  },
  (t) => ({
    dateIdx: index('Reminder_date_idx').on(t.date),
  })
);

// ─── Payment ──────────────────────────────────────────────────────────────────

export const payments = pgTable(
  'Payment',
  {
    id:            text('id').primaryKey().$defaultFn(cuid),
    clientId:      text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    amount:        real('amount').notNull(),
    status:        text('status').notNull(),
    paymentDate:   text('paymentDate').notNull(),
    description:   text('description'),
    invoiceNumber: text('invoiceNumber'),
    createdAt:     timestamp('createdAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    clientIdx: index('Payment_clientId_idx').on(t.clientId),
    statusIdx: index('Payment_status_idx').on(t.status),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientRelations = relations(clients, ({ many }) => ({
  websites:    many(websites),
  credentials: many(credentials),
  tasks:       many(tasks),
  payments:    many(payments),
}));

export const websiteRelations = relations(websites, ({ one }) => ({
  client: one(clients, { fields: [websites.clientId], references: [clients.id] }),
}));

export const credentialRelations = relations(credentials, ({ one }) => ({
  client: one(clients, { fields: [credentials.clientId], references: [clients.id] }),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ClientRow    = typeof clients.$inferSelect;
export type NewClient    = typeof clients.$inferInsert;
export type WebsiteRow   = typeof websites.$inferSelect;
export type NewWebsite   = typeof websites.$inferInsert;
export type CredRow      = typeof credentials.$inferSelect;
export type NewCred      = typeof credentials.$inferInsert;
export type TaskRow      = typeof tasks.$inferSelect;
export type NewTask      = typeof tasks.$inferInsert;
export type ReminderRow  = typeof reminders.$inferSelect;
export type NewReminder  = typeof reminders.$inferInsert;
export type PaymentRow   = typeof payments.$inferSelect;
export type NewPayment   = typeof payments.$inferInsert;
