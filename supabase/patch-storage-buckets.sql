-- Storage buckets for the Pet Journal app. Run this in the Supabase SQL
-- Editor once per project. Idempotent.
--
-- Two buckets:
--   photos    — pet memory photos. Public read so entry cards can render
--               images without signed URLs. Writes restricted to authed
--               users who share the pet.
--   receipts  — vet receipt scans. Private — only people on the pet's
--               share list can read/write. Receipts can contain pricing
--               and personal vet notes that shouldn't be world-readable.
--
-- Object path convention: <pet_id>/<filename>. The first path segment
-- is always the pet's UUID. RLS policies use this to scope access via
-- the existing pet_shares table.

-- ============================================================
-- Buckets
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',   'photos',   true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- Helper: can the current user access this pet's storage path?
-- The first segment of every object name is the pet_id. SECURITY DEFINER
-- so the policy lookup bypasses recursive RLS on pet_shares.
-- ============================================================

create or replace function public.can_access_pet_storage(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pet_shares
    where user_id = auth.uid()
      and pet_id = (
        case
          when p_object_name ~ '^[0-9a-f-]+/'
          then substring(p_object_name from '^([0-9a-f-]+)/')::uuid
          else null
        end
      )
  );
$$;

grant execute on function public.can_access_pet_storage(text) to authenticated;

-- ============================================================
-- Storage RLS — drop old policies first so this is idempotent
-- ============================================================

drop policy if exists "photos_read_public"   on storage.objects;
drop policy if exists "photos_write_shared"  on storage.objects;
drop policy if exists "photos_update_shared" on storage.objects;
drop policy if exists "photos_delete_shared" on storage.objects;
drop policy if exists "receipts_read_shared"   on storage.objects;
drop policy if exists "receipts_write_shared"  on storage.objects;
drop policy if exists "receipts_update_shared" on storage.objects;
drop policy if exists "receipts_delete_shared" on storage.objects;

-- Photos: world-readable (faster <Image> rendering, no signed-URL roundtrips).
-- Writes/updates/deletes require pet share.
create policy "photos_read_public" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_write_shared" on storage.objects
  for insert with check (
    bucket_id = 'photos' and can_access_pet_storage(name)
  );

create policy "photos_update_shared" on storage.objects
  for update using (
    bucket_id = 'photos' and can_access_pet_storage(name)
  );

create policy "photos_delete_shared" on storage.objects
  for delete using (
    bucket_id = 'photos' and can_access_pet_storage(name)
  );

-- Receipts: read/write requires pet share.
create policy "receipts_read_shared" on storage.objects
  for select using (
    bucket_id = 'receipts' and can_access_pet_storage(name)
  );

create policy "receipts_write_shared" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and can_access_pet_storage(name)
  );

create policy "receipts_update_shared" on storage.objects
  for update using (
    bucket_id = 'receipts' and can_access_pet_storage(name)
  );

create policy "receipts_delete_shared" on storage.objects
  for delete using (
    bucket_id = 'receipts' and can_access_pet_storage(name)
  );
