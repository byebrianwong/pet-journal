-- Patch: add fi_pet_id column to public.pets so we can map each Pet Journal
-- pet to its Fi Collar pet. Without this mapping the Fi sync was passing the
-- Supabase UUID into the Fi API, which never resolves to a real pet.
--
-- Idempotent. Safe to re-run.

alter table public.pets
  add column if not exists fi_pet_id text;
