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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .insert({
      name: params.name,
      species: params.species ?? 'dog',
      breed: params.breed ?? null,
      birthday: params.birthday ?? null,
      weight_lbs: params.weight_lbs ?? null,
      photo_url: params.photo_url ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (petError) throw petError;

  // Auto-create owner share
  const { error: shareError } = await supabase
    .from('pet_shares')
    .insert({
      pet_id: pet.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    });

  if (shareError) throw shareError;
  return pet;
}

export async function getPetShares(petId: string): Promise<(PetShare & { user: { display_name: string; avatar_url: string | null } })[]> {
  const { data, error } = await supabase
    .from('pet_shares')
    .select('*, user:users(display_name, avatar_url)')
    .eq('pet_id', petId);

  if (error) throw error;
  return data ?? [];
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
