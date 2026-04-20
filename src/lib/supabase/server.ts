import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { hasSupabaseClientConfig, supabaseClientConfig } from './config';
import type { Database } from './types';

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function getSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!hasSupabaseClientConfig) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseClientConfig.url!,
    supabaseClientConfig.anonKey!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            try {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            } catch {
              // Server Components may expose a read-only cookie store.
            }
          }
        },
      },
    },
  );
}

export function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient<Database> | null {
  if (!hasSupabaseClientConfig) {
    return null;
  }

  return createServerClient<Database>(
    supabaseClientConfig.url!,
    supabaseClientConfig.anonKey!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    },
  );
}
