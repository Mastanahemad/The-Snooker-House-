-- Supabase PostgreSQL starter schema. Apply only after creating a Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.club_tables (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  display_name text not null,
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  status text not null default 'available' check (status in ('available','occupied','maintenance')),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en','hi','mr')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  customer_name text not null,
  customer_phone text not null,
  table_id uuid not null references public.club_tables(id),
  booking_date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes between 30 and 720),
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled','completed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded')),
  created_at timestamptz not null default now()
);
-- Prevent overlapping active reservations for the same table.
create extension if not exists btree_gist;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    table_id with =,
    tsrange(booking_date + start_time, booking_date + start_time + duration_minutes * interval '1 minute', '[)') with &&
  ) where (status in ('pending','confirmed'));

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id),
  plan_name text not null,
  starts_on date not null,
  ends_on date not null,
  amount numeric(10,2) not null,
  status text not null default 'active'
);

create table if not exists public.cafe_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  booking_id uuid references public.bookings(id),
  items jsonb not null default '[]'::jsonb,
  amount numeric(10,2) not null default 0,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  amount numeric(10,2) not null check (amount >= 0),
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner','manager','frontdesk','cafe')),
  active boolean not null default true
);

alter table public.club_tables enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.memberships enable row level security;
alter table public.cafe_orders enable row level security;
alter table public.expenses enable row level security;
alter table public.staff_profiles enable row level security;

-- Production note: add role-aware RLS policies before enabling public access.
-- Never use the Supabase service-role key in the Android app.
