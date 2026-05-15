import { supabase } from './supabase';
import type { Pet, PetShare, Medication } from '../types/database';

export async function getMyPets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pet_shares')
    .select('pet:pets(*)')
    .order('invited_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => row.pet).filter(Boolean);
}

export async function createPet(params: {
  name: string;
  species?: string;
  breed?: string;
  birthday?: string;
  weight_lbs?: number;
  photo_url?: string;
}): Promise<Pet> {
  // Atomic: create_pet_with_owner inserts the pet AND the owner share in
  // one transaction, with created_by set server-side from auth.uid(). This
  // avoids a class of failures where PostgREST or column-level grants caused
  // the client-supplied created_by to be silently dropped, then RLS would
  // reject "NULL = auth.uid()".
  const { data, error } = await supabase.rpc('create_pet_with_owner', {
    p_name: params.name,
    p_species: params.species ?? 'dog',
    p_breed: params.breed ?? null,
    p_birthday: params.birthday ?? null,
    p_weight_lbs: params.weight_lbs ?? null,
    p_photo_url: params.photo_url ?? null,
  });

  if (error) throw error;
  return data as Pet;
}

export async function getPetShares(petId: string): Promise<(PetShare & { user: { display_name: string; avatar_url: string | null } })[]> {
  const { data, error } = await supabase
    .from('pet_shares')
    .select('*, user:users(display_name, avatar_url)')
    .eq('pet_id', petId);

  if (error) throw error;
  return data ?? [];
}

export async function setFiPetId(petId: string, fiPetId: string | null): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .update({ fi_pet_id: fiPetId })
    .eq('id', petId);

  if (error) throw error;
}

export async function getPet(petId: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single();

  if (error) return null;
  return data as Pet;
}

export async function getMedicationLogs(
  petId: string,
  sinceDays = 60,
): Promise<import('../types/database').TimelineEvent[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('pet_id', petId)
    .eq('event_type', 'medication_log')
    .gte('event_date', since)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as any;
}

export async function getMedications(petId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('pet_id', petId)
    .is('end_date', null)
    .order('time_of_day', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createMedication(params: {
  petId: string;
  name: string;
  dosage: string;
  frequency?: string;
  timeOfDay?: string;
}): Promise<Medication> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('medications')
    .insert({
      pet_id: params.petId,
      name: params.name,
      dosage: params.dosage,
      frequency: params.frequency ?? 'daily',
      time_of_day: params.timeOfDay ?? null,
      start_date: new Date().toISOString().split('T')[0],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
