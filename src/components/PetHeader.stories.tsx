import type { Meta, StoryObj } from '@storybook/react';
import { PetHeader } from './PetHeader';
import { fixturePet, fixtureShares } from '../../.storybook/fixtures';

const meta: Meta<typeof PetHeader> = {
  title: 'Components/PetHeader',
  component: PetHeader,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof PetHeader>;

export const SoloOwner: Story = {
  args: {
    pet: fixturePet,
    shares: [fixtureShares[0]],
  },
};

export const SharedWithFamily: Story = {
  args: {
    pet: fixturePet,
    shares: fixtureShares,
  },
};

export const FiConnected: Story = {
  args: {
    pet: fixturePet,
    shares: fixtureShares,
    fiStatus: { connected: true, steps: 8420 },
  },
};

export const FiConnectedNoSteps: Story = {
  args: {
    pet: fixturePet,
    shares: [fixtureShares[0]],
    fiStatus: { connected: true },
  },
};

export const MinimalPetData: Story = {
  args: {
    pet: {
      ...fixturePet,
      breed: null,
      weight_lbs: null,
      birthday: null,
    },
    shares: [fixtureShares[0]],
  },
};

export const Puppy: Story = {
  args: {
    pet: {
      ...fixturePet,
      name: 'Pip',
      breed: 'Mini Aussie',
      birthday: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      weight_lbs: 8,
    },
    shares: [fixtureShares[0]],
  },
};
