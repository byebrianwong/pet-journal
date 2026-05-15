import type { Pet, PetShare, TimelineEvent, Medication } from '../../src/types/database';
import type { PhotoCluster } from '../../src/services/camera-roll';

/**
 * Per-story canned data, stashed on globalThis so every alias-mocked
 * service reads the same reference. Stories declare overrides via
 * `parameters.mock = { ... }` and the preview decorator merges them
 * into this shape before each render.
 *
 * Field reference (set what your story needs, defaults are empty/false):
 *   pets           Pets returned by getMyPets / PetContext.
 *   shares         Pet share rows (controls family-avatar rendering).
 *   events         Timeline events on the home feed.
 *   throwbacks     Events surfaced under the "Throwback" header.
 *   medications    Med list (drives reminders + medication_due suggestion).
 *   photoClusters  Camera-roll clusters (drives photo_cluster suggestion).
 *   fiConnected    Whether the Fi account is configured.
 *   fiSteps        Step count for the Fi connection hint in PetHeader.
 *   authError      Auth-screen error banner text.
 *   authLoading    Auth-screen spinner.
 */
export interface MockState {
  pets: Pet[];
  shares: (PetShare & { user: { display_name: string; avatar_url: string | null } })[];
  events: TimelineEvent[];
  throwbacks: TimelineEvent[];
  medications: Medication[];
  photoClusters: PhotoCluster[];
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
  photoClusters: [],
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
