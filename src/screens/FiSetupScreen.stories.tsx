import type { Meta, StoryObj } from '@storybook/react';
import { FiSetupScreen } from './FiSetupScreen';
import { fixturePet } from '../../.storybook/fixtures';

const noopNav = {
  navigate: () => {},
  goBack: () => {},
} as any;

const meta: Meta<typeof FiSetupScreen> = {
  title: 'Screens/FiSetupScreen',
  component: FiSetupScreen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof FiSetupScreen>;

export const Disconnected: Story = {
  args: {
    navigation: noopNav,
    route: { params: { petId: fixturePet.id } },
  } as any,
  parameters: {
    mock: {
      pets: [fixturePet],
      fiConnected: false,
    },
    docs: {
      description: {
        story: 'First-time entry — no Fi account connected. Shows the login form.',
      },
    },
  },
};

export const ConnectedNeedsPicker: Story = {
  args: {
    navigation: noopNav,
    route: { params: { petId: fixturePet.id } },
  } as any,
  parameters: {
    mock: {
      pets: [fixturePet],
      fiConnected: true,
    },
    docs: {
      description: {
        story:
          'Fi account is connected but this pet has no fi_pet_id yet. User picks which Fi pet maps to Buddy.',
      },
    },
  },
};

export const Linked: Story = {
  args: {
    navigation: noopNav,
    route: { params: { petId: fixturePet.id } },
  } as any,
  parameters: {
    mock: {
      pets: [{ ...fixturePet, fi_pet_id: 'fi-1' }],
      fiConnected: true,
    },
    docs: {
      description: {
        story: 'Buddy is linked to Fi pet "Buddy" (fi-1). Shows the connected/linked state with unlink + disconnect options.',
      },
    },
  },
};
