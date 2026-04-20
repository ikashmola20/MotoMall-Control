'use client';

import { AdminProvider } from '@/lib/admin-store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
