-- ============================================================
--  MotoMall — Supabase Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- Profiles (1-1 مع auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name  text not null default '',
  email      text not null,
  phone      text not null default '',
  role       text not null default 'customer' check (role in ('customer','employee','admin')),
  loyalty_tier text default 'عضو جديد',
  member_since text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Addresses ----------
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  city text not null,
  area text not null,
  street text not null,
  notes text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.addresses (user_id);

-- ---------- Brands ----------
create table public.brands (
  id text primary key,
  name text not null,
  slug text unique not null,
  logo text,
  country text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Categories ----------
create table public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  image text,
  icon text,
  parent_id text references public.categories(id) on delete set null,
  subcategories jsonb default '[]'::jsonb,
  product_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Products ----------
create table public.products (
  id text primary key,
  name text not null,
  name_en text,
  slug text unique not null,
  brand_id text references public.brands(id) on delete set null,
  brand_name text,
  category_id text references public.categories(id) on delete set null,
  category_name text,
  vehicle_type text check (vehicle_type in ('fuel','electric') or vehicle_type is null),
  price numeric not null,
  original_price numeric,
  discount integer,
  image text not null,
  images jsonb default '[]'::jsonb,
  description text,
  spec_template_id text,
  specs jsonb default '{}'::jsonb,
  rating numeric default 0,
  review_count integer default 0,
  in_stock boolean default true,
  is_new boolean default false,
  is_best_seller boolean default false,
  search_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.products (category_id);
create index on public.products (brand_id);
create index on public.products using gin (to_tsvector('simple', coalesce(search_text,'')));

-- ---------- Hero Banners ----------
create table public.hero_banners (
  id text primary key,
  title text not null,
  subtitle text not null,
  button_text text not null,
  button_href text not null,
  image text,
  gradient text,
  icon text,
  size text not null default 'small' check (size in ('large','small')),
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Customers (جدول ملخص للـ Admin) ----------
create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text not null,
  address text,
  orders_count integer default 0,
  total_spent numeric default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Orders ----------
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric,
  shipping_cost numeric,
  total_amount numeric not null,
  status text not null default 'processing'
    check (status in ('processing','confirmed','in_transit','delivered','cancelled')),
  payment_method text not null,
  payment_label text,
  shipping_address text not null,
  tracking_code text,
  timeline jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.orders (customer_id);
create index on public.orders (status);

-- ---------- Reviews ----------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id text not null references public.products(id) on delete cascade,
  product_name text not null,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
create index on public.reviews (product_id, status);

-- ---------- Comparisons ----------
create table public.comparisons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique,
  product_ids jsonb not null default '[]'::jsonb,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- ---------- Spec Templates ----------
create table public.spec_templates (
  id text primary key,
  name text not null,
  icon text default '📄',
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Expenses ----------
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- Site Settings (single row) ----------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'MotoMall',
  store_description text default '',
  store_logo text,
  store_phone text,
  store_email text,
  store_address text,
  currency text default 'IQD',
  shipping_provinces jsonb default '[]'::jsonb,
  payment_methods jsonb default '[]'::jsonb,
  return_policy text default '',
  terms_conditions text default '',
  privacy_policy text default '',
  seo_title text default '',
  seo_description text default '',
  seo_keywords text default '',
  social_links jsonb default '[]'::jsonb,
  trust_features jsonb default '[]'::jsonb,
  footer_copyright text,
  updated_at timestamptz default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------- Navigation (جديد — للمينيو) ----------
create table public.navigation (
  id int primary key default 1 check (id = 1),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);
insert into public.navigation (id) values (1) on conflict do nothing;

-- ============================================================
--  Triggers: auto-create profile + customer عند التسجيل
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  insert into public.customers (id, name, email, phone)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'first_name','') || ' ' || coalesce(new.raw_user_meta_data->>'last_name','')),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  RLS Policies
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.addresses        enable row level security;
alter table public.products         enable row level security;
alter table public.categories       enable row level security;
alter table public.brands           enable row level security;
alter table public.hero_banners     enable row level security;
alter table public.orders           enable row level security;
alter table public.reviews          enable row level security;
alter table public.comparisons      enable row level security;
alter table public.spec_templates   enable row level security;
alter table public.customers        enable row level security;
alter table public.expenses         enable row level security;
alter table public.site_settings    enable row level security;
alter table public.navigation       enable row level security;

-- Helper: هل المستخدم أدمين/موظف؟
create or replace function public.is_staff() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','employee')
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── قراءة عامة (للـ storefront) ──
create policy "public read products"       on public.products       for select using (true);
create policy "public read categories"     on public.categories     for select using (true);
create policy "public read brands"         on public.brands         for select using (true);
create policy "public read hero_banners"   on public.hero_banners   for select using (is_active = true);
create policy "public read site_settings"  on public.site_settings  for select using (true);
create policy "public read navigation"     on public.navigation     for select using (true);
create policy "public read spec_templates" on public.spec_templates for select using (true);
create policy "public read approved reviews" on public.reviews for select using (status = 'approved');
create policy "public read featured comparisons" on public.comparisons for select using (is_featured = true);

-- ── الكتابة للـ staff فقط ──
create policy "staff write products"     on public.products     for all using (is_staff()) with check (is_staff());
create policy "staff write categories"   on public.categories   for all using (is_staff()) with check (is_staff());
create policy "staff write brands"       on public.brands       for all using (is_staff()) with check (is_staff());
create policy "staff write banners"      on public.hero_banners for all using (is_staff()) with check (is_staff());
create policy "staff write comparisons"  on public.comparisons  for all using (is_staff()) with check (is_staff());
create policy "staff write templates"    on public.spec_templates for all using (is_staff()) with check (is_staff());
create policy "admin write settings"     on public.site_settings  for all using (is_admin()) with check (is_admin());
create policy "admin write navigation"   on public.navigation     for all using (is_admin()) with check (is_admin());
create policy "admin read all customers" on public.customers      for select using (is_staff());
create policy "staff read all orders"    on public.orders         for select using (is_staff());
create policy "staff update orders"      on public.orders         for update using (is_staff());
create policy "admin expenses"           on public.expenses       for all using (is_admin()) with check (is_admin());
create policy "staff read reviews"       on public.reviews        for select using (is_staff());
create policy "staff moderate reviews"   on public.reviews        for update using (is_staff());
create policy "staff delete reviews"     on public.reviews        for delete using (is_staff());

-- ── المستخدم يقرأ/يكتب بياناته فقط ──
create policy "user read own profile"    on public.profiles  for select using (id = auth.uid() or is_staff());
create policy "user update own profile"  on public.profiles  for update using (id = auth.uid());
create policy "user manage addresses"    on public.addresses for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user read own orders"     on public.orders for select using (customer_id = auth.uid() or is_staff());
create policy "user create order"        on public.orders for insert with check (customer_id = auth.uid() or customer_id is null);

create policy "user create review"       on public.reviews for insert with check (customer_id = auth.uid());
create policy "user read own reviews"    on public.reviews for select using (customer_id = auth.uid());

create policy "user read own customer"   on public.customers for select using (id = auth.uid() or is_staff());
create policy "user update own customer" on public.customers for update using (id = auth.uid());
