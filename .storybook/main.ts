import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const root = path.resolve(__dirname, '..');
const mocks = path.resolve(__dirname, './mocks');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  typescript: { check: false, reactDocgen: false },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const react = (await import('@vitejs/plugin-react')).default;

    return mergeConfig(config, {
      plugins: [react()],
      resolve: {
        alias: [
          // react-native → react-native-web (browser-renderable primitives)
          { find: /^react-native$/, replacement: 'react-native-web' },

          // Service mocks: swap real services with canned-data mocks so
          // screens render without a live Supabase / Fi / Anthropic backend.
          // Regex aliases are applied with String.replace, so we anchor with
          // ^ and $ to match the whole specifier (otherwise only the matched
          // substring is replaced).
          { find: /^.*\/services\/supabase$/, replacement: path.join(mocks, 'supabase.ts') },
          { find: /^.*\/services\/pets$/, replacement: path.join(mocks, 'pets.ts') },
          { find: /^.*\/services\/timeline$/, replacement: path.join(mocks, 'timeline.ts') },
          { find: /^.*\/services\/notifications$/, replacement: path.join(mocks, 'notifications.ts') },
          { find: /^.*\/services\/fi-collar$/, replacement: path.join(mocks, 'fi-collar.ts') },
          { find: /^.*\/services\/fi-sync$/, replacement: path.join(mocks, 'fi-sync.ts') },
          { find: /^.*\/services\/sharing$/, replacement: path.join(mocks, 'sharing.ts') },
          { find: /^.*\/services\/receipt-scanner$/, replacement: path.join(mocks, 'receipt-scanner.ts') },
          { find: /^.*\/services\/camera-roll$/, replacement: path.join(mocks, 'camera-roll.ts') },
          { find: /^.*\/hooks\/useFiSync$/, replacement: path.join(mocks, 'useFiSync.ts') },
          { find: /^.*\/hooks\/useRealtimeTimeline$/, replacement: path.join(mocks, 'useRealtimeTimeline.ts') },
          { find: /^.*\/state\/PetContext$/, replacement: path.join(mocks, 'PetContext.tsx') },

          // RN-ecosystem libs that ship native specs with Flow syntax.
          // Replace with View-backed stubs.
          { find: /^react-native-safe-area-context$/, replacement: path.join(mocks, 'react-native-safe-area-context.tsx') },

          // Stub Expo modules whose JS won't parse in Vite (they ship Flow
          // syntax or rely on native modules). Stories don't exercise them.
          { find: /^expo-secure-store$/, replacement: path.join(mocks, 'expo-secure-store.ts') },
          { find: /^expo-notifications$/, replacement: path.join(mocks, 'expo-notifications.ts') },
          { find: /^expo-camera$/, replacement: path.join(mocks, 'expo-camera.ts') },
          { find: /^expo-image-picker$/, replacement: path.join(mocks, 'expo-image-picker.ts') },
          { find: /^expo-file-system$/, replacement: path.join(mocks, 'expo-file-system.ts') },
          { find: /^expo-linking$/, replacement: path.join(mocks, 'expo-linking.ts') },
        ],
        extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
      },
      define: {
        __DEV__: true,
        'process.env.EXPO_OS': JSON.stringify('web'),
      },
      optimizeDeps: {
        // Don't pre-bundle react-native — Vite would try to parse the real
        // package's Flow-typed source. The alias above maps it to
        // react-native-web at import time instead.
        exclude: ['react-native'],
        include: ['react-native-web'],
      },
    });
  },
};

export default config;
