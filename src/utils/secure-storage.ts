/**
 * Cross-platform key/value store with the same async surface as
 * expo-secure-store. On native (iOS/Android) it delegates to SecureStore
 * (Keychain / Keystore). On web it falls back to localStorage — not a
 * security boundary on web, just a place to keep tokens for the dev preview
 * to work. The web build is a developer-mode reflection of the app, not a
 * shipping target, so the looser guarantee is fine.
 *
 * Why this exists: expo-secure-store's web shim still throws on some calls
 * (e.g. ExpoSecureStore.default.getValueWithKeyAsync is not a function),
 * which crashed any code path that touched it on web. Going through this
 * wrapper makes those call sites work on both platforms.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const hasLocalStorage = (): boolean =>
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as any).localStorage !== 'undefined';

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return hasLocalStorage() ? (globalThis as any).localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (hasLocalStorage()) (globalThis as any).localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (hasLocalStorage()) (globalThis as any).localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
