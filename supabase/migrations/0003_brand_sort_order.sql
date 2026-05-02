alter table public.brands
  add column if not exists sort_order integer not null default 0;

with ranked_brands as (
  select
    id,
    row_number() over (order by name asc) as next_sort_order
  from public.brands
)
update public.brands as brands
set sort_order = ranked_brands.next_sort_order
from ranked_brands
where brands.id = ranked_brands.id
  and brands.sort_order = 0;

create index if not exists brands_sort_order_idx
  on public.brands(sort_order asc, name asc);
