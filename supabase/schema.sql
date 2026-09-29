-- Delight Works AdSign — Supabase schema
-- Run this entire script in the Supabase SQL Editor
-- Then set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

-- ─── Site settings (landing copy, quote defaults, material catalog, Panaflex pricing) ───
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Quotes ───
-- lines[] items may include: mockupPng (base64 data URL from 3D capture),
-- logoUrl, thicknessIn, areaSqft, face, lighting, printing, pricing breakdown.
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

-- ─── RLS ───
alter table site_settings enable row level security;
alter table quotes enable row level security;

-- Drop existing policies if re-running
drop policy if exists "settings readable" on site_settings;
drop policy if exists "settings writable" on site_settings;
drop policy if exists "quotes open insert" on quotes;
drop policy if exists "quotes open read" on quotes;
drop policy if exists "quotes open update" on quotes;

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

-- ─── Seed Panaflex pricing into site_settings (key = 'quote') ───
-- Edit rates later in /buildersettings → Quote tab.
-- Pricing formula: (construction + face + lighting + printing) × sqft × (1 + markup%) , min = minimumCharge
insert into site_settings (key, value, updated_at)
values (
  'quote',
  '{
    "markupPct": 40,
    "vatPct": 12,
    "quotePrefix": "DW",
    "terms": [
      "This quotation is valid for 30 days from the date of issue.",
      "50% downpayment is required to commence production.",
      "Prices are subject to site survey confirmation."
    ],
    "preparedByTitle": "Sales Specialist",
    "panaflexPricing": {
      "constructionPerSqft": 350,
      "face": {
        "panaflex": 180,
        "tarp": 120,
        "apc": 220,
        "acrylic": 450,
        "metal": 380,
        "custom": 0
      },
      "lighting": {
        "without": 0,
        "with": 280
      },
      "printing": {
        "sticker": 90,
        "direct": 150,
        "uv": 220
      },
      "minimumCharge": 2500
    }
  }'::jsonb,
  now()
)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();

-- Optional: seed empty catalog key (builder falls back to defaults if missing)
insert into site_settings (key, value, updated_at)
values ('catalog', '[]'::jsonb, now())
on conflict (key) do nothing;
