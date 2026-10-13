-- Fix draft delete (RLS previously had no DELETE policy)
drop policy if exists "quotes open delete" on quotes;
create policy "quotes open delete" on quotes
  for delete to anon, authenticated using (true);

drop policy if exists "quotes open update" on quotes;
create policy "quotes open update" on quotes
  for update to anon, authenticated using (true) with check (true);
