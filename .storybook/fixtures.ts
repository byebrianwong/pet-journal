import type { Pet, PetShare, TimelineEvent, Medication, UserProfile } from '../src/types/database';

export const fixtureUsers: Record<string, UserProfile> = {
  brian: {
    id: 'user-brian',
    display_name: 'Brian',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  sarah: {
    id: 'user-sarah',
    display_name: 'Sarah',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  mom: {
    id: 'user-mom',
    display_name: 'Mom',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
  },
};

export const fixturePet: Pet = {
  id: 'pet-buddy',
  name: 'Buddy',
  species: 'dog',
  breed: 'Golden Retriever',
  birthday: '2022-03-15',
  weight_lbs: 64,
  photo_url: null,
  created_by: 'user-brian',
  created_at: '2024-01-01T00:00:00Z',
};

export const fixtureShares: (PetShare & {
  user: { display_name: string; avatar_url: string | null };
})[] = [
  {
    id: 'share-1',
    pet_id: 'pet-buddy',
    user_id: 'user-brian',
    role: 'owner',
    invited_at: '2024-01-01T00:00:00Z',
    accepted_at: '2024-01-01T00:00:00Z',
    user: { display_name: 'Brian', avatar_url: null },
  },
  {
    id: 'share-2',
    pet_id: 'pet-buddy',
    user_id: 'user-sarah',
    role: 'editor',
    invited_at: '2024-01-02T00:00:00Z',
    accepted_at: '2024-01-02T00:00:00Z',
    user: { display_name: 'Sarah', avatar_url: null },
  },
];

const today = new Date();
const isoDaysAgo = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const fixtureMemoryEvent: TimelineEvent = {
  id: 'evt-mem-1',
  pet_id: 'pet-buddy',
  user_id: 'user-sarah',
  event_type: 'memory',
  event_date: isoDaysAgo(0),
  title: 'Beach day!',
  notes: 'Buddy chased seagulls for an hour and refused to come out of the water.',
  photo_url: 'https://placehold.co/600x400/c4a882/fff?text=Buddy+at+the+beach',
  metadata: {},
  created_at: isoDaysAgo(0),
  updated_at: isoDaysAgo(0),
  user: fixtureUsers.sarah,
};

export const fixtureMemoryEventNoPhoto: TimelineEvent = {
  ...fixtureMemoryEvent,
  id: 'evt-mem-2',
  title: 'New trick learned',
  notes: 'Finally got him to roll over on command. Took six months of patience.',
  photo_url: null,
};

export const fixtureVetVisitFull: TimelineEvent = {
  id: 'evt-vet-1',
  pet_id: 'pet-buddy',
  user_id: 'user-brian',
  event_type: 'vet_visit',
  event_date: isoDaysAgo(7),
  title: 'Annual checkup',
  notes: 'Healthy overall. Vet recommends switching to senior food in a year.',
  photo_url: null,
  metadata: {
    clinic_name: 'Maple Vet Clinic',
    vet_name: 'Smith',
    diagnoses: ['Healthy', 'Mild tartar'],
    medications_prescribed: ['Apoquel 16mg', 'Heartgard'],
    cost_total: 287.5,
  },
  created_at: isoDaysAgo(7),
  updated_at: isoDaysAgo(7),
  user: fixtureUsers.brian,
};

export const fixtureVetVisitMinimal: TimelineEvent = {
  id: 'evt-vet-2',
  pet_id: 'pet-buddy',
  user_id: 'user-brian',
  event_type: 'vet_visit',
  event_date: isoDaysAgo(30),
  title: null,
  notes: null,
  photo_url: null,
  metadata: {},
  created_at: isoDaysAgo(30),
  updated_at: isoDaysAgo(30),
  user: fixtureUsers.brian,
};

export const fixtureFiActivityHigh: TimelineEvent = {
  id: 'evt-fi-1',
  pet_id: 'pet-buddy',
  user_id: 'user-brian',
  event_type: 'fi_activity',
  event_date: isoDaysAgo(0),
  title: "Today's Activity",
  notes: null,
  photo_url: null,
  metadata: {
    steps: 12420,
    distance_miles: 3.7,
    rest_hours: 14,
    goal_pct: 124,
  },
  created_at: isoDaysAgo(0),
  updated_at: isoDaysAgo(0),
  user: fixtureUsers.brian,
};

export const fixtureFiActivityLow: TimelineEvent = {
  ...fixtureFiActivityHigh,
  id: 'evt-fi-2',
  metadata: {
    steps: 2104,
    distance_miles: 0.6,
    rest_hours: 19,
    goal_pct: 21,
  },
};

export const fixtureMedLog: TimelineEvent = {
  id: 'evt-med-1',
  pet_id: 'pet-buddy',
  user_id: 'user-sarah',
  event_type: 'medication_log',
  event_date: isoDaysAgo(0),
  title: 'Apoquel',
  notes: null,
  photo_url: null,
  metadata: { medication_id: 'med-1', dosage: '16mg' },
  created_at: isoDaysAgo(0),
  updated_at: isoDaysAgo(0),
  user: fixtureUsers.sarah,
};

export const fixtureMedications: Medication[] = [
  {
    id: 'med-1',
    pet_id: 'pet-buddy',
    name: 'Apoquel',
    dosage: '16mg',
    frequency: 'daily',
    time_of_day: '08:00',
    start_date: '2026-04-01',
    end_date: null,
    created_by: 'user-brian',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 'med-2',
    pet_id: 'pet-buddy',
    name: 'Heartgard',
    dosage: '1 chew',
    frequency: 'monthly',
    time_of_day: '20:00',
    start_date: '2026-01-15',
    end_date: null,
    created_by: 'user-brian',
    created_at: '2026-01-15T00:00:00Z',
  },
];
