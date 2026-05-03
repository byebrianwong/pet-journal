export type EventType = 'vet_visit' | 'memory' | 'fi_activity' | 'medication_log';
export type ShareRole = 'owner' | 'editor';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthday: string | null;
  weight_lbs: number | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PetShare {
  id: string;
  pet_id: string;
  user_id: string;
  role: ShareRole;
  invited_at: string;
  accepted_at: string | null;
}

export interface VetVisitMetadata {
  clinic_name?: string;
  vet_name?: string;
  diagnoses?: string[];
  medications_prescribed?: string[];
  cost_total?: number;
  receipt_photo_url?: string;
}

export interface FiActivityMetadata {
  steps?: number;
  distance_miles?: number;
  rest_hours?: number;
  goal_pct?: number;
  location_summary?: string;
}

export interface MedicationLogMetadata {
  medication_id?: string;
  dosage?: string;
}

export type EventMetadata = VetVisitMetadata | FiActivityMetadata | MedicationLogMetadata | Record<string, unknown>;

export interface TimelineEvent {
  id: string;
  pet_id: string;
  user_id: string;
  event_type: EventType;
  event_date: string;
  title: string | null;
  notes: string | null;
  photo_url: string | null;
  metadata: EventMetadata;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: UserProfile;
}

export interface Medication {
  id: string;
  pet_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
}
