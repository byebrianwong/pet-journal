/**
 * Storybook mock for PetContext. Reads from the same MockState the rest
 * of the services use, so individual stories can configure pets via
 * `parameters: { mock: { pets: [...] } }`.
 */
import React from 'react';
import { getMockState } from './state';
import type { Pet } from '../../src/types/database';

interface PetContextValue {
  pets: Pet[];
  currentPet: Pet | null;
  currentPetId: string | null;
  loading: boolean;
  error: string | null;
  setCurrentPetId: (id: string) => void;
  refresh: () => Promise<void>;
}

export function PetProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePets(): PetContextValue {
  const state = getMockState();
  const pets = state.pets;
  const currentPet = pets[0] ?? null;
  return {
    pets,
    currentPet,
    currentPetId: currentPet?.id ?? null,
    loading: false,
    error: null,
    setCurrentPetId: () => {},
    refresh: async () => {},
  };
}
