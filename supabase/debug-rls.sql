-- Diagnostic for the pets-insert RLS rejection. Run all of this in one go in
-- the SQL Editor. It installs a debug RPC, then I'll call it from the app
-- to see exactly what the database sees when the user is authed.

-- 1. Show the policies on pets so we know what's actually attached
select policyname, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'pets'
order by policyname;

-- 2. Install a debug RPC that returns what auth/JWT settings look like
--    inside a request evaluated as the authenticated user. The function is
--    NOT security definer — it should run with the caller's identity.
create or replace function public.debug_auth()
returns table(
  uid_value text,
  uid_is_null boolean,
  jwt_sub text,
  jwt_role text,
  current_role_name text,
  comparison_test boolean
)
language sql
stable
as $$
  select
    auth.uid()::text as uid_value,
    (auth.uid() is null) as uid_is_null,
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ) as jwt_sub,
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    ) as jwt_role,
    current_user::text as current_role_name,
    -- Will resolve to the same expression PostgREST uses to evaluate the
    -- pets_insert WITH CHECK clause when created_by is set to auth.uid().
    (auth.uid() = auth.uid()) as comparison_test;
$$;

-- 3. Grant access so the authenticated role can call it via PostgREST
grant execute on function public.debug_auth() to anon, authenticated;
