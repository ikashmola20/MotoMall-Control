import 'server-only';

import type {
  AdminRole,
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
import type { AdminDashboardSnapshot } from '@/lib/admin-contract';
import { getSupabaseAdminClient } from './admin';
import {
  ensureAdminStillExists,
  getProfileByEmail,
  mirrorUserOrder,
  syncProductReviewSummary,
  toBrandRecord,
  toCategoryRecord,
  toComparisonRecord,
  toHeroBannerRecord,
  toOrderRecord,
  toProductRecord,
  toReviewRecord,
  toSiteSettingsRecord,
  toSpecTemplateRecord,
  toTeamMember,
} from './admin-records';
import {
  ensureNoError,
  mapBrandRow,
  mapCategoryRow,
  mapComparisonRow,
  mapCustomerRow,
  mapHeroBannerRow,
  mapOrderRow,
  mapProductRow,
  mapReviewRow,
  mapSiteSettingsRow,
  mapSpecTemplateRow,
} from './admin-shared';
import { deleteUploadedImageByUrl } from './storage';
import { defaultSettings } from '@/data/mock-admin';

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function getAdmin(): AdminClient {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error('Supabase admin is not configured.');
  }

  return admin;
}

function requireData<T>(data: T | null, fallback: string): T {
  if (data === null) {
    throw new Error(fallback);
  }

  return data;
}

function collectUploadedImageUrls(input: {
  image?: string | null;
  images?: unknown;
} | null | undefined): string[] {
  const urls = new Set<string>();

  if (typeof input?.image === 'string' && input.image.trim()) {
    urls.add(input.image);
  }

  if (Array.isArray(input?.images)) {
    for (const image of input.images) {
      if (typeof image === 'string' && image.trim()) {
        urls.add(image);
      }
    }
  }

  return [...urls];
}

async function deleteUploadedImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteUploadedImageByUrl(url)));
}

function isMissingBrandSortOrderError(
  error: { message?: string | null } | null,
): boolean {
  return Boolean(error?.message?.includes('sort_order'));
}

export async function loadAdminDashboardSnapshot(
  role: AdminRole,
): Promise<AdminDashboardSnapshot> {
  const admin = getAdmin();

  const [
    productsResult,
    categoriesResult,
    brandsResult,
    ordersResult,
    customersResult,
    reviewsResult,
    comparisonsResult,
    specTemplatesResult,
    settingsResult,
    bannersResult,
    teamResult,
  ] = await Promise.all([
    admin.from('products').select('*').order('created_at', { ascending: false }),
    admin.from('categories').select('*').order('sort_order', { ascending: true }),
    admin.from('brands').select('*').order('name', { ascending: true }),
    admin.from('admin_orders').select('*').order('placed_at', { ascending: false }),
    admin.from('admin_customers').select('*').order('created_at', { ascending: false }),
    admin.from('admin_reviews').select('*').order('created_at', { ascending: false }),
    admin.from('admin_comparisons').select('*').order('created_at', { ascending: false }),
    admin.from('admin_spec_templates').select('*').order('updated_at', { ascending: false }),
    admin.from('site_settings').select('*').eq('id', 'singleton').maybeSingle(),
    admin.from('hero_banners').select('*').order('sort_order', { ascending: true }),
    role === 'admin'
      ? admin
          .from('profiles')
          .select('*')
          .in('role', ['admin', 'employee'])
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  ensureNoError(productsResult.error, 'Failed to load products.');
  ensureNoError(categoriesResult.error, 'Failed to load categories.');
  ensureNoError(brandsResult.error, 'Failed to load brands.');
  ensureNoError(ordersResult.error, 'Failed to load orders.');
  ensureNoError(customersResult.error, 'Failed to load customers.');
  ensureNoError(reviewsResult.error, 'Failed to load reviews.');
  ensureNoError(comparisonsResult.error, 'Failed to load comparisons.');
  ensureNoError(specTemplatesResult.error, 'Failed to load spec templates.');
  ensureNoError(settingsResult.error, 'Failed to load settings.');
  ensureNoError(bannersResult.error, 'Failed to load hero banners.');
  ensureNoError(teamResult.error, 'Failed to load team members.');

  return {
    products: (productsResult.data ?? []).map(mapProductRow),
    categories: (categoriesResult.data ?? []).map(mapCategoryRow),
    brands: (brandsResult.data ?? [])
      .map(mapBrandRow)
      .sort(
        (left, right) =>
          (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
          left.name.localeCompare(right.name),
      ),
    orders: (ordersResult.data ?? []).map(mapOrderRow),
    customers: (customersResult.data ?? []).map(mapCustomerRow),
    reviews: (reviewsResult.data ?? []).map(mapReviewRow),
    comparisons: (comparisonsResult.data ?? []).map(mapComparisonRow),
    specTemplates: (specTemplatesResult.data ?? []).map(mapSpecTemplateRow),
    settings: settingsResult.data
      ? mapSiteSettingsRow(settingsResult.data)
      : defaultSettings,
    heroBanners: (bannersResult.data ?? []).map(mapHeroBannerRow),
    teamMembers: (teamResult.data ?? []).map(toTeamMember),
  };
}

export async function saveProductRecord(product: Product): Promise<Product> {
  const admin = getAdmin();
  const existing = await admin
    .from('products')
    .select('image, images')
    .eq('id', product.id)
    .maybeSingle();
  ensureNoError(existing.error, 'Failed to load existing product.');

  const record = await toProductRecord(admin, product);
  const result = await admin
    .from('products')
    .upsert(record, { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save product.');
  const savedProduct = requireData(result.data, 'Failed to load saved product.');
  const existingUrls = collectUploadedImageUrls(existing.data);
  const savedUrls = new Set(collectUploadedImageUrls(savedProduct));
  const removedUrls = existingUrls.filter((url) => !savedUrls.has(url));

  await deleteUploadedImages(removedUrls);

  return mapProductRow(savedProduct);
}

export async function deleteProductRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const existing = await admin
    .from('products')
    .select('image, images')
    .eq('id', id)
    .maybeSingle();
  ensureNoError(existing.error, 'Failed to load product.');

  const { error } = await admin.from('products').delete().eq('id', id);
  ensureNoError(error, 'Failed to delete product.');

  await deleteUploadedImages(collectUploadedImageUrls(existing.data));
}

export async function saveCategoryRecord(category: Category): Promise<Category> {
  const admin = getAdmin();
  const record = await toCategoryRecord(admin, category);
  const result = await admin
    .from('categories')
    .upsert(record, { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save category.');
  return mapCategoryRow(requireData(result.data, 'Failed to load saved category.'));
}

export async function deleteCategoryRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin.from('categories').delete().eq('id', id);
  ensureNoError(error, 'Failed to delete category.');
}

export async function saveBrandRecord(brand: Brand): Promise<Brand> {
  const admin = getAdmin();
  const result = await admin
    .from('brands')
    .upsert(toBrandRecord(brand), { onConflict: 'id' })
    .select('*')
    .single();

  if (isMissingBrandSortOrderError(result.error)) {
    throw new Error(
      'ترتيب البراندات يحتاج تفعيل عمود sort_order في Supabase أولاً. افتح SQL Editor ونفّذ ملف supabase/migrations/0003_brand_sort_order.sql ثم حدّث الصفحة.',
    );
  }

  ensureNoError(result.error, 'Failed to save brand.');
  return mapBrandRow(requireData(result.data, 'Failed to load saved brand.'));
}

export async function deleteBrandRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin.from('brands').delete().eq('id', id);
  ensureNoError(error, 'Failed to delete brand.');
}

export async function saveHeroBannerRecord(
  banner: HeroBanner,
): Promise<HeroBanner> {
  const admin = getAdmin();
  const existing = await admin
    .from('hero_banners')
    .select('image')
    .eq('id', banner.id)
    .maybeSingle();
  ensureNoError(existing.error, 'Failed to load existing hero banner.');

  const result = await admin
    .from('hero_banners')
    .upsert(toHeroBannerRecord(banner), { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save hero banner.');
  const savedBanner = requireData(result.data, 'Failed to load saved banner.');

  if (
    existing.data?.image &&
    existing.data.image !== savedBanner.image
  ) {
    await deleteUploadedImageByUrl(existing.data.image);
  }

  return mapHeroBannerRow(savedBanner);
}

export async function deleteHeroBannerRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const existing = await admin
    .from('hero_banners')
    .select('image')
    .eq('id', id)
    .maybeSingle();
  ensureNoError(existing.error, 'Failed to load hero banner.');

  const { error } = await admin.from('hero_banners').delete().eq('id', id);
  ensureNoError(error, 'Failed to delete hero banner.');

  if (existing.data?.image) {
    await deleteUploadedImageByUrl(existing.data.image);
  }
}

export async function saveComparisonRecord(
  comparison: Comparison,
): Promise<Comparison> {
  const admin = getAdmin();
  const result = await admin
    .from('admin_comparisons')
    .upsert(toComparisonRecord(comparison), { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save comparison.');
  return mapComparisonRow(
    requireData(result.data, 'Failed to load saved comparison.'),
  );
}

export async function deleteComparisonRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin
    .from('admin_comparisons')
    .delete()
    .eq('id', id);
  ensureNoError(error, 'Failed to delete comparison.');
}

export async function saveSpecTemplateRecord(
  template: SpecTemplate,
): Promise<SpecTemplate> {
  const admin = getAdmin();
  const result = await admin
    .from('admin_spec_templates')
    .upsert(toSpecTemplateRecord(template), { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save spec template.');
  return mapSpecTemplateRow(
    requireData(result.data, 'Failed to load saved spec template.'),
  );
}

export async function deleteSpecTemplateRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const { error } = await admin
    .from('admin_spec_templates')
    .delete()
    .eq('id', id);
  ensureNoError(error, 'Failed to delete spec template.');
}

export async function saveReviewRecord(review: Review): Promise<Review> {
  const admin = getAdmin();
  const result = await admin
    .from('admin_reviews')
    .upsert(toReviewRecord(review), { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save review.');
  await syncProductReviewSummary(admin, review.productId);
  return mapReviewRow(requireData(result.data, 'Failed to load saved review.'));
}

export async function deleteReviewRecord(id: string): Promise<void> {
  const admin = getAdmin();
  const existing = await admin
    .from('admin_reviews')
    .select('product_id')
    .eq('id', id)
    .maybeSingle();
  ensureNoError(existing.error, 'Failed to load review.');

  const { error } = await admin.from('admin_reviews').delete().eq('id', id);
  ensureNoError(error, 'Failed to delete review.');

  if (existing.data?.product_id) {
    await syncProductReviewSummary(admin, existing.data.product_id);
  }
}

export async function saveSettingsRecord(
  settings: SiteSettings,
): Promise<SiteSettings> {
  const admin = getAdmin();
  const result = await admin
    .from('site_settings')
    .upsert(toSiteSettingsRecord(settings), { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save settings.');
  return mapSiteSettingsRow(
    requireData(result.data, 'Failed to load saved settings.'),
  );
}

export async function saveOrderRecord(order: Order): Promise<Order> {
  const admin = getAdmin();
  const record = await toOrderRecord(admin, order);
  const result = await admin
    .from('admin_orders')
    .upsert(record, { onConflict: 'id' })
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to save order.');

  const savedOrder = mapOrderRow(
    requireData(result.data, 'Failed to load saved order.'),
  );
  await mirrorUserOrder(admin, savedOrder);

  return savedOrder;
}

export async function updateTeamMemberRoleRecord(input: {
  actorUserId: string;
  userId?: string;
  email?: string;
  role: ProfileRole;
}): Promise<AdminUser | null> {
  const admin = getAdmin();
  let targetUserId = input.userId;

  if (!targetUserId && input.email) {
    const profile = await getProfileByEmail(admin, input.email);
    if (!profile) {
      throw new Error('No profile was found for this email.');
    }
    targetUserId = profile.id;
  }

  if (!targetUserId) {
    throw new Error('Team member target is required.');
  }

  await ensureAdminStillExists(admin, input.actorUserId, targetUserId, input.role);

  const result = await admin
    .from('profiles')
    .update({
      role: input.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .select('*')
    .single();

  ensureNoError(result.error, 'Failed to update team role.');

  if (input.role === 'customer') {
    return null;
  }

  return toTeamMember(requireData(result.data, 'Failed to load updated team member.'));
}
