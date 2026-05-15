import { getMockState } from './state';
import type { Pet, PetShare, Medication } from '../../src/types/database';

export async function getMyPets(): Promise<Pet[]> {
  return getMockState().pets;
}

export async function createPet(params: any): Promise<Pet> {
  return {
    id: 'new-pet',
    name: params.name,
    species: params.species ?? 'dog',
    breed: params.breed ?? null,
    birthday: params.birthday ?? null,
    weight_lbs: params.weight_lbs ?? null,
    photo_url: params.photo_url ?? null,
    fi_pet_id: null,
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
  };
}

export async function setFiPetId(_petId: string, _fiPetId: string | null): Promise<void> {}

export async function getPet(petId: string): Promise<Pet | null> {
  return getMockState().pets.find((p) => p.id === petId) ?? null;
}

export async function getPetShares(_petId: string) {
  return getMockState().shares;
}

export async function getMedications(_petId: string): Promise<Medication[]> {
  return getMockState().medications;
}

export async function getMedicationLogs(_petId: string, _sinceDays?: number) {
  return getMockState().events.filter(e => e.event_type === 'medication_log');
}

export async function createMedication(params: any): Promise<Medication> {
  return {
    id: 'new-med',
    pet_id: params.petId,
    name: params.name,
    dosage: params.dosage,
    frequency: params.frequency ?? 'daily',
    time_of_day: params.timeOfDay ?? null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    created_by: 'mock-user-1',
    created_at: new Date().toISOString(),
  };
}
