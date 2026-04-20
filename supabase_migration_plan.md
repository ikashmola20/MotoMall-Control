# MotoMall Shared Supabase Plan

This file is now a short operating plan for the Control project after the move to the shared live Supabase setup.

## Current State

- Storefront project: `D:\1 Projects\Motomall opus 4.6`
- Admin project: `D:\1 Projects\Motomall opus 4.6 Control`
- both projects now talk to the same Supabase database
- the storefront is the schema source of truth
- Firebase is not part of the live path anymore

## Read These First

Use these files as the only schema and behavior reference:

- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0001_schema.sql`
- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0002_rls.sql`
- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0003_profiles_role.sql`
- `D:\1 Projects\Motomall opus 4.6\src\lib\supabase\*.ts`
- `D:\1 Projects\Motomall opus 4.6\src\lib\orders.ts`
- `D:\1 Projects\Motomall opus 4.6\src\types\index.ts`

Do not treat these Control files as schema truth:

- `supabase/schema.sql`
- `implementation_plan.md`
- `supabase/agent-prompt.md`

## Shared Tables

The admin must target these exact tables:

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

## Non-Negotiable Schema Details

- `site_settings.id` is the text value `'singleton'`
- `admin_customers.display_name` exists instead of `name`
- `admin_orders` is the admin-facing orders table
- `user_orders` is the mirrored customer-facing orders table
- `products` does not have a `vehicle_type` column
- vehicle type must be read from and written to `products.specs.vehicleType`
- `products.spec_template_id` exists
- `admin_comparisons.product_ids` is `text[]`
- image fields store public URLs
- uploads must use the `uploads` bucket

## What Control Now Does

- aligns its Supabase types with the live storefront schema
- uses secure server routes for privileged admin mutations
- checks `profiles.role` before privileged actions
- allows only `admin` and `employee` users to log in
- mirrors `admin_orders` changes to `user_orders` when `user_id` exists
- keeps reports and expenses isolated so the storefront schema is not polluted

## Roles Migration

The shared schema originally missed the role column used by admin auth. Apply this migration on the shared database:

- `D:\1 Projects\Motomall opus 4.6\supabase\migrations\0003_profiles_role.sql`

It adds:

```sql
role text not null default 'customer'
check (role in ('customer', 'employee', 'admin'))
```

## Reusable Agent Prompt

Use this prompt for any future agent working on the same migration path:

```text
You are working on MotoMall Admin at:
D:\1 Projects\Motomall opus 4.6 Control

The storefront project at:
D:\1 Projects\Motomall opus 4.6
is the live source of truth.

Read these first:
- supabase/migrations/0001_schema.sql
- supabase/migrations/0002_rls.sql
- supabase/migrations/0003_profiles_role.sql
- src/lib/supabase/*.ts
- src/lib/orders.ts
- src/types/index.ts

Do not trust these Control files as schema truth:
- supabase/schema.sql
- implementation_plan.md
- supabase/agent-prompt.md

Target these exact live shared tables:
- profiles
- user_addresses
- user_orders
- categories
- brands
- products
- hero_banners
- site_settings
- admin_comparisons
- admin_spec_templates
- admin_reviews
- admin_customers
- admin_orders

Important constraints:
- site_settings.id is 'singleton'
- admin_customers.display_name exists instead of name
- products has no vehicle_type column
- vehicle type must live in products.specs.vehicleType
- products.spec_template_id exists
- admin_comparisons.product_ids is text[]
- privileged writes must go through secure server routes or server actions with service_role
- verify the logged-in user and profiles.role in every privileged path
- only admin can change team roles
- keep the existing mock fallback if Supabase config is missing
- preserve Arabic RTL UI and current design
- do not reintroduce Firebase
- do not invent old shared tables like orders/customers/comparisons/spec_templates/reviews

Definition of done:
- npm run build passes in Control
- npm run lint passes or leaves only non-blocking warnings
- admin login allows only roles admin or employee
- CRUD hits the shared live Supabase tables
- admin_orders changes mirror to user_orders when user_id exists
- uploads use bucket uploads and return public URLs
```

## Quick Verification

Run inside `D:\1 Projects\Motomall opus 4.6 Control`:

```bash
npm run lint
npm run build
```

Then verify:

- admin or employee login succeeds
- a product, category, banner, or setting edit appears in the shared data
- an order status update is mirrored to `user_orders` when applicable
