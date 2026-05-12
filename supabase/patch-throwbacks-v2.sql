-- Patch: broaden throwbacks to "memory-type events 1+ months old" and take
-- the user's local date as a parameter so Postgres' UTC now() doesn't shift
-- the date window for non-UTC users.
--
-- Drops the v1 signature (uuid only) and creates the new (uuid, date) one.
-- Idempotent. Safe to re-run.

drop function if exists public.get_throwback_events(uuid);

create or replace function public.get_throwback_events(p_pet_id uuid, p_today date)
returns setof public.timeline_events
language sql
stable
as $$
  select *
  from public.timeline_events
  where pet_id = p_pet_id
    and event_type = 'memory'
    and event_date < (p_today - interval '1 month')
  order by event_date desc
  limit 5;
$$;

grant execute on function public.get_throwback_events(uuid, date) to authenticated;
