'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseClientConfig, supabaseClientConfig } from './config';
import type { Database } from './types';

let browserClient: SupabaseClient<Database> | null = null;

function getSupabaseStorageKeys(): string[] {
  if (!supabaseClientConfig.url) {
    return [];
  }

  try {
    const projectRef = new URL(supabaseClientConfig.url).hostname.split('.')[0];
    return [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
    ];
  } catch {
    return [];
  }
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!hasSupabaseClientConfig) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      supabaseClientConfig.url!,
      supabaseClientConfig.anonKey!,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }

  return browserClient;
}

export async function clearSupabaseBrowserSession(): Promise<void> {
  const client = getSupabaseBrowserClient();

  if (client) {
    try {
      await client.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore sign-out failures when the refresh token is already invalid.
    }
  }

  if (typeof window === 'undefined') {
    return;
  }

  for (const key of getSupabaseStorageKeys()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures in the browser.
    }
  }
}
