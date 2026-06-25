create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.warehouse_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_date date not null,
  type text not null check (type in ('supplier_entry', 'breakfast_out', 'manual_adjustment')),
  quantity integer not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint manual_adjustment_requires_note check (type <> 'manual_adjustment' or length(trim(coalesce(notes, ''))) > 0),
  constraint non_zero_quantity check (quantity <> 0)
);

create table if not exists public.daily_breakfast_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null unique,
  breakfast_total integer not null default 0 check (breakfast_total >= 0),
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_breakfast_lines (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid not null references public.daily_breakfast_records(id) on delete restrict,
  product_id uuid not null references public.products(id),
  warehouse_stock_before integer not null default 0,
  supplier_entry integer not null default 0 check (supplier_entry >= 0),
  taken_from_warehouse integer not null default 0 check (taken_from_warehouse >= 0),
  warehouse_stock_after integer not null default 0,
  initial_leftover integer not null default 0 check (initial_leftover >= 0),
  breakfast_available integer not null default 0 check (breakfast_available >= 0),
  final_leftover integer not null default 0 check (final_leftover >= 0),
  breakfast_consumed integer not null default 0 check (breakfast_consumed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_record_id, product_id),
  constraint stock_after_matches check (warehouse_stock_after = warehouse_stock_before + supplier_entry - taken_from_warehouse),
  constraint available_matches check (breakfast_available = initial_leftover + taken_from_warehouse),
  constraint consumed_matches check (breakfast_consumed = breakfast_available - final_leftover),
  constraint final_leftover_not_over_available check (final_leftover <= breakfast_available)
);

create index if not exists products_order_idx on public.products(active, sort_order, name);
create index if not exists warehouse_movements_product_date_idx on public.warehouse_movements(product_id, movement_date);
create index if not exists daily_breakfast_records_date_idx on public.daily_breakfast_records(record_date desc);
create index if not exists daily_breakfast_lines_record_idx on public.daily_breakfast_lines(daily_record_id);

insert into public.products (name, active, sort_order)
values
  ('Entera normal', true, 10),
  ('Media normal', true, 20),
  ('Entera integral', true, 30),
  ('Media integral', true, 40),
  ('Bollito', true, 50),
  ('Semilla', true, 60),
  ('Centeno', true, 70)
on conflict do nothing;

-- MVP sin autenticacion: habilita politicas abiertas para uso privado del enlace.
-- Antes de usarlo con varias personas o datos sensibles, anadir autenticacion y RLS por usuario/rol.
alter table public.products enable row level security;
alter table public.warehouse_movements enable row level security;
alter table public.daily_breakfast_records enable row level security;
alter table public.daily_breakfast_lines enable row level security;

drop policy if exists "public products access" on public.products;
drop policy if exists "public warehouse movements access" on public.warehouse_movements;
drop policy if exists "public daily records access" on public.daily_breakfast_records;
drop policy if exists "public daily lines access" on public.daily_breakfast_lines;

create policy "public products access" on public.products for all using (true) with check (true);
create policy "public warehouse movements access" on public.warehouse_movements for all using (true) with check (true);
create policy "public daily records access" on public.daily_breakfast_records for all using (true) with check (true);
create policy "public daily lines access" on public.daily_breakfast_lines for all using (true) with check (true);
