export async function requestNotificationPermissions(): Promise<boolean> {
  return true;
}

export async function scheduleMedicationReminders(_meds: any[]): Promise<void> {
  // no-op in stories
}

export async function cancelAllMedicationReminders(): Promise<void> {}

export async function getScheduledReminders() {
  return [];
}

export function addNotificationResponseListener() {
  return { remove: () => {} };
}
