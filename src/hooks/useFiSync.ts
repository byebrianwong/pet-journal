import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncFiActivity } from '../services/fi-sync';
import { fiCollar } from '../services/fi-collar';

/**
 * Syncs Fi activity when the app comes to foreground.
 * iOS BackgroundFetch is unreliable for side-project apps,
 * so we sync on every foreground event instead. This means
 * data is fresh whenever the user actually looks at the app.
 */
export function useFiSync(petId: string | null) {
  const lastSync = useRef<number>(0);
  const MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 min between syncs

  useEffect(() => {
    if (!petId) return;

    // Sync on mount
    syncIfNeeded(petId);

    // Sync when app returns to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        syncIfNeeded(petId);
      }
    });

    return () => sub.remove();
  }, [petId]);

  async function syncIfNeeded(id: string) {
    const now = Date.now();
    if (now - lastSync.current < MIN_INTERVAL_MS) return;

    const configured = await fiCollar.isConfigured();
    if (!configured) return;

    lastSync.current = now;
    await syncFiActivity(id);
  }
}
