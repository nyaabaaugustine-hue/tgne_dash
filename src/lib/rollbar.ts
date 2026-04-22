/**
 * src/lib/rollbar.ts
 * No-op stub so routes that import { rollbar } from '@/lib/rollbar' compile cleanly.
 * Since we're skipping Rollbar for now, all methods silently do nothing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const noop = (..._args: any[]) => {};

export const rollbar = {
  error:    noop,
  warn:     noop,
  info:     noop,
  log:      noop,
  debug:    noop,
  critical: noop,
};
