/**
 * Medication reminder scheduling — local notifications only.
 *
 * Expo Go SDK 53+ removed Android remote push functionality, and importing
 * expo-notifications eagerly + calling setNotificationHandler at module
 * load crashes the app at boot in Expo Go. We only use local scheduled
 * notifications (no remote push), but the warning still fires.
 *
 * Strategy: lazy-initialize the module behind a try/catch. If the import
 * or init throws, every function in this file silently no-ops so the
 * rest of the app keeps working. Real notifications fire in dev builds
 * and production where the module loads cleanly.
 */
import type { Medication } from '../types/database';

type NotifModule = typeof import('expo-notifications');

let _notif: NotifModule | null = null;
let _initAttempted = false;

function getNotif(): NotifModule | null {
  if (_initAttempted) return _notif;
  _initAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const N: NotifModule = require('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    _notif = N;
    return N;
  } catch (err) {
    console.warn(
      '[notifications] expo-notifications unavailable in this runtime — reminders disabled. ' +
      'This is expected in Expo Go SDK 53+; build a dev client to enable.',
      err,
    );
    _notif = null;
    return null;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = getNotif();
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleMedicationReminders(medications: Medication[]): Promise<void> {
  const N = getNotif();
  if (!N) return;
  try {
    await cancelAllMedicationReminders();
    const ok = await requestNotificationPermissions();
    if (!ok) return;

    for (const med of medications) {
      if (med.end_date && new Date(med.end_date) < new Date()) continue;
      if (!med.time_of_day) continue;

      const [hours, minutes] = med.time_of_day.split(':').map(Number);

      await N.scheduleNotificationAsync({
        content: {
          title: `💊 ${med.name}`,
          body: `Time for ${med.name} — ${med.dosage}`,
          data: { medicationId: med.id, type: 'medication_reminder' },
          sound: true,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
        identifier: `med-${med.id}`,
      });
    }
  } catch (err) {
    console.warn('[notifications] schedule failed', err);
  }
}

export async function cancelAllMedicationReminders(): Promise<void> {
  const N = getNotif();
  if (!N) return;
  try {
    const scheduled = await N.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith('med-')) {
        await N.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    // ignore — best effort cleanup
  }
}

export async function getScheduledReminders(): Promise<any[]> {
  const N = getNotif();
  if (!N) return [];
  try {
    const all = await N.getAllScheduledNotificationsAsync();
    return all.filter((n: any) => n.identifier.startsWith('med-'));
  } catch {
    return [];
  }
}

export function addNotificationResponseListener(
  handler: (response: any) => void,
): { remove: () => void } {
  const N = getNotif();
  if (!N) return { remove: () => {} };
  try {
    return N.addNotificationResponseReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}
