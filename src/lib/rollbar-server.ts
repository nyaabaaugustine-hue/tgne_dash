/**
 * src/lib/rollbar-server.ts
 * Lightweight helper that returns the global Rollbar instance when available,
 * or null when not (Edge runtime, missing env var, etc.).
 *
 * Uses InstanceType<typeof import('rollbar')> so TypeScript gets a proper
 * instance type without treating the module itself as the type.
 */

type RollbarInstance = InstanceType<typeof import('rollbar')>;

export function serverRollbar(): RollbarInstance | null {
  try {
    return ((global as Record<string, unknown>).__rollbar as RollbarInstance) ?? null;
  } catch {
    return null;
  }
}
