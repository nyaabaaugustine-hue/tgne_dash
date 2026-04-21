/**
 * src/instrumentation.ts
 * Next.js Server Instrumentation Hook.
 * Runs ONCE when the server starts — initialises Rollbar for Node.js runtime.
 * Requires `experimental.instrumentationHook: true` in next.config.ts.
 */

export async function register() {
  // Only run in Node.js runtime (not Edge runtime / browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: Rollbar } = await import('rollbar');

    const rollbar = new Rollbar({
      accessToken:                process.env.ROLLBAR_ACCESS_TOKEN,
      captureUncaught:            true,
      captureUnhandledRejections: true,
      environment:                process.env.ROLLBAR_ENVIRONMENT || 'production',
      payload: {
        code_version: '1.0.0',
        server: { root: '/src' },
      },
      scrubFields: ['password', 'secret', 'creditCard', 'authorization', 'cookie', 'token'],
    });

    // Attach to global so API routes can import it
    (global as any).__rollbar = rollbar;

    console.log('[Rollbar] Server-side error tracking initialised ✓');
  }
}
