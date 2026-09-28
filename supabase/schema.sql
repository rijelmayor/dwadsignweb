-- DWA Sign — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query)

-- Quotation records created by the sales team
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,
  client jsonb not null default '{}'::jsonb,   -- { name, company, email, phone, project }
  lines jsonb not null default '[]'::jsonb,    -- array of line items from the builder
  totals jsonb not null default '{}'::jsonb,   -- { sub, vat, grand }
  status text not null default 'draft'         -- draft | sent | approved | won | lost
    check (status in ('draft','sent','approved','won','lost')),
  created_at timestamptz not null default now()
);

-- Optional: structured price list (later, sync from src/lib/pricing.ts)
create table if not exists price_list (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  product text not null,
  material text not null,
  unit text not null check (unit in ('sqft','pcs','lm')),
  price_per_unit numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (category, product, material)
);

-- Row Level Security (start permissive for the internal tool; tighten with auth later)
alter table quotes enable row level security;
alter table price_list enable row level security;

create policy "quotes open insert" on quotes
  for insert to anon, authenticated with check (true);
create policy "quotes open read" on quotes
  for select to anon, authenticated using (true);
create policy "prices readable" on price_list
  for select to anon, authenticated using (true);

-- ============================================================
-- NEXT STEP (when ready): protect the quotation tool
-- 1. Enable Email auth: Authentication -> Providers -> Email
-- 2. Create a sales role table and restrict /quote with
--    Supabase Auth (see README, "Locking down /quote").
-- ============================================================
