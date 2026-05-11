/**
 * Owns "which pet is the user currently looking at?" — replaces the
 * hardcoded `pets[0]` reads scattered across Timeline / Profile / Meds
 * with a single source of truth. Persists the choice across launches.
 *
 * Usage:
 *
 *   const { pets, currentPet, setCurrentPetId, refresh } = usePets();
 *
 * Mount <PetProvider> once at the top of the authed app. The provider
 * loads pets from Supabase on mount, restores the last-selected pet id
 * from storage, and re-fetches when the realtime sync triggers `refresh`.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMyPets } from '../services/pets';
import * as storage from '../utils/secure-storage';
import type { Pet } from '../types/database';

const STORAGE_KEY = 'currentPetId';

interface PetContextValue {
  pets: Pet[];
  currentPet: Pet | null;
  currentPetId: string | null;
  loading: boolean;
  error: string | null;
  setCurrentPetId: (id: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentPetId, setCurrentPetIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await getMyPets();
      setPets(list);

      // Decide which pet should be "current". Priority:
      //   1. Stored choice if it still exists in the list
      //   2. First pet
      //   3. null (no pets yet — first-run state)
      const stored = await storage.getItemAsync(STORAGE_KEY);
      const validStored = stored && list.find(p => p.id === stored) ? stored : null;
      const chosen = validStored ?? list[0]?.id ?? null;

      setCurrentPetIdState(chosen);
      // Re-persist if we fell back to first pet — keeps storage in sync.
      if (chosen && chosen !== stored) {
        await storage.setItemAsync(STORAGE_KEY, chosen);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load pets.');
      setPets([]);
      setCurrentPetIdState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setCurrentPetId = useCallback((id: string) => {
    setCurrentPetIdState(id);
    void storage.setItemAsync(STORAGE_KEY, id);
  }, []);

  const currentPet = pets.find(p => p.id === currentPetId) ?? null;

  return (
    <Ctx.Provider
      value={{ pets, currentPet, currentPetId, loading, error, setCurrentPetId, refresh }}
    >
      {children}
    </Ctx.Provider>
  );
}

const FALLBACK: PetContextValue = {
  pets: [],
  currentPet: null,
  currentPetId: null,
  loading: true,
  error: null,
  setCurrentPetId: () => {},
  refresh: async () => {},
};

/**
 * Returns the pet context. Falls back to a safe no-op shape when used
 * outside a PetProvider — keeps Storybook stories and dev hot-reloads
 * working when the provider hasn't mounted yet. The provider IS required
 * for actual functionality; the fallback is just so the tree doesn't
 * crash during transition states.
 */
export function usePets(): PetContextValue {
  return useContext(Ctx) ?? FALLBACK;
}
