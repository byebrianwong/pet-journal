-- Patch: ensure the `anon` and `authenticated` roles have CRUD privileges on
-- every public-schema table. RLS is what enforces row-level security; GRANTs
-- are what allow the operation to be ATTEMPTED in the first place.
--
-- Why this is needed: when tables are dropped+recreated via SQL Editor as the
-- postgres superuser, Supabase's default-privileges machinery sometimes
-- doesn't apply column-level grants to non-superuser roles. PostgREST then
-- silently strips columns those roles can't write (e.g. created_by) from
-- INSERT requests, leaving them NULL, which fails any "= auth.uid()" RLS check.
--
-- Idempotent. Safe to re-run.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.users,
  public.pets,
  public.pet_shares,
  public.timeline_events,
  public.medications,
  public.pet_invites
to anon, authenticated;

-- Sequences (e.g. for auto-increment FKs if any are added later)
grant usage, select on all sequences in schema public to anon, authenticated;

-- Future-proof: any table added later should get the same grants automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
