import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication } from '../types/database';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleMedicationReminders(medications: Medication[]): Promise<void> {
  // Cancel all existing medication reminders first
  await cancelAllMedicationReminders();

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  for (const med of medications) {
    if (med.end_date && new Date(med.end_date) < new Date()) continue;
    if (!med.time_of_day) continue;

    const [hours, minutes] = med.time_of_day.split(':').map(Number);

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 ${med.name}`,
        body: `Time for ${med.name} — ${med.dosage}`,
        data: { medicationId: med.id, type: 'medication_reminder' },
        sound: true,
      },
      trigger,
      identifier: `med-${med.id}`,
    });
  }
}

export async function cancelAllMedicationReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith('med-')) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter(n => n.identifier.startsWith('med-'));
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
