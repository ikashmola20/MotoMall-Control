import 'server-only';

import type {
  AdminRole,
  AdminUser,
  Brand,
  Category,
  Comparison,
  Customer,
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
  CustomerCrmMutation,
} from '@/lib/admin-contract';
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
  mapCustomerInteractionRow,
  mapCustomerNoteRow,
  mapCustomerRow,
  mapCustomerTagRow,
  mapCustomerTaskRow,
  mapHeroBannerRow,
  mapOrderRow,
  mapProductRow,
  mapReviewRow,
  mapSiteSettingsRow,
  mapSpecTemplateRow,
} from './admin-shared';
import { deleteUploadedImageByUrl } from './storage';
import { defaultSettings } from '@/data/mock-admin';
import type { Database } from './types';

type Tables = Database['public']['Tables'];
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

function isMissingCrmSchemaError(
  error: { message?: string | null; code?: string | null } | null,
): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    error?.code === 'PGRST204' ||
    error?.code === 'PGRST205' ||
    message.includes('admin_customer_') ||
    message.includes('crm_status') ||
    message.includes('next_follow_up_at') ||
    message.includes('internal_rating') ||
    message.includes('schema cache') ||
    message.includes('relation') && message.includes('does not exist')
  );
}

function ensureCrmSchema(error: { message?: string | null; code?: string | null } | null): void {
  if (!error) {
    return;
  }

  if (isMissingCrmSchemaError(error)) {
    throw new Error(
      'منظومة CRM تحتاج تفعيل جداولها في Supabase أولاً. افتح SQL Editor ونفّذ ملف supabase/migrations/0004_customer_crm.sql ثم حدّث الصفحة.',
    );
  }

  ensureNoError(error, 'Failed to update customer CRM.');
}

async function optionalCrmRows<T>(
  resultPromise: PromiseLike<{ data: T[] | null; error: { message?: string | null; code?: string | null } | null }>,
): Promise<T[]> {
  const result = await resultPromise;
  if (result.error) {
    if (isMissingCrmSchemaError(result.error)) {
      return [];
    }

    ensureNoError(result.error, 'Failed to load customer CRM data.');
  }

  return result.data ?? [];
}

function buildStaffName(row: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}): string {
  const fullName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  return fullName || row.email || 'MotoMall Admin';
}

function getActorName(actor: { profile: Tables['profiles']['Row']; user: { email?: string | null } }): string {
  return buildStaffName({
    first_name: actor.profile.first_name,
    last_name: actor.profile.last_name,
    email: actor.profile.email ?? actor.user.email ?? null,
  });
}

async function getStaffNameById(
  admin: AdminClient,
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const result = await admin
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .maybeSingle();

  ensureNoError(result.error, 'Failed to load assigned staff profile.');
  return result.data ? buildStaffName(result.data) : null;
}

function groupByCustomer<T extends { customerId: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const list = grouped.get(item.customerId) ?? [];
    list.push(item);
    grouped.set(item.customerId, list);
  }
  return grouped;
}

async function attachCustomerCrmData(
  admin: AdminClient,
  customers: Customer[],
  teamMembers: AdminUser[],
): Promise<Customer[]> {
  if (customers.length === 0) {
    return customers;
  }

  const [noteRows, taskRows, tagRows, tagLinkRows, interactionRows] =
    await Promise.all([
      optionalCrmRows(
        admin
          .from('admin_customer_notes')
          .select('*')
          .order('created_at', { ascending: false }),
      ),
      optionalCrmRows(
        admin
          .from('admin_customer_tasks')
          .select('*')
          .order('due_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
      ),
      optionalCrmRows(
        admin
          .from('admin_customer_tags')
          .select('*')
          .order('name', { ascending: true }),
      ),
      optionalCrmRows(admin.from('admin_customer_tag_links').select('*')),
      optionalCrmRows(
        admin
          .from('admin_customer_interactions')
          .select('*')
          .order('occurred_at', { ascending: false }),
      ),
    ]);

  const notesByCustomer = groupByCustomer(noteRows.map(mapCustomerNoteRow));
  const tasksByCustomer = groupByCustomer(taskRows.map(mapCustomerTaskRow));
  const interactionsByCustomer = groupByCustomer(
    interactionRows.map(mapCustomerInteractionRow),
  );
  const tagsById = new Map(tagRows.map((row) => [row.id, mapCustomerTagRow(row)]));
  const tagIdsByCustomer = new Map<string, string[]>();

  for (const link of tagLinkRows) {
    const list = tagIdsByCustomer.get(link.customer_id) ?? [];
    list.push(link.tag_id);
    tagIdsByCustomer.set(link.customer_id, list);
  }

  const staffNames = new Map(teamMembers.map((member) => [member.id, member.name]));

  return customers.map((customer) => {
    const tagIds = tagIdsByCustomer.get(customer.id) ?? [];
    return {
      ...customer,
      assignedName: customer.assignedTo
        ? staffNames.get(customer.assignedTo) ?? undefined
        : undefined,
      notes: notesByCustomer.get(customer.id) ?? [],
      tasks: tasksByCustomer.get(customer.id) ?? [],
      tags: tagIds
        .map((tagId) => tagsById.get(tagId))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
      interactions: interactionsByCustomer.get(customer.id) ?? [],
    };
  });
}

async function loadCustomerWithCrm(
  admin: AdminClient,
  customerId: string,
): Promise<Customer> {
  const [customerResult, teamResult] = await Promise.all([
    admin.from('admin_customers').select('*').eq('id', customerId).maybeSingle(),
    admin
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'employee']),
  ]);

  ensureNoError(customerResult.error, 'Failed to load customer.');
  ensureNoError(teamResult.error, 'Failed to load team members.');

  if (!customerResult.data) {
    throw new Error('Customer was not found.');
  }

  const [customer] = await attachCustomerCrmData(
    admin,
    [mapCustomerRow(customerResult.data)],
    (teamResult.data ?? []).map(toTeamMember),
  );

  return customer;
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
    admin
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'employee'])
      .order('updated_at', { ascending: false }),
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

  const teamMembers =
    role === 'admin' ? (teamResult.data ?? []).map(toTeamMember) : [];
  const crmTeamMembers = (teamResult.data ?? []).map(toTeamMember);
  const customers = await attachCustomerCrmData(
    admin,
    (customersResult.data ?? []).map(mapCustomerRow),
    crmTeamMembers,
  );

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
    customers,
    reviews: (reviewsResult.data ?? []).map(mapReviewRow),
    comparisons: (comparisonsResult.data ?? []).map(mapComparisonRow),
    specTemplates: (specTemplatesResult.data ?? []).map(mapSpecTemplateRow),
    settings: settingsResult.data
      ? mapSiteSettingsRow(settingsResult.data)
      : defaultSettings,
    heroBanners: (bannersResult.data ?? []).map(mapHeroBannerRow),
    teamMembers,
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

export async function saveCustomerCrmMutationRecord(
  mutation: CustomerCrmMutation,
  actor: {
    user: { id: string; email?: string | null };
    profile: Tables['profiles']['Row'];
    role: AdminRole;
  },
): Promise<Customer> {
  const admin = getAdmin();
  const actorName = getActorName(actor);
  const now = new Date().toISOString();

  try {
    switch (mutation.action) {
      case 'update-customer': {
        const update: Tables['admin_customers']['Update'] = {
          updated_at: now,
        };

        if (mutation.crmStatus) {
          update.crm_status = mutation.crmStatus;
        }
        if ('assignedTo' in mutation) {
          update.assigned_to = mutation.assignedTo || null;
        }
        if ('nextFollowUpAt' in mutation) {
          update.next_follow_up_at = mutation.nextFollowUpAt || null;
        }
        if (typeof mutation.internalRating === 'number') {
          update.internal_rating = Math.max(
            0,
            Math.min(5, Math.round(mutation.internalRating)),
          );
        }
        if (typeof mutation.isActive === 'boolean') {
          update.is_active = mutation.isActive;
        }

        const { error } = await admin
          .from('admin_customers')
          .update(update)
          .eq('id', mutation.customerId);
        ensureCrmSchema(error);
        break;
      }

      case 'add-note': {
        const { error } = await admin.from('admin_customer_notes').insert({
          customer_id: mutation.customerId,
          body: mutation.body.trim(),
          created_by: actor.user.id,
          author_name: actorName,
        });
        ensureCrmSchema(error);
        break;
      }

      case 'delete-note': {
        if (actor.role !== 'admin') {
          throw new Error('حذف الملاحظات متاح للمدير فقط.');
        }

        const { error } = await admin
          .from('admin_customer_notes')
          .delete()
          .eq('id', mutation.noteId)
          .eq('customer_id', mutation.customerId);
        ensureCrmSchema(error);
        break;
      }

      case 'add-task': {
        const assignedName = await getStaffNameById(admin, mutation.assignedTo);
        const { error } = await admin.from('admin_customer_tasks').insert({
          customer_id: mutation.customerId,
          title: mutation.title.trim(),
          description: mutation.description?.trim() || null,
          due_at: mutation.dueAt || null,
          priority: mutation.priority ?? 'medium',
          assigned_to: mutation.assignedTo || null,
          assigned_name: assignedName,
          created_by: actor.user.id,
          created_by_name: actorName,
        });
        ensureCrmSchema(error);
        break;
      }

      case 'update-task': {
        const update: Tables['admin_customer_tasks']['Update'] = {
          updated_at: now,
        };

        if (typeof mutation.title === 'string') {
          update.title = mutation.title.trim();
        }
        if (typeof mutation.description === 'string') {
          update.description = mutation.description.trim() || null;
        }
        if ('dueAt' in mutation) {
          update.due_at = mutation.dueAt || null;
        }
        if (mutation.status) {
          update.status = mutation.status;
          update.completed_at = mutation.status === 'done' ? now : null;
        }
        if (mutation.priority) {
          update.priority = mutation.priority;
        }
        if ('assignedTo' in mutation) {
          update.assigned_to = mutation.assignedTo || null;
          update.assigned_name = await getStaffNameById(admin, mutation.assignedTo);
        }

        const { error } = await admin
          .from('admin_customer_tasks')
          .update(update)
          .eq('id', mutation.taskId)
          .eq('customer_id', mutation.customerId);
        ensureCrmSchema(error);
        break;
      }

      case 'delete-task': {
        if (actor.role !== 'admin') {
          throw new Error('حذف مهام المتابعة متاح للمدير فقط.');
        }

        const { error } = await admin
          .from('admin_customer_tasks')
          .delete()
          .eq('id', mutation.taskId)
          .eq('customer_id', mutation.customerId);
        ensureCrmSchema(error);
        break;
      }

      case 'add-interaction': {
        const occurredAt = mutation.occurredAt || now;
        const { error } = await admin.from('admin_customer_interactions').insert({
          customer_id: mutation.customerId,
          type: mutation.type,
          summary: mutation.summary.trim(),
          occurred_at: occurredAt,
          created_by: actor.user.id,
          created_by_name: actorName,
        });
        ensureCrmSchema(error);

        const update = await admin
          .from('admin_customers')
          .update({
            last_contact_at: occurredAt,
            updated_at: now,
          })
          .eq('id', mutation.customerId);
        ensureCrmSchema(update.error);
        break;
      }

      case 'delete-interaction': {
        if (actor.role !== 'admin') {
          throw new Error('حذف سجل التواصل متاح للمدير فقط.');
        }

        const { error } = await admin
          .from('admin_customer_interactions')
          .delete()
          .eq('id', mutation.interactionId)
          .eq('customer_id', mutation.customerId);
        ensureCrmSchema(error);
        break;
      }

      case 'add-tag': {
        const tagName = mutation.name.trim();
        if (!tagName) {
          throw new Error('اسم الوسم مطلوب.');
        }

        const tagResult = await admin
          .from('admin_customer_tags')
          .upsert(
            {
              name: tagName,
              color: mutation.color || '#3b82f6',
              created_by: actor.user.id,
            },
            { onConflict: 'name' },
          )
          .select('*')
          .single();
        ensureCrmSchema(tagResult.error);

        const tagId = requireData(tagResult.data, 'Failed to load saved tag.').id;
        const linkResult = await admin
          .from('admin_customer_tag_links')
          .upsert(
            {
              customer_id: mutation.customerId,
              tag_id: tagId,
            },
            { onConflict: 'customer_id,tag_id' },
          );
        ensureCrmSchema(linkResult.error);
        break;
      }

      case 'remove-tag': {
        if (actor.role !== 'admin') {
          throw new Error('إزالة الوسوم متاحة للمدير فقط.');
        }

        const { error } = await admin
          .from('admin_customer_tag_links')
          .delete()
          .eq('customer_id', mutation.customerId)
          .eq('tag_id', mutation.tagId);
        ensureCrmSchema(error);
        break;
      }
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      isMissingCrmSchemaError(error as { message?: string | null; code?: string | null })
    ) {
      throw new Error(
        'منظومة CRM تحتاج تفعيل جداولها في Supabase أولاً. افتح SQL Editor ونفّذ ملف supabase/migrations/0004_customer_crm.sql ثم حدّث الصفحة.',
      );
    }

    throw error;
  }

  return loadCustomerWithCrm(admin, mutation.customerId);
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
