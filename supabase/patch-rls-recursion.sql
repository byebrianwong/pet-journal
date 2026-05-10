-- Patch for ISSUE: Postgres 42P17 "infinite recursion detected in policy
-- for relation pet_shares" hit by every authed page in the app.
--
-- Apply this in the Supabase SQL Editor on a database that already has the
-- old (broken) policies. Idempotent.
--
-- The full schema.sql in this repo has been updated with this fix, so a
-- fresh project doesn't need this patch.

-- Helper: SECURITY DEFINER lookup that bypasses RLS. Lets pet_shares
-- policies reference pet_shares without triggering recursion.
create or replace function public.is_pet_owner(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pet_shares
    where pet_id = p_pet_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- Replace the three self-referencing pet_shares policies.
drop policy if exists "shares_read_own" on public.pet_shares;
drop policy if exists "shares_insert_owner" on public.pet_shares;
drop policy if exists "shares_delete_owner" on public.pet_shares;

create policy "shares_read_own" on public.pet_shares
  for select using (
    user_id = auth.uid() or is_pet_owner(pet_id)
  );

create policy "shares_insert_owner" on public.pet_shares
  for insert with check (
    user_id = auth.uid() or is_pet_owner(pet_id)
  );

create policy "shares_delete_owner" on public.pet_shares
  for delete using (
    is_pet_owner(pet_id)
  );
