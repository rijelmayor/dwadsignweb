-- Delight Works AdSign — Supabase schema
-- Run in Supabase SQL Editor

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,
  client jsonb not null default '{}'::jsonb,
  lines jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','sent','approved','won','lost')),
  created_at timestamptz not null default now()
);

alter table site_settings enable row level security;
alter table quotes enable row level security;

create policy "settings readable" on site_settings
  for select to anon, authenticated using (true);
create policy "settings writable" on site_settings
  for all to anon, authenticated using (true) with check (true);

create policy "quotes open insert" on quotes
  for insert to anon, authenticated with check (true);
create policy "quotes open read" on quotes
  for select to anon, authenticated using (true);
create policy "quotes open update" on quotes
  for update to anon, authenticated using (true);
