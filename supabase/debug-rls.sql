-- One-shot diagnostic for the pets-insert RLS rejection. Paste in SQL Editor.
-- Read each result block; the answers will tell us which assumption is wrong.

-- 1. EVERY policy currently attached to public.pets
select policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'pets'
order by policyname;

-- 2. Columns in the table (so we can see if created_by exists, has NOT NULL,
--    has a default, etc.)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'pets'
order by ordinal_position;

-- 3. Foreign keys on the table
select tc.constraint_name, kcu.column_name,
       ccu.table_schema || '.' || ccu.table_name as references_table,
       ccu.column_name as references_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
where tc.table_schema = 'public' and tc.table_name = 'pets'
  and tc.constraint_type = 'FOREIGN KEY';

-- 4. Check whether RLS is enabled and forced
select c.relname, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'pets';
