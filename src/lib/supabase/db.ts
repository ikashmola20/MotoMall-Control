import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminUser,
  Brand,
  Category,
  Comparison,
  HeroBanner,
  Order,
  Product,
  ProfileRole,
  Review,
  SiteSettings,
  SpecTemplate,
} from '@/types/admin';
import type {
  AdminDashboardSnapshot,
  TeamRoleMutation,
} from '@/lib/admin-contract';
import { getSupabaseBrowserClient } from './client';
import type { Database } from './types';

function getDb(): SupabaseClient<Database> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}

async function requestAdminRoute<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  return parseJsonResponse<T>(response);
}

function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  fallback: string | null,
): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return fullName || fallback || 'Admin';
}

export async function loadAdminUser(
  userId: string,
  email: string | null,
  displayName: string | null,
  avatarUrl: string | null,
): Promise<AdminUser | null> {
  const db = getDb();
  const { data, error } = await db
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.role !== 'admin' && data.role !== 'employee') {
    return null;
  }

  return {
    id: userId,
    name: getDisplayName(data.first_name, data.last_name, displayName || data.email),
    email: data.email || email || '',
    role: data.role,
    avatar: avatarUrl ?? undefined,
    lastLogin: new Date().toISOString(),
    isActive: true,
  };
}

export async function loadAdminState(): Promise<AdminDashboardSnapshot> {
  return requestAdminRoute<AdminDashboardSnapshot>('/api/admin/state');
}

export async function saveProduct(product: Product): Promise<Product> {
  return requestAdminRoute<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/products', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveCategory(category: Category): Promise<Category> {
  return requestAdminRoute<Category>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export async function deleteCategoryDoc(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/categories', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveBrand(brand: Brand): Promise<Brand> {
  return requestAdminRoute<Brand>('/api/admin/brands', {
    method: 'POST',
    body: JSON.stringify(brand),
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/brands', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveHeroBanner(
  banner: HeroBanner,
): Promise<HeroBanner> {
  return requestAdminRoute<HeroBanner>('/api/admin/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  });
}

export async function deleteHeroBanner(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/banners', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveOrder(order: Order): Promise<Order> {
  return requestAdminRoute<Order>('/api/admin/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function saveReview(review: Review): Promise<Review> {
  return requestAdminRoute<Review>('/api/admin/reviews', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function deleteReviewDoc(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/reviews', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveComparison(
  comparison: Comparison,
): Promise<Comparison> {
  return requestAdminRoute<Comparison>('/api/admin/comparisons', {
    method: 'POST',
    body: JSON.stringify(comparison),
  });
}

export async function deleteComparisonDoc(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/comparisons', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveSpecTemplate(
  template: SpecTemplate,
): Promise<SpecTemplate> {
  return requestAdminRoute<SpecTemplate>('/api/admin/spec-templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
}

export async function deleteSpecTemplateDoc(id: string): Promise<void> {
  await requestAdminRoute<{ ok: true }>('/api/admin/spec-templates', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function saveSettings(
  settings: SiteSettings,
): Promise<SiteSettings> {
  return requestAdminRoute<SiteSettings>('/api/admin/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function updateTeamRole(
  mutation: TeamRoleMutation,
): Promise<AdminUser | null> {
  return requestAdminRoute<AdminUser | null>('/api/admin/team', {
    method: 'POST',
    body: JSON.stringify(mutation),
  });
}

export async function assignTeamRoleByEmail(
  email: string,
  role: Exclude<ProfileRole, 'customer'>,
): Promise<AdminUser | null> {
  return updateTeamRole({ email, role });
}
