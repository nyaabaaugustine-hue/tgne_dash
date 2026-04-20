# Drizzle + Neon Migration — Setup Guide

## What Changed

| Before | After |
|---|---|
| `@prisma/client` + `prisma` | `drizzle-orm` + `drizzle-kit` |
| `src/lib/prisma.ts` | `src/db/index.ts` |
| `schema.prisma` | `src/db/schema.ts` |
| Raw fetch in store | **TanStack Query** cache + invalidation |
| No request validation | **Zod** schemas on every route |
| Sequential DB queries | **Parallel** `Promise.all` in `/api/data` |

---

## Step 1 — Install new packages

```bash
npm install
```

This installs:
- `drizzle-orm` — type-safe query builder
- `@neondatabase/serverless` — Neon HTTP driver (no TCP sockets)
- `@paralleldrive/cuid2` — cuid ID generation (same format as Prisma)
- `@tanstack/react-query` — frontend data caching

---

## Step 2 — Verify your .env files

Both `.env` and `.env.local` already have the correct variables.
No changes needed — Drizzle reads the same `DATABASE_URL`.

```env
DATABASE_URL="postgresql://...pooler...?sslmode=require"
DIRECT_URL="postgresql://...?sslmode=require"
```

`DATABASE_URL` → used by the app at runtime (HTTP driver, pooler URL is fine)
`DIRECT_URL`   → used by `drizzle-kit` CLI for migrations (bypasses PgBouncer)

---

## Step 3 — Start the dev server

```bash
npm run dev
```

Your existing Neon data is **fully intact** — Drizzle connects to the same
tables that Prisma created. No migration or data loss occurs.

---

## Drizzle Kit Commands (optional)

```bash
# Inspect current DB schema into Drizzle format
npm run db:introspect

# Push schema changes to DB (dev only)
npm run db:push

# Generate SQL migration files
npm run db:generate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

---

## New File Map

```
src/
├── db/
│   ├── index.ts          ← Neon HTTP connection + Drizzle instance
│   └── schema.ts         ← All 6 tables (Client, Website, Credential, Task, Reminder, Payment)
├── lib/
│   ├── validations.ts    ← Zod schemas for all API routes
│   ├── query-client.ts   ← TanStack Query singleton + query key factory
│   └── store.tsx         ← Updated: useQuery + invalidateQueries (no more refreshData)
├── components/
│   └── providers/
│       └── query-provider.tsx  ← QueryClientProvider wrapper
└── app/
    ├── layout.tsx         ← Updated: wraps app in QueryProvider
    └── api/
        ├── data/route.ts        ← Parallel fetch with Drizzle
        ├── clients/route.ts     ← POST/PUT/DELETE + Zod
        ├── websites/route.ts    ← POST/PUT/DELETE + Zod
        ├── credentials/route.ts ← POST/DELETE + Zod
        ├── tasks/route.ts       ← POST/PUT/DELETE + Zod
        ├── reminders/route.ts   ← POST/PUT/DELETE + Zod
        └── payments/route.ts    ← POST/PUT/DELETE + Zod

drizzle.config.ts   ← Drizzle Kit CLI config
```

---

## Architecture

```
Browser (React)
    │
    ▼
TanStack Query (cache + invalidation)
    │
    ▼
AppProvider / store.tsx (mutations)
    │
    ▼
Next.js API Routes (/api/*)
    │   ← Zod validation layer
    ▼
Drizzle ORM (type-safe queries)
    │
    ▼
@neondatabase/serverless (HTTP transport)
    │
    ▼
Neon PostgreSQL (existing tables, unchanged)
```

No Firebase. No Prisma. No TCP connection exhaustion. No raw localStorage.
