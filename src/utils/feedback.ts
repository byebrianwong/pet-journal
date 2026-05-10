/**
 * Cross-platform user feedback (notify + confirm).
 *
 * react-native's `Alert.alert` is a silent no-op on react-native-web, so any
 * code path that gates work behind an Alert dialog appears broken in the
 * browser. These helpers fall through to native Alert on iOS/Android and to
 * window.alert / window.confirm on web. Same call sites, no platform forks.
 */
import { Alert, Platform } from 'react-native';

/**
 * Show a one-way notice. No callback — fire and forget.
 *
 *   notify('Saved!', 'Buddy added to your pets.');
 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    } else {
      // SSR / non-DOM web context (tests, server). Log so it's visible somewhere.
      console.warn('[notify]', title, message ?? '');
    }
    return;
  }
  Alert.alert(title, message);
}

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Show a yes/no confirmation. Resolves through the supplied callbacks rather
 * than a Promise so call sites match Alert.alert ergonomics.
 *
 *   confirm('Sign out?', 'You can always sign back in.', {
 *     destructive: true,
 *     confirmText: 'Sign Out',
 *     onConfirm: () => supabase.auth.signOut(),
 *   });
 */
export function confirm(title: string, message: string, options: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) {
        void options.onConfirm();
      } else {
        options.onCancel?.();
      }
      return;
    }
    // Fallback: assume confirm if no window.confirm available.
    void options.onConfirm();
    return;
  }

  Alert.alert(title, message, [
    {
      text: options.cancelText ?? 'Cancel',
      style: 'cancel',
      onPress: options.onCancel,
    },
    {
      text: options.confirmText ?? 'OK',
      style: options.destructive ? 'destructive' : 'default',
      onPress: () => {
        void options.onConfirm();
      },
    },
  ]);
}
