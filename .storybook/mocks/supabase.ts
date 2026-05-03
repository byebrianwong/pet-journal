// Mock supabase client for Storybook. Provides just enough surface for
// AuthScreen + the screens that touch supabase directly (e.g. MedicationsScreen
// uses supabase.from('medications').update).

import { getMockState } from './state';

const noop = () => {};

const fakeBuilder = {
  select: () => fakeBuilder,
  insert: () => fakeBuilder,
  update: () => fakeBuilder,
  delete: () => fakeBuilder,
  eq: () => fakeBuilder,
  is: () => fakeBuilder,
  order: () => fakeBuilder,
  limit: () => fakeBuilder,
  single: async () => ({ data: null, error: null }),
  maybeSingle: async () => ({ data: null, error: null }),
  then: (resolve: any) => resolve({ data: [], error: null }),
};

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: { user: { id: 'mock-user-1' } } } };
    },
    async getUser() {
      return { data: { user: { id: 'mock-user-1' } } };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe: noop } } };
    },
    async signInWithPassword() {
      const err = getMockState().authError;
      return { error: err ? { message: err } : null };
    },
    async signUp() {
      const err = getMockState().authError;
      return { error: err ? { message: err } : null };
    },
    async signOut() {
      return {};
    },
  },
  from() {
    return fakeBuilder;
  },
  channel() {
    return {
      on: () => ({
        subscribe: () => ({ unsubscribe: noop }),
      }),
    };
  },
  removeChannel: noop,
};
