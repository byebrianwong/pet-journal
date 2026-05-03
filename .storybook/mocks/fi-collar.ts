import { getMockState } from './state';

export interface FiActivity {
  steps: number;
  distance_miles: number;
  rest_hours: number;
  goal_pct: number;
}

export const fiCollar = {
  async isConfigured(): Promise<boolean> {
    return getMockState().fiConnected;
  },
  async login(_email: string, _password: string): Promise<boolean> {
    return true;
  },
  async getActivity(_petId: string, _date: string): Promise<FiActivity | null> {
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
