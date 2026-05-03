import type { Meta, StoryObj } from '@storybook/react';
import { AuthScreen } from './AuthScreen';

const meta: Meta<typeof AuthScreen> = {
  title: 'Screens/AuthScreen',
  component: AuthScreen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof AuthScreen>;

export const SignIn: Story = {};

export const SignInWithError: Story = {
  parameters: {
    mock: {
      authError: 'Invalid login credentials',
    },
    docs: {
      description: {
        story:
          'Tap "Sign In" with any email/password to see the error toast (mock returns an auth error).',
      },
    },
  },
};
