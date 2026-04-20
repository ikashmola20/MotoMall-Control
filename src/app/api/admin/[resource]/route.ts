import { NextResponse, type NextRequest } from 'next/server';
import type {
  Brand,
  Category,
  Comparison,
  HeroBanner,
  Order,
  Product,
  Review,
  SiteSettings,
  SpecTemplate,
} from '@/types/admin';
import type { TeamRoleMutation } from '@/lib/admin-contract';
import { authorizeAdminRequest, AdminAccessError } from '@/lib/supabase/admin-auth';
import {
  deleteBrandRecord,
  deleteCategoryRecord,
  deleteComparisonRecord,
  deleteHeroBannerRecord,
  deleteProductRecord,
  deleteReviewRecord,
  deleteSpecTemplateRecord,
  saveBrandRecord,
  saveCategoryRecord,
  saveComparisonRecord,
  saveHeroBannerRecord,
  saveOrderRecord,
  saveProductRecord,
  saveReviewRecord,
  saveSettingsRecord,
  saveSpecTemplateRecord,
  updateTeamMemberRoleRecord,
} from '@/lib/supabase/admin-repository';

interface RouteContext {
  params: Promise<{ resource: string }>;
}

function toErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Request failed.';
  return NextResponse.json({ error: message }, { status: 500 });
}

async function readJson<T>(request: NextRequest): Promise<T> {
  const data = (await request.json().catch(() => null)) as T | null;
  if (!data) {
    throw new Error('Invalid request body.');
  }

  return data;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { resource } = await context.params;
    const access = await authorizeAdminRequest({
      adminOnly: resource === 'settings' || resource === 'team',
    });

    switch (resource) {
      case 'products':
        return NextResponse.json(
          await saveProductRecord(await readJson<Product>(request)),
        );
      case 'categories':
        return NextResponse.json(
          await saveCategoryRecord(await readJson<Category>(request)),
        );
      case 'brands':
        return NextResponse.json(
          await saveBrandRecord(await readJson<Brand>(request)),
        );
      case 'banners':
        return NextResponse.json(
          await saveHeroBannerRecord(await readJson<HeroBanner>(request)),
        );
      case 'comparisons':
        return NextResponse.json(
          await saveComparisonRecord(await readJson<Comparison>(request)),
        );
      case 'spec-templates':
        return NextResponse.json(
          await saveSpecTemplateRecord(await readJson<SpecTemplate>(request)),
        );
      case 'reviews':
        return NextResponse.json(
          await saveReviewRecord(await readJson<Review>(request)),
        );
      case 'settings':
        return NextResponse.json(
          await saveSettingsRecord(await readJson<SiteSettings>(request)),
        );
      case 'orders':
        return NextResponse.json(
          await saveOrderRecord(await readJson<Order>(request)),
        );
      case 'team': {
        const mutation = await readJson<TeamRoleMutation>(request);
        return NextResponse.json(
          await updateTeamMemberRoleRecord({
            actorUserId: access.user.id,
            userId: mutation.userId,
            email: mutation.email,
            role: mutation.role,
          }),
        );
      }
      default:
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { resource } = await context.params;
    await authorizeAdminRequest();
    const payload = await readJson<{ id: string }>(request);

    switch (resource) {
      case 'products':
        await deleteProductRecord(payload.id);
        break;
      case 'categories':
        await deleteCategoryRecord(payload.id);
        break;
      case 'brands':
        await deleteBrandRecord(payload.id);
        break;
      case 'banners':
        await deleteHeroBannerRecord(payload.id);
        break;
      case 'comparisons':
        await deleteComparisonRecord(payload.id);
        break;
      case 'spec-templates':
        await deleteSpecTemplateRecord(payload.id);
        break;
      case 'reviews':
        await deleteReviewRecord(payload.id);
        break;
      default:
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
