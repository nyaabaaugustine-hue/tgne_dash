/**
 * src/components/providers/query-provider.tsx
 * TanStack Query provider — wraps the app with a shared QueryClient.
 * Must be a client component.
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
