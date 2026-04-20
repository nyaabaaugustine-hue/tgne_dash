/**
 * src/db/index.ts
 * Neon Serverless + Drizzle ORM connection
 *
 * Uses @neondatabase/serverless HTTP transport — zero TCP sockets,
 * safe for serverless / edge runtimes, never exhausts connection pools.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('[db] DATABASE_URL is not set in environment variables.');
}

// neon() creates a tagged-template SQL executor over HTTP — no persistent socket
const sql = neon(process.env.DATABASE_URL);

// drizzle wraps it with full type-safe query builder + schema inference
export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type DB = typeof db;
