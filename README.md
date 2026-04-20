# MotoMall Admin Control

MotoMall Admin is a `Next.js 16.2.3` dashboard that now talks to the same live Supabase project used by the storefront at:

- `D:\1 Projects\Motomall opus 4.6`

Firebase is no longer part of the live data path in this project.

## Source Of Truth

Always read the storefront project first before making structural changes:

- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0001_schema.sql`
- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0002_rls.sql`
- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0003_profiles_role.sql`
- `D:\1 Projects\Motomall opus 4.6\src\lib\supabase\*.ts`
- `D:\1 Projects\Motomall opus 4.6\src\lib\orders.ts`
- `D:\1 Projects\Motomall opus 4.6\src\types\index.ts`

Do not use these Control files as schema truth:

- `supabase/schema.sql`
- `implementation_plan.md`
- `supabase/agent-prompt.md`

## Shared Supabase Tables

The admin now targets these live shared tables:

- `profiles`
- `user_addresses`
- `user_orders`
- `categories`
- `brands`
- `products`
- `hero_banners`
- `site_settings`
- `admin_comparisons`
- `admin_spec_templates`
- `admin_reviews`
- `admin_customers`
- `admin_orders`

Important live schema rules:

- `site_settings.id` must be `'singleton'`
- `admin_customers.display_name` is the correct display field
- `admin_orders.placed_at` maps to the admin order UI date
- `products` does not have a `vehicle_type` column
- vehicle type must live in `products.specs.vehicleType`
- `products.spec_template_id` exists in the live schema
- `admin_comparisons.product_ids` is `text[]`
- image fields store public URL strings
- uploads go to the `uploads` storage bucket

## Security Model

Privileged writes do not go directly from the browser into `admin_*` tables.

Admin mutations are handled through:

- [src/app/api/admin/state/route.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/app/api/admin/state/route.ts)
- [src/app/api/admin/[resource]/route.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/app/api/admin/[resource]/route.ts)
- [src/app/api/upload/route.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/app/api/upload/route.ts)

Authorization is enforced in:

- [src/lib/supabase/admin-auth.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/supabase/admin-auth.ts)

Rules:

- every privileged server path verifies the logged-in user
- access requires `profiles.role` to be `admin` or `employee`
- only `admin` can manage team role changes and admin-only settings actions
- service-role code stays in `server-only` modules
- the existing mock fallback remains available when Supabase client config is missing

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Notes:

- if the public Supabase config is missing, the dashboard falls back to mock data
- if `SUPABASE_SERVICE_ROLE_KEY` is missing, privileged writes and uploads will fail

## Profiles Role Migration

The shared schema needed a real `profiles.role` column for admin access. That migration now lives in the storefront project:

- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0003_profiles_role.sql`

It adds:

```sql
role text not null default 'customer'
check (role in ('customer', 'employee', 'admin'))
```

Apply that migration to the shared database before relying on admin login or role-gated routes.

## Live Areas

These sections are wired to the shared Supabase data:

- products
- categories
- brands
- banners
- orders
- customers
- reviews
- comparisons
- specs
- settings
- team

Current behavior notes:

- admin order updates are mirrored into `user_orders` when `user_id` exists
- `/api/upload` stores images in Supabase Storage bucket `uploads`
- reports and expenses remain isolated to the admin app so the storefront schema stays clean

## Local Development

```bash
npm install
npm run dev
```

Verification:

```bash
npm run lint
npm run build
```

## Important Files

- [src/lib/supabase/types.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/supabase/types.ts)
- [src/lib/supabase/db.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/supabase/db.ts)
- [src/lib/supabase/admin-repository.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/supabase/admin-repository.ts)
- [src/lib/supabase/admin-records.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/supabase/admin-records.ts)
- [src/lib/admin-store.tsx](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/lib/admin-store.tsx)
- [src/types/admin.ts](/D:/1%20Projects/Motomall%20opus%204.6%20Control/src/types/admin.ts)

## Change Rules

When extending this project:

1. Start from the storefront schema and DAL.
2. Do not reintroduce Firebase.
3. Do not invent old shared table names like `orders`, `customers`, `comparisons`, `spec_templates`, or `reviews`.
4. Preserve the existing admin design and Arabic RTL behavior unless the task explicitly asks for UI changes.
5. If you need admin-only persistence beyond the shared storefront schema, isolate it clearly from the storefront tables.
