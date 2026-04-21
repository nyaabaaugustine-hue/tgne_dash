/**
 * src/lib/rollbar-server.ts
 * Lightweight helper to grab the global Rollbar instance that instrumentation.ts
 * registered, and fall back gracefully when it isn't available (e.g. Edge runtime,
 * or when the env var is absent).
 *
 * Usage in any API route:
 *   import { serverRollbar } from '@/lib/rollbar-server';
 *   serverRollbar()?.error(err);
 */

export function serverRollbar(): import('rollbar') | null {
  try {
    return (global as any).__rollbar ?? null;
  } catch {
    return null;
  }
}
