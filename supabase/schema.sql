-- Pet Journal Database Schema
-- Run this in your Supabase SQL Editor to set up the database.
--
-- This script is idempotent: it drops the app's public-schema tables and
-- helper objects first, then recreates them. Safe to re-run on a fresh DB
-- or to reset a half-applied previous run. WIPES PET-JOURNAL DATA — do not
-- run on a database with rows you care about.

-- ========================================================================
-- Reset (drop in dependency order; CASCADE clears RLS policies + FKs)
-- ========================================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_updated_at() cascade;
drop function if exists public.is_pet_owner(uuid) cascade;
drop function if exists public.create_pet_with_owner(text, text, text, date, decimal, text) cascade;
drop function if exists public.get_throwback_events(uuid) cascade;

drop table if exists public.pet_invites cascade;
drop table if exists public.medications cascade;
drop table if exists public.timeline_events cascade;
drop table if exists public.pet_shares cascade;
drop table if exists public.pets cascade;
drop table if exists public.users cascade;

-- ========================================================================
-- Extensions
-- ========================================================================
create extension if not exists "uuid-ossp";

-- ========================================================================
-- Tables
-- ========================================================================

-- Users profile table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Pets table
create table public.pets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  species text not null default 'dog',
  breed text,
  birthday date,
  weight_lbs decimal,
  photo_url text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Pet sharing (multi-user access)
create table public.pet_shares (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique(pet_id, user_id)
);

-- Timeline events (unified timeline)
create table public.timeline_events (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references public.users(id),
  event_type text not null check (event_type in ('vet_visit', 'memory', 'fi_activity', 'medication_log')),
  event_date timestamptz not null,
  title text,
  notes text,
  photo_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Medications (for reminders)
create table public.medications (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null default 'daily',
  time_of_day time,
  start_date date,
  end_date date,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Pet invites (for sharing)
create table public.pet_invites (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_by uuid not null references public.users(id),
  code text not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- ========================================================================
-- Indexes
-- ========================================================================
create index if not exists idx_pet_invites_code on pet_invites(code);
create index if not exists idx_timeline_events_pet_date on timeline_events(pet_id, event_date desc);
create index if not exists idx_timeline_events_type on timeline_events(event_type);
create index if not exists idx_pet_shares_user on pet_shares(user_id);
create index if not exists idx_pet_shares_pet on pet_shares(pet_id);
create index if not exists idx_medications_pet on medications(pet_id);

-- ========================================================================
-- Triggers / functions
-- ========================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger timeline_events_updated_at
  before update on timeline_events
  for each row execute function update_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- "Am I the owner of this pet?" helper. SECURITY DEFINER bypasses RLS for
-- this lookup, which is what lets pet_shares policies self-reference the
-- table without triggering Postgres error 42P17 (infinite recursion in
-- policy). Used by the shares_*_owner policies below.
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

-- Atomic create-pet RPC: inserts the pet AND the owner share in one
-- transaction, with created_by set server-side from auth.uid(). SECURITY
-- DEFINER so it bypasses RLS — the function itself enforces that
-- created_by = auth.uid() by reading the JWT claim directly.
create or replace function public.create_pet_with_owner(
  p_name text,
  p_species text default 'dog',
  p_breed text default null,
  p_birthday date default null,
  p_weight_lbs decimal default null,
  p_photo_url text default null
) returns public.pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_pet public.pets;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.pets (name, species, breed, birthday, weight_lbs, photo_url, created_by)
  values (p_name, p_species, p_breed, p_birthday, p_weight_lbs, p_photo_url, v_user_id)
  returning * into v_pet;

  insert into public.pet_shares (pet_id, user_id, role, accepted_at)
  values (v_pet.id, v_user_id, 'owner', now());

  return v_pet;
end;
$$;

grant execute on function public.create_pet_with_owner(text, text, text, date, decimal, text) to authenticated;

-- "On this day" throwbacks: events from the same month+day in prior years.
-- Floor at 180 days ago so today's own entries don't show up as throwbacks.
-- RLS on timeline_events still applies (function is SECURITY INVOKER).
create or replace function public.get_throwback_events(p_pet_id uuid)
returns setof public.timeline_events
language sql
stable
as $$
  select *
  from public.timeline_events
  where pet_id = p_pet_id
    and extract(month from event_date) = extract(month from now())
    and extract(day from event_date) = extract(day from now())
    and event_date < (now() - interval '180 days')
  order by event_date desc
  limit 10;
$$;

grant execute on function public.get_throwback_events(uuid) to authenticated;

-- ========================================================================
-- Row Level Security
-- ========================================================================
alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.pet_shares enable row level security;
alter table public.timeline_events enable row level security;
alter table public.medications enable row level security;
alter table public.pet_invites enable row level security;

-- Users can read/update their own profile
create policy "users_read_own" on public.users
  for select using (id = auth.uid());
create policy "users_update_own" on public.users
  for update using (id = auth.uid());
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

-- Users can read profiles of people they share pets with
create policy "users_read_shared" on public.users
  for select using (
    id in (
      select ps2.user_id from pet_shares ps1
      join pet_shares ps2 on ps1.pet_id = ps2.pet_id
      where ps1.user_id = auth.uid()
    )
  );

-- Pets: read/write if you have a share
create policy "pets_read_shared" on public.pets
  for select using (id in (select pet_id from pet_shares where user_id = auth.uid()));
create policy "pets_insert" on public.pets
  for insert with check (created_by = auth.uid());
create policy "pets_update_shared" on public.pets
  for update using (id in (select pet_id from pet_shares where user_id = auth.uid()));

-- Pet shares: read your own shares, owners can manage. Use is_pet_owner()
-- (SECURITY DEFINER) instead of a self-referencing subquery to avoid the
-- infinite-recursion-in-policy error.
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

-- Timeline events: read/write for shared pets
create policy "events_read_shared" on public.timeline_events
  for select using (pet_id in (select pet_id from pet_shares where user_id = auth.uid()));
create policy "events_insert_shared" on public.timeline_events
  for insert with check (
    pet_id in (select pet_id from pet_shares where user_id = auth.uid())
    and user_id = auth.uid()
  );
create policy "events_update_own" on public.timeline_events
  for update using (user_id = auth.uid());
create policy "events_delete_own" on public.timeline_events
  for delete using (user_id = auth.uid());

-- Medications: read/write for shared pets
create policy "meds_read_shared" on public.medications
  for select using (pet_id in (select pet_id from pet_shares where user_id = auth.uid()));
create policy "meds_insert_shared" on public.medications
  for insert with check (
    pet_id in (select pet_id from pet_shares where user_id = auth.uid())
    and created_by = auth.uid()
  );
create policy "meds_update_shared" on public.medications
  for update using (pet_id in (select pet_id from pet_shares where user_id = auth.uid()));
create policy "meds_delete_shared" on public.medications
  for delete using (pet_id in (select pet_id from pet_shares where user_id = auth.uid()));

-- Pet invites: anyone with the code can read it (to accept)
create policy "invites_insert_owner" on public.pet_invites
  for insert with check (
    pet_id in (select pet_id from pet_shares where user_id = auth.uid() and role = 'owner')
    and created_by = auth.uid()
  );
create policy "invites_read_by_code" on public.pet_invites
  for select using (true);
create policy "invites_update_accept" on public.pet_invites
  for update using (accepted_by is null);

-- ========================================================================
-- Grants
-- ========================================================================
-- RLS gates rows; grants allow the operation to be attempted at all.
-- Without these, PostgREST silently strips columns the calling role can't
-- write (e.g. created_by), which then fails any RLS check that references
-- the missing column.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.users,
  public.pets,
  public.pet_shares,
  public.timeline_events,
  public.medications,
  public.pet_invites
to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- ========================================================================
-- Realtime
-- ========================================================================
-- Add timeline_events to realtime publication if not already a member
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'timeline_events'
  ) then
    alter publication supabase_realtime add table timeline_events;
  end if;
end $$;

-- ========================================================================
-- Storage buckets
-- ========================================================================
-- Two buckets: 'photos' (public read) for memory photos, 'receipts'
-- (private) for vet receipt scans. Object names are namespaced by
-- <pet_id>/<filename> so RLS scopes by pet share.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos',   'photos',   true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- SECURITY DEFINER helper so storage policies don't trigger recursive
-- RLS on pet_shares. Returns true if the calling user shares the pet
-- whose UUID is the first path segment of the object name.
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

-- Storage RLS — clear old policies first so this is idempotent on re-runs.
drop policy if exists "photos_read_public"   on storage.objects;
drop policy if exists "photos_write_shared"  on storage.objects;
drop policy if exists "photos_update_shared" on storage.objects;
drop policy if exists "photos_delete_shared" on storage.objects;
drop policy if exists "receipts_read_shared"   on storage.objects;
drop policy if exists "receipts_write_shared"  on storage.objects;
drop policy if exists "receipts_update_shared" on storage.objects;
drop policy if exists "receipts_delete_shared" on storage.objects;

create policy "photos_read_public" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos_write_shared" on storage.objects
  for insert with check (bucket_id = 'photos' and can_access_pet_storage(name));
create policy "photos_update_shared" on storage.objects
  for update using (bucket_id = 'photos' and can_access_pet_storage(name));
create policy "photos_delete_shared" on storage.objects
  for delete using (bucket_id = 'photos' and can_access_pet_storage(name));

create policy "receipts_read_shared" on storage.objects
  for select using (bucket_id = 'receipts' and can_access_pet_storage(name));
create policy "receipts_write_shared" on storage.objects
  for insert with check (bucket_id = 'receipts' and can_access_pet_storage(name));
create policy "receipts_update_shared" on storage.objects
  for update using (bucket_id = 'receipts' and can_access_pet_storage(name));
create policy "receipts_delete_shared" on storage.objects
  for delete using (bucket_id = 'receipts' and can_access_pet_storage(name));
