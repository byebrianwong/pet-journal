import { getMockState } from './state';

export interface FiActivity {
  steps: number;
  distance_miles: number;
  rest_hours: number;
  goal_pct: number;
}

export interface FiPet {
  id: string;
  name: string;
  photo_url: string | null;
}

export const fiCollar = {
  async isConfigured(): Promise<boolean> {
    return getMockState().fiConnected;
  },
  async login(_email: string, _password: string): Promise<boolean> {
    return true;
  },
  async listPets(): Promise<FiPet[]> {
    if (!getMockState().fiConnected) return [];
    return [
      { id: 'fi-1', name: 'Buddy', photo_url: null },
      { id: 'fi-2', name: 'Luna', photo_url: null },
    ];
  },
  async getActivity(_fiPetId: string, _date: string): Promise<FiActivity | null> {
    const { fiConnected, fiSteps } = getMockState();
    if (!fiConnected) return null;
    return {
      steps: fiSteps ?? 8420,
      distance_miles: 2.4,
      rest_hours: 14,
      goal_pct: 92,
    };
  },
  async disconnect(): Promise<void> {},
};
