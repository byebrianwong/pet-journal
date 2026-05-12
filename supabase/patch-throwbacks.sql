-- Patch: "On this day" throwbacks. Returns timeline events from the same
-- month+day in prior years for a given pet. Floored at 180 days ago so
-- today's own entries don't show up. RLS on timeline_events still applies.
--
-- Idempotent. Safe to re-run.

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
