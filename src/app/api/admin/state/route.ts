import { NextResponse } from 'next/server';
import { authorizeAdminRequest, AdminAccessError } from '@/lib/supabase/admin-auth';
import { loadAdminDashboardSnapshot } from '@/lib/supabase/admin-repository';

function toErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Failed to load admin state.';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const context = await authorizeAdminRequest();
    const snapshot = await loadAdminDashboardSnapshot(context.role);
    return NextResponse.json(snapshot);
  } catch (error) {
    return toErrorResponse(error);
  }
}
