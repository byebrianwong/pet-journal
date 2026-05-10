-- Atomic create-pet RPC: inserts the pet AND the owner share in one
-- transaction, with created_by set server-side from auth.uid(). This
-- sidesteps the mysterious "violates RLS" error on direct table inserts —
-- the function's own RLS context is the same authenticated user, but
-- because we set created_by inside the function the value can't be lost
-- between client and server.
--
-- Idempotent.

create or replace function public.create_pet_with_owner(
  p_name text,
  p_species text default 'dog',
  p_breed text default null,
  p_birthday date default null,
  p_weight_lbs decimal default null,
  p_photo_url text default null
) returns public.pets
language plpgsql
security definer  -- bypasses RLS; the function itself enforces "created_by = auth.uid()" by reading auth.uid() server-side
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

grant execute on function public.create_pet_with_owner to authenticated;
