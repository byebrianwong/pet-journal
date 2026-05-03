// Stub expo-notifications for Vite/web stories. No-op for everything.
const noopRemove = { remove: () => {} };

export const SchedulableTriggerInputTypes = { DAILY: 'daily' } as const;

export type NotificationTriggerInput = unknown;
export type NotificationRequest = { identifier: string };
export type NotificationResponse = { notification: { request: { content: { data: any } } } };
export type EventSubscription = { remove: () => void };

export function setNotificationHandler(_h: any): void {}
export async function getPermissionsAsync() { return { status: 'granted' as const }; }
export async function requestPermissionsAsync() { return { status: 'granted' as const }; }
export async function scheduleNotificationAsync(_n: any): Promise<string> { return 'noop'; }
export async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> { return []; }
export async function cancelScheduledNotificationAsync(_id: string): Promise<void> {}
export function addNotificationResponseReceivedListener(_h: any): EventSubscription { return noopRemove; }

export default {};
