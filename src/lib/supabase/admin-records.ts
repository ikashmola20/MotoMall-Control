import 'server-only';

import type {
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
import type { Database } from './types';
import { getSupabaseAdminClient } from './admin';
import {
  buildSearchText,
  ensureNoError,
  mapTeamProfileRow,
  normalizeProductSpecs,
  toJson,
} from './admin-shared';

type Tables = Database['public']['Tables'];
type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

async function resolveBrand(
  admin: AdminClient,
  product: Product,
): Promise<{ id: string | null; name: string | null }> {
  if (product.brandId) {
    const result = await admin
      .from('brands')
      .select('id, name')
      .eq('id', product.brandId)
      .maybeSingle();

    if (result.data) {
      return {
        id: result.data.id,
        name: result.data.name,
      };
    }
  }

  const name = product.brandName.trim();
  if (!name) {
    return { id: null, name: null };
  }

  const byName = await admin
    .from('brands')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();

  return {
    id: byName.data?.id ?? null,
    name: byName.data?.name ?? name,
  };
}

async function resolveCategory(
  admin: AdminClient,
  product: Product,
): Promise<{ id: string | null; name: string | null }> {
  if (!product.categoryId) {
    return { id: null, name: product.categoryName.trim() || null };
  }

  const result = await admin
    .from('categories')
    .select('id, name')
    .eq('id', product.categoryId)
    .maybeSingle();

  return {
    id: result.data?.id ?? product.categoryId,
    name: result.data?.name ?? (product.categoryName.trim() || null),
  };
}

export async function toProductRecord(
  admin: AdminClient,
  product: Product,
): Promise<Tables['products']['Insert']> {
  const now = new Date().toISOString();
  const [brand, category] = await Promise.all([
    resolveBrand(admin, product),
    resolveCategory(admin, product),
  ]);
  const specs = normalizeProductSpecs(product);

  return {
    id: product.id,
    name: product.name,
    name_en: product.nameEn ?? null,
    slug: product.slug?.trim() || product.id,
    brand_id: brand.id,
    brand_name: brand.name,
    category_id: category.id,
    category_name: category.name,
    price: product.price,
    original_price: product.originalPrice ?? null,
    discount: product.discount ?? null,
    image: product.image,
    images: toJson(product.images ?? []),
    description: product.description ?? null,
    rating: product.rating ?? 0,
    review_count: product.reviewCount ?? 0,
    spec_template_id: product.specTemplateId ?? null,
    specs: specs ? toJson(specs) : null,
    in_stock: product.inStock ?? true,
    is_new: Boolean(product.isNew),
    is_best_seller: Boolean(product.isBestSeller),
    search_text: buildSearchText(product),
    created_at: product.createdAt || now,
    updated_at: product.updatedAt || now,
  };
}

export async function toCategoryRecord(
  admin: AdminClient,
  category: Category,
): Promise<Tables['categories']['Insert']> {
  const existing = category.id
    ? await admin
        .from('categories')
        .select('sort_order')
        .eq('id', category.id)
        .maybeSingle()
    : { data: null };

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? null,
    image: category.image ?? null,
    product_count: category.productCount ?? 0,
    subcategories: toJson(category.subcategories ?? []),
    is_active: category.isActive ?? true,
    sort_order: category.sortOrder ?? existing.data?.sort_order ?? 0,
  };
}

export function toBrandRecord(brand: Brand): Tables['brands']['Insert'] {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo ?? null,
    country: brand.country ?? null,
    is_active: brand.isActive ?? true,
    sort_order: brand.sortOrder ?? 0,
  };
}

export function toHeroBannerRecord(
  banner: HeroBanner,
): Tables['hero_banners']['Insert'] {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    button_text: banner.buttonText,
    button_href: banner.buttonHref,
    image: banner.image ?? null,
    gradient: banner.gradient ?? null,
    icon: banner.icon ?? null,
    size: banner.size,
    sort_order: banner.sortOrder ?? 0,
    is_active: banner.isActive ?? true,
  };
}

export function toComparisonRecord(
  comparison: Comparison,
): Tables['admin_comparisons']['Insert'] {
  return {
    id: comparison.id,
    title: comparison.title,
    slug: comparison.slug ?? null,
    product_ids: comparison.productIds ?? [],
    is_featured: comparison.isFeatured ?? false,
    created_at: comparison.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function toSpecTemplateRecord(
  template: SpecTemplate,
): Tables['admin_spec_templates']['Insert'] {
  const now = new Date().toISOString();

  return {
    id: template.id,
    name: template.name,
    icon: template.icon ?? '📄',
    category_id: template.categoryId ?? null,
    fields: toJson(template.fields ?? []),
    created_at: template.createdAt || now,
    updated_at: template.updatedAt || now,
  };
}

export function toReviewRecord(review: Review): Tables['admin_reviews']['Insert'] {
  const now = new Date().toISOString();

  return {
    id: review.id,
    product_id: review.productId,
    product_name: review.productName || null,
    customer_id: review.customerId || null,
    customer_name: review.customerName || null,
    user_id: review.userId ?? null,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    created_at: review.createdAt || now,
    updated_at: review.updatedAt || now,
  };
}

export function toSiteSettingsRecord(
  settings: SiteSettings,
): Tables['site_settings']['Insert'] {
  return {
    id: 'singleton',
    store_name: settings.storeName,
    store_description: settings.storeDescription,
    store_logo: settings.storeLogo ?? null,
    store_phone: settings.storePhone ?? null,
    store_email: settings.storeEmail ?? null,
    store_address: settings.storeAddress ?? null,
    currency: settings.currency ?? null,
    shipping_provinces: toJson(settings.shippingProvinces ?? []),
    payment_methods: toJson(settings.paymentMethods ?? []),
    return_policy: settings.returnPolicy ?? null,
    terms_conditions: settings.termsConditions ?? null,
    privacy_policy: settings.privacyPolicy ?? null,
    seo_title: settings.seoTitle ?? null,
    seo_description: settings.seoDescription ?? null,
    seo_keywords: settings.seoKeywords ?? null,
    social_links: toJson(settings.socialLinks ?? []),
    trust_features: toJson(settings.trustFeatures ?? []),
    footer_copyright: settings.footerCopyright ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function ensureCustomerExists(
  admin: AdminClient,
  order: Order,
): Promise<void> {
  const now = new Date().toISOString();
  const customerResult = await admin
    .from('admin_customers')
    .select('*')
    .eq('id', order.customerId)
    .maybeSingle();

  const existing = customerResult.data;
  const createdAt = existing?.created_at ?? now;
  const lastOrderAt =
    existing?.last_order_at ??
    order.placedAt ??
    order.createdAt ??
    now;

  const upsertRecord: Tables['admin_customers']['Insert'] = {
    id: order.customerId,
    display_name: order.customerName,
    email: order.customerEmail ?? existing?.email ?? null,
    phone: order.customerPhone || existing?.phone || null,
    address: order.shippingAddress || existing?.address || null,
    orders_count: existing?.orders_count ?? 0,
    total_spent: existing?.total_spent ?? 0,
    is_active: existing?.is_active ?? true,
    last_order_at: lastOrderAt,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from('admin_customers')
    .upsert(upsertRecord, { onConflict: 'id' });

  ensureNoError(error, 'Failed to ensure customer record.');
}

export async function toOrderRecord(
  admin: AdminClient,
  order: Order,
): Promise<Tables['admin_orders']['Insert']> {
  await ensureCustomerExists(admin, order);

  const now = new Date().toISOString();

  return {
    id: order.id,
    customer_id: order.customerId,
    user_id: order.userId ?? null,
    order_number: order.orderNumber,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail ?? null,
    shipping_address: order.shippingAddress,
    payment_method: order.paymentMethod,
    payment_label: order.paymentLabel ?? null,
    subtotal: order.subtotal ?? null,
    shipping_cost: order.shippingCost ?? null,
    total_amount: order.totalAmount,
    status: order.status,
    tracking_code: order.trackingCode ?? null,
    items: toJson(order.items ?? []),
    timeline: toJson(order.timeline ?? []),
    placed_at: order.placedAt || order.createdAt || now,
    created_at: order.createdAt || now,
    updated_at: order.updatedAt || now,
  };
}

export async function mirrorUserOrder(
  admin: AdminClient,
  order: Order,
): Promise<void> {
  if (!order.userId) {
    return;
  }

  const record: Tables['user_orders']['Insert'] = {
    id: order.id,
    user_id: order.userId,
    order_number: order.orderNumber,
    status: order.status,
    placed_at: order.placedAt || order.createdAt || new Date().toISOString(),
    subtotal: order.subtotal ?? null,
    shipping_cost: order.shippingCost ?? null,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_label: order.paymentLabel ?? null,
    shipping_address: order.shippingAddress,
    tracking_code: order.trackingCode ?? null,
    items: toJson(order.items ?? []),
    timeline: toJson(order.timeline ?? []),
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: order.updatedAt || new Date().toISOString(),
  };

  const { error } = await admin
    .from('user_orders')
    .upsert(record, { onConflict: 'id' });

  ensureNoError(error, 'Failed to mirror customer order.');
}

export async function syncProductReviewSummary(
  admin: AdminClient,
  productId: string,
): Promise<void> {
  const result = await admin
    .from('admin_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved');

  ensureNoError(result.error, 'Failed to load approved reviews.');

  const ratings = (result.data ?? []).map((row: { rating: number }) => row.rating);
  const reviewCount = ratings.length;
  const rating =
    reviewCount === 0
      ? 0
      : Math.round(
          (ratings.reduce((sum: number, value: number) => sum + value, 0) /
            reviewCount) *
            100,
        ) / 100;

  const { error } = await admin
    .from('products')
    .update({
      review_count: reviewCount,
      rating,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  ensureNoError(error, 'Failed to sync product review summary.');
}

export async function ensureAdminStillExists(
  admin: AdminClient,
  actorId: string,
  targetUserId: string,
  nextRole: ProfileRole,
): Promise<void> {
  if (actorId === targetUserId && nextRole !== 'admin') {
    throw new Error('You cannot remove your own admin access.');
  }

  const target = await admin
    .from('profiles')
    .select('role')
    .eq('id', targetUserId)
    .maybeSingle();

  ensureNoError(target.error, 'Failed to load team member.');

  if (target.data?.role !== 'admin' || nextRole === 'admin') {
    return;
  }

  const admins = await admin.from('profiles').select('id').eq('role', 'admin');
  ensureNoError(admins.error, 'Failed to verify admin count.');

  if ((admins.data ?? []).length <= 1) {
    throw new Error('At least one admin account must remain.');
  }
}

export async function getProfileByEmail(
  admin: AdminClient,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const result = await admin
    .from('profiles')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  ensureNoError(result.error, 'Failed to load profile.');
  return result.data ?? null;
}

export function toTeamMember(
  profile: Tables['profiles']['Row'],
) {
  return mapTeamProfileRow(profile);
}
