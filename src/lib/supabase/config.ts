function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '<REPLACE_ME>') {
    return undefined;
  }

  return trimmed;
}

const anonKey =
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
  clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const supabaseClientConfig = {
  url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey,
};

export const hasSupabaseClientConfig = Boolean(
  supabaseClientConfig.url && supabaseClientConfig.anonKey,
);

export const supabaseAdminConfig = {
  url: supabaseClientConfig.url,
  serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
};

export const hasSupabaseAdminConfig = Boolean(
  supabaseAdminConfig.url && supabaseAdminConfig.serviceRoleKey,
);
