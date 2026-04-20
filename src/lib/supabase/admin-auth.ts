import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AdminRole } from '@/types/admin';
import { getSupabaseAdminClient } from './admin';
import { hasSupabaseAdminConfig } from './config';
import { getSupabaseServerClient } from './server';
import type { Database } from './types';

export class AdminAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminAccessError';
    this.status = status;
  }
}

export interface AuthorizedAdminContext {
  admin: SupabaseClient<Database>;
  user: User;
  profile: Database['public']['Tables']['profiles']['Row'];
  role: AdminRole;
}

function asAdminRole(role: string | null | undefined): AdminRole | null {
  if (role === 'admin' || role === 'employee') {
    return role;
  }

  return null;
}

function missingRoleColumn(error: { message?: string | null } | null): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('role') && message.includes('profiles');
}

export async function authorizeAdminRequest(options?: {
  adminOnly?: boolean;
}): Promise<AuthorizedAdminContext> {
  if (!hasSupabaseAdminConfig) {
    throw new AdminAccessError(503, 'Supabase admin is not configured.');
  }

  const authClient = await getSupabaseServerClient();
  if (!authClient) {
    throw new AdminAccessError(503, 'Supabase is not configured.');
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    throw new AdminAccessError(401, 'unauthorized');
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new AdminAccessError(503, 'Supabase admin is not configured.');
  }

  const profileResult = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (missingRoleColumn(profileResult.error)) {
    throw new AdminAccessError(
      500,
      'profiles.role is missing. Apply the shared Supabase role migration first.',
    );
  }

  if (profileResult.error || !profileResult.data) {
    throw new AdminAccessError(403, 'forbidden');
  }

  const role = asAdminRole(profileResult.data.role);
  if (!role) {
    throw new AdminAccessError(403, 'forbidden');
  }

  if (options?.adminOnly && role !== 'admin') {
    throw new AdminAccessError(403, 'forbidden');
  }

  return {
    admin,
    user,
    profile: profileResult.data,
    role,
  };
}
