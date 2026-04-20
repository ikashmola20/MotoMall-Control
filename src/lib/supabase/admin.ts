import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseAdminConfig, supabaseAdminConfig } from './config';
import type { Database } from './types';

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  if (!hasSupabaseAdminConfig) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient<Database>(
      supabaseAdminConfig.url!,
      supabaseAdminConfig.serviceRoleKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return adminClient;
}
