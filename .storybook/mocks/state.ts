import type { Pet, PetShare, TimelineEvent, Medication } from '../../src/types/database';

export interface MockState {
  pets: Pet[];
  shares: (PetShare & { user: { display_name: string; avatar_url: string | null } })[];
  events: TimelineEvent[];
  throwbacks: TimelineEvent[];
  medications: Medication[];
  fiConnected: boolean;
  fiSteps: number | null;
  authError: string | null;
  authLoading: boolean;
}

export const defaultMockState: MockState = {
  pets: [],
  shares: [],
  events: [],
  throwbacks: [],
  medications: [],
  fiConnected: false,
  fiSteps: null,
  authError: null,
  authLoading: false,
};

// Stash on globalThis so every module instance (preview, services, hooks)
// reads the same reference even if Vite ends up loading state.ts twice.
const KEY = '__petJournalMockState__';

declare global {
  // eslint-disable-next-line no-var
  var __petJournalMockState__: MockState | undefined;
}

if (typeof globalThis !== 'undefined' && !globalThis[KEY as keyof typeof globalThis]) {
  (globalThis as any)[KEY] = { ...defaultMockState };
}

export function __setMockState(next: MockState) {
  (globalThis as any)[KEY] = next;
}

export function getMockState(): MockState {
  return ((globalThis as any)[KEY] as MockState) ?? { ...defaultMockState };
}
