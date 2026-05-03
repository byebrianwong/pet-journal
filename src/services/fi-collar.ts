import * as SecureStore from 'expo-secure-store';

const FI_API_BASE = 'https://app.tryfi.com/api';
const FI_TOKEN_KEY = 'fi_session_token';
const FI_CREDS_KEY = 'fi_credentials';

export interface FiActivity {
  steps: number;
  distance_miles: number;
  rest_hours: number;
  goal_pct: number;
}

export interface FiCollarService {
  isConfigured(): Promise<boolean>;
  login(email: string, password: string): Promise<boolean>;
  getActivity(petId: string, date: string): Promise<FiActivity | null>;
  disconnect(): Promise<void>;
}

/**
 * Fi Collar adapter. All Fi API calls go through this interface
 * so a future official API or alternative tracker (Whistle, Halo)
 * can be swapped in without touching the rest of the codebase.
 *
 * Endpoints ported from pytryfi (github.com/sbabcock23/pytryfi).
 */
export const fiCollar: FiCollarService = {
  async isConfigured(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(FI_TOKEN_KEY);
    return token !== null;
  },

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${FI_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const token = data.sessionId ?? data.token;
      if (!token) return false;

      await SecureStore.setItemAsync(FI_TOKEN_KEY, token);
      // Store credentials for re-auth on 401
      await SecureStore.setItemAsync(FI_CREDS_KEY, JSON.stringify({ email, password }));
      return true;
    } catch {
      return false;
    }
  },

  async getActivity(petId: string, date: string): Promise<FiActivity | null> {
    try {
      const token = await getToken();
      if (!token) return null;

      const response = await fetch(
        `${FI_API_BASE}/pets/${petId}/activity?date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (!refreshed) return null;
        return fiCollar.getActivity(petId, date);
      }

      if (!response.ok) return null;

      const data = await response.json();
      return {
        steps: data.totalSteps ?? 0,
        distance_miles: data.totalDistance ? data.totalDistance / 1609.34 : 0,
        rest_hours: data.totalRest ? data.totalRest / 3600 : 0,
        goal_pct: data.goalProgress ?? 0,
      };
    } catch {
      return null;
    }
  },

  async disconnect(): Promise<void> {
    await SecureStore.deleteItemAsync(FI_TOKEN_KEY);
    await SecureStore.deleteItemAsync(FI_CREDS_KEY);
  },
};

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(FI_TOKEN_KEY);
}

async function refreshToken(): Promise<boolean> {
  const credsJson = await SecureStore.getItemAsync(FI_CREDS_KEY);
  if (!credsJson) return false;

  const { email, password } = JSON.parse(credsJson);
  return fiCollar.login(email, password);
}
