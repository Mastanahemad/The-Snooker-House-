create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  mobile text not null,
  booking_date date not null,
  booking_time text,
  table_number integer,
  amount numeric default 0,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text unique not null,
  created_at timestamptz default now()
);
