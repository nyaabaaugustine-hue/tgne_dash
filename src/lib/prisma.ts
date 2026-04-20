/**
 * src/lib/prisma.ts — DEPRECATED
 *
 * Prisma has been replaced with Drizzle ORM + Neon Serverless Driver.
 *
 * New database layer:
 *   Connection : src/db/index.ts   → import { db } from '@/db'
 *   Schema     : src/db/schema.ts  → import { clients, ... } from '@/db/schema'
 *   Config     : drizzle.config.ts
 *
 * This file is kept to avoid import errors during transition.
 * Safe to delete once all imports of '@/lib/prisma' are removed.
 */

export {};
