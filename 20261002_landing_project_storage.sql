-- DW AdSign Landing Page — Project Gallery Storage
-- Run this migration once in Supabase SQL Editor.
-- Project images uploaded from Builder Settings are stored in this bucket.

-- Public bucket so landing-page visitors can load portfolio images without signing in.
insert into storage.buckets (id, name, public)
values ('landing-assets', 'landing-assets', true)
on conflict (id) do update
set public = true;

-- Re-runnable policies.
drop policy if exists "landing assets public read" on storage.objects;
drop policy if exists "landing assets anon upload" on storage.objects;
drop policy if exists "landing assets anon update" on storage.objects;
drop policy if exists "landing assets anon delete" on storage.objects;

create policy "landing assets public read"
on storage.objects
for select
using (bucket_id = 'landing-assets');

create policy "landing assets anon upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'landing-assets');

create policy "landing assets anon update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'landing-assets')
with check (bucket_id = 'landing-assets');

create policy "landing assets anon delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'landing-assets');
