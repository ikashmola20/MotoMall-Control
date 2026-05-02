import 'server-only';

import type {
  AdminUser,
  Category,
  Customer,
  HeroBanner,
  Order,
  Product,
  Review,
  SiteSettings,
  SpecTemplate,
  VehicleType,
} from '@/types/admin';
import { defaultSettings } from '@/data/mock-admin';
import type { Database, Json } from './types';

type Tables = Database['public']['Tables'];

const PLACEHOLDER_MEDIA = {
  product: '/placeholders/product.svg',
  category: '/placeholders/category.svg',
  brand: '/placeholders/brand.svg',
  generic: '/placeholders/generic.svg',
} as const;

function isLegacyLocalMediaPath(value: string): boolean {
  return value.startsWith('/images/') || value.startsWith('/products/');
}

function normalizeMediaUrl(
  value: string | null | undefined,
  fallback?: string,
): string | undefined {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (isLegacyLocalMediaPath(trimmed)) {
    return fallback;
  }

  return trimmed;
}

function normalizeMediaList(
  value: Json | null | undefined,
  fallbackItem?: string,
): string[] | undefined {
  const normalized = asArray<string>(value)
    .map((item) => normalizeMediaUrl(item))
    .filter((item): item is string => Boolean(item));

  if (normalized.length > 0) {
    return normalized;
  }

  return fallbackItem ? [fallbackItem] : undefined;
}

export function ensureNoError(
  error: { message?: string | null } | null,
  fallback: string,
): void {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

export function asArray<T>(value: Json | null | undefined): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asObject<T extends Record<string, unknown>>(
  value: Json | null | undefined,
): T | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }

  return undefined;
}

export function toJson<T>(value: T): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function toIso(value?: string | null): string {
  return typeof value === 'string' && value ? value : new Date().toISOString();
}

export function buildSearchText(product: Product): string {
  return [
    product.name,
    product.nameEn,
    product.brandName,
    product.categoryName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();
}

export function readVehicleTypeFromSpecs(
  specs: Record<string, unknown> | undefined,
): VehicleType | undefined {
  const vehicleType = specs?.vehicleType;
  return vehicleType === 'fuel' || vehicleType === 'electric'
    ? vehicleType
    : undefined;
}

export function normalizeProductSpecs(
  product: Product,
): Record<string, unknown> | undefined {
  const baseSpecs = { ...(product.specs ?? {}) };
  const vehicleType = product.vehicleType ?? readVehicleTypeFromSpecs(baseSpecs);

  if (vehicleType) {
    baseSpecs.vehicleType = vehicleType;
  }

  return Object.keys(baseSpecs).length > 0 ? baseSpecs : undefined;
}

export function mapProductRow(row: Tables['products']['Row']): Product {
  const specs = asObject<Record<string, unknown>>(row.specs);
  const vehicleType = readVehicleTypeFromSpecs(specs);
  const image =
    normalizeMediaUrl(row.image, PLACEHOLDER_MEDIA.product) ??
    PLACEHOLDER_MEDIA.product;
  const images = normalizeMediaList(row.images);

  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    slug: row.slug,
    brandId: row.brand_id ?? '',
    brandName: row.brand_name ?? '',
    categoryId: row.category_id ?? '',
    categoryName: row.category_name ?? '',
    vehicleType,
    price: coerceNumber(row.price),
    originalPrice:
      row.original_price === null ? undefined : coerceNumber(row.original_price),
    discount: row.discount ?? undefined,
    image,
    images,
    description: row.description ?? undefined,
    specTemplateId: row.spec_template_id ?? undefined,
    specs: specs as Record<string, string | number | boolean> | undefined,
    rating: coerceNumber(row.rating),
    reviewCount: row.review_count ?? 0,
    inStock: row.in_stock,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapCategoryRow(row: Tables['categories']['Row']): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: normalizeMediaUrl(row.image, PLACEHOLDER_MEDIA.category),
    icon: row.icon ?? undefined,
    subcategories: asArray<NonNullable<Category['subcategories']>[number]>(
      row.subcategories,
    ),
    productCount: row.product_count ?? 0,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export function mapBrandRow(row: Tables['brands']['Row']) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: normalizeMediaUrl(row.logo, PLACEHOLDER_MEDIA.brand),
    country: row.country ?? undefined,
    isActive: row.is_active,
    sortOrder: row.sort_order ?? 0,
  };
}

export function mapHeroBannerRow(row: Tables['hero_banners']['Row']): HeroBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    buttonHref: row.button_href,
    image: normalizeMediaUrl(row.image, PLACEHOLDER_MEDIA.generic),
    gradient: row.gradient ?? undefined,
    icon: row.icon ?? undefined,
    size: row.size === 'small' ? 'small' : 'large',
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active,
  };
}

export function mapOrderRow(row: Tables['admin_orders']['Row']): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    userId: row.user_id ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? undefined,
    items: asArray<Order['items'][number]>(row.items),
    subtotal: row.subtotal === null ? undefined : coerceNumber(row.subtotal),
    shippingCost:
      row.shipping_cost === null ? undefined : coerceNumber(row.shipping_cost),
    totalAmount: coerceNumber(row.total_amount),
    status: (row.status as Order['status']) || 'processing',
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'cod',
    paymentLabel: row.payment_label ?? undefined,
    shippingAddress: row.shipping_address,
    trackingCode: row.tracking_code ?? undefined,
    timeline: asArray<NonNullable<Order['timeline']>[number]>(row.timeline),
    placedAt: toIso(row.placed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapCustomerRow(row: Tables['admin_customers']['Row']): Customer {
  return {
    id: row.id,
    name: row.display_name,
    displayName: row.display_name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    address: row.address ?? undefined,
    ordersCount: row.orders_count ?? 0,
    totalSpent: coerceNumber(row.total_spent),
    createdAt: toIso(row.created_at),
    isActive: row.is_active,
    lastOrderAt: row.last_order_at ?? undefined,
    updatedAt: toIso(row.updated_at),
  };
}

export function mapReviewRow(row: Tables['admin_reviews']['Row']): Review {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name ?? '',
    customerId: row.customer_id ?? '',
    userId: row.user_id ?? undefined,
    customerName: row.customer_name ?? '',
    rating: row.rating,
    comment: row.comment,
    status: (row.status as Review['status']) || 'pending',
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapComparisonRow(row: Tables['admin_comparisons']['Row']) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug ?? undefined,
    productIds: row.product_ids ?? [],
    createdAt: toIso(row.created_at),
    isFeatured: row.is_featured,
  };
}

export function mapSpecTemplateRow(
  row: Tables['admin_spec_templates']['Row'],
): SpecTemplate {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '📄',
    categoryId: row.category_id ?? undefined,
    fields: asArray<SpecTemplate['fields'][number]>(row.fields),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapSiteSettingsRow(row: Tables['site_settings']['Row']): SiteSettings {
  return {
    ...defaultSettings,
    storeName: row.store_name ?? defaultSettings.storeName,
    storeDescription:
      row.store_description ?? defaultSettings.storeDescription,
    storeLogo: normalizeMediaUrl(row.store_logo, PLACEHOLDER_MEDIA.brand),
    storePhone: row.store_phone ?? undefined,
    storeEmail: row.store_email ?? undefined,
    storeAddress: row.store_address ?? undefined,
    shippingProvinces: asArray<SiteSettings['shippingProvinces'][number]>(
      row.shipping_provinces,
    ),
    paymentMethods: asArray<SiteSettings['paymentMethods'][number]>(
      row.payment_methods,
    ),
    currency: row.currency ?? defaultSettings.currency,
    returnPolicy: row.return_policy ?? defaultSettings.returnPolicy,
    termsConditions:
      row.terms_conditions ?? defaultSettings.termsConditions,
    privacyPolicy: row.privacy_policy ?? defaultSettings.privacyPolicy,
    seoTitle: row.seo_title ?? defaultSettings.seoTitle,
    seoDescription:
      row.seo_description ?? defaultSettings.seoDescription,
    seoKeywords: row.seo_keywords ?? defaultSettings.seoKeywords,
    socialLinks:
      asArray<SiteSettings['socialLinks'][number]>(row.social_links).length > 0
        ? asArray<SiteSettings['socialLinks'][number]>(row.social_links)
        : defaultSettings.socialLinks,
    trustFeatures:
      asArray<SiteSettings['trustFeatures'][number]>(row.trust_features)
        .length > 0
        ? asArray<SiteSettings['trustFeatures'][number]>(row.trust_features)
        : defaultSettings.trustFeatures,
    footerCopyright:
      row.footer_copyright ?? defaultSettings.footerCopyright,
  };
}

function buildAdminName(row: Tables['profiles']['Row']): string {
  const fullName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  return fullName || row.email || 'MotoMall Team';
}

export function mapTeamProfileRow(row: Tables['profiles']['Row']): AdminUser {
  return {
    id: row.id,
    name: buildAdminName(row),
    email: row.email ?? '',
    role: row.role === 'admin' ? 'admin' : 'employee',
    lastLogin: toIso(row.updated_at || row.created_at),
    isActive: true,
  };
}
