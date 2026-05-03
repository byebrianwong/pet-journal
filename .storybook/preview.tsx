import React from 'react';
import type { Preview } from '@storybook/react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/utils/colors';
import { __setMockState, defaultMockState, type MockState } from './mocks/state';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'pet-journal',
      values: [
        { name: 'pet-journal', value: colors.background },
        { name: 'surface', value: colors.surface },
        { name: 'white', value: '#fff' },
      ],
    },
    layout: 'centered',
  },

  decorators: [
    (Story, context) => {
      // Apply per-story mock state before each render so screens get the right
      // canned data when they call mocked services.
      const mock = (context.parameters.mock ?? {}) as Partial<MockState>;
      __setMockState({ ...defaultMockState, ...mock });

      const isFullPage = context.parameters.layout === 'fullscreen';
      const Wrapper = isFullPage ? FullPageFrame : CardFrame;

      return (
        <SafeAreaProvider initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}>
          <Wrapper>
            <Story />
          </Wrapper>
        </SafeAreaProvider>
      );
    },
  ],
};

// Phone-sized frame for full-page screen stories
function FullPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 390,
        height: 844,
        backgroundColor: colors.background,
        borderRadius: 32,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        borderWidth: 1,
        borderColor: colors.border,
      } as any}
    >
      {children}
    </View>
  );
}

// Padded frame for individual component stories
function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: 16,
        width: 360,
        backgroundColor: colors.background,
      }}
    >
      {children}
    </View>
  );
}

export default preview;
