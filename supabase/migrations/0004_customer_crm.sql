alter table public.admin_customers
  add column if not exists crm_status text not null default 'new',
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists internal_rating integer not null default 0;

alter table public.admin_customers
  drop constraint if exists admin_customers_crm_status_check;

alter table public.admin_customers
  add constraint admin_customers_crm_status_check
  check (crm_status in ('new', 'active', 'vip', 'at_risk', 'inactive'));

alter table public.admin_customers
  drop constraint if exists admin_customers_internal_rating_check;

alter table public.admin_customers
  add constraint admin_customers_internal_rating_check
  check (internal_rating between 0 and 5);

create table if not exists public.admin_customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.admin_customers(id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_customer_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.admin_customers(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open',
  priority text not null default 'medium',
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_customer_tasks_status_check
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  constraint admin_customer_tasks_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent'))
);

create table if not exists public.admin_customer_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#3b82f6',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_customer_tag_links (
  customer_id text not null references public.admin_customers(id) on delete cascade,
  tag_id uuid not null references public.admin_customer_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, tag_id)
);

create table if not exists public.admin_customer_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.admin_customers(id) on delete cascade,
  type text not null default 'note',
  summary text not null,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_customer_interactions_type_check
    check (type in ('call', 'whatsapp', 'visit', 'email', 'note'))
);

create index if not exists admin_customers_crm_status_idx
  on public.admin_customers(crm_status);

create index if not exists admin_customers_next_follow_up_idx
  on public.admin_customers(next_follow_up_at);

create index if not exists admin_customer_notes_customer_id_idx
  on public.admin_customer_notes(customer_id, created_at desc);

create index if not exists admin_customer_tasks_customer_id_idx
  on public.admin_customer_tasks(customer_id, status, due_at);

create index if not exists admin_customer_interactions_customer_id_idx
  on public.admin_customer_interactions(customer_id, occurred_at desc);

alter table public.admin_customer_notes enable row level security;
alter table public.admin_customer_tasks enable row level security;
alter table public.admin_customer_tags enable row level security;
alter table public.admin_customer_tag_links enable row level security;
alter table public.admin_customer_interactions enable row level security;

drop trigger if exists admin_customer_notes_set_updated_at on public.admin_customer_notes;
create trigger admin_customer_notes_set_updated_at
before update on public.admin_customer_notes
for each row execute function public.set_updated_at();

drop trigger if exists admin_customer_tasks_set_updated_at on public.admin_customer_tasks;
create trigger admin_customer_tasks_set_updated_at
before update on public.admin_customer_tasks
for each row execute function public.set_updated_at();

drop trigger if exists admin_customer_tags_set_updated_at on public.admin_customer_tags;
create trigger admin_customer_tags_set_updated_at
before update on public.admin_customer_tags
for each row execute function public.set_updated_at();

drop trigger if exists admin_customer_interactions_set_updated_at on public.admin_customer_interactions;
create trigger admin_customer_interactions_set_updated_at
before update on public.admin_customer_interactions
for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
