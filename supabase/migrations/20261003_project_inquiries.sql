-- Project inquiries from the landing-page "Have a project in mind?" form.
-- Run once in Supabase → SQL Editor.
-- Visitors (anon) can INSERT only. Nobody can read these rows with the public key;
-- view them in Supabase → Table Editor → inquiries.

create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  contact     text not null check (char_length(contact) between 1 and 160),
  location    text check (char_length(location) <= 160),
  needs       text[] not null default '{}',
  message     text not null check (char_length(message) between 1 and 2000),
  status      text not null default 'new'
);

alter table public.inquiries enable row level security;

drop policy if exists "inquiries anon insert" on public.inquiries;
create policy "inquiries anon insert" on public.inquiries
  for insert to anon, authenticated
  with check (true);
