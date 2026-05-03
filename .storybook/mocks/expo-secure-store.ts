// Browser-safe stub of expo-secure-store backed by localStorage so RN code
// that imports it doesn't break under Vite.
const safeStorage = typeof localStorage !== 'undefined' ? localStorage : null;

export async function getItemAsync(key: string): Promise<string | null> {
  return safeStorage?.getItem(key) ?? null;
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  safeStorage?.setItem(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  safeStorage?.removeItem(key);
}
