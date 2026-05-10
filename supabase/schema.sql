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

-- Pet shares: read your own shares, owners can manage
create policy "shares_read_own" on public.pet_shares
  for select using (
    user_id = auth.uid() or
    pet_id in (select pet_id from pet_shares where user_id = auth.uid() and role = 'owner')
  );
create policy "shares_insert_owner" on public.pet_shares
  for insert with check (
    pet_id in (select pet_id from pet_shares where user_id = auth.uid() and role = 'owner')
    or user_id = auth.uid()
  );
create policy "shares_delete_owner" on public.pet_shares
  for delete using (
    pet_id in (select pet_id from pet_shares where user_id = auth.uid() and role = 'owner')
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
