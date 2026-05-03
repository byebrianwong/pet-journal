import type { Meta, StoryObj } from '@storybook/react';
import { PetProfileScreen } from './PetProfileScreen';
import { fixturePet, fixtureShares } from '../../.storybook/fixtures';

const noopNav = {
  navigate: () => {},
  goBack: () => {},
} as any;

const meta: Meta<typeof PetProfileScreen> = {
  title: 'Screens/PetProfileScreen',
  component: PetProfileScreen,
  parameters: { layout: 'fullscreen' },
  args: { navigation: noopNav } as any,
};
export default meta;

type Story = StoryObj<typeof PetProfileScreen>;

export const WithPet: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: fixtureShares,
    },
  },
};

export const SoloOwner: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
    },
  },
};

export const NoPetEmpty: Story = {
  parameters: {
    mock: {
      pets: [],
      shares: [],
    },
  },
};
