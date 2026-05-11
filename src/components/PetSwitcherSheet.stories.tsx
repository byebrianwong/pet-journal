import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { PetSwitcherSheet } from './PetSwitcherSheet';
import { fixturePet } from '../../.storybook/fixtures';

const meta: Meta<typeof PetSwitcherSheet> = {
  title: 'Components/PetSwitcherSheet',
  component: PetSwitcherSheet,
  parameters: { layout: 'fullscreen' },
  args: {
    visible: true,
    onSelect: fn(),
    onAddPet: fn(),
    onClose: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof PetSwitcherSheet>;

export const SinglePet: Story = {
  args: {
    pets: [fixturePet],
    currentPetId: fixturePet.id,
  },
};

export const TwoPets: Story = {
  args: {
    pets: [
      fixturePet,
      { ...fixturePet, id: 'pet-2', name: 'Marble', breed: 'Tabby', weight_lbs: 12, species: 'cat' },
    ],
    currentPetId: fixturePet.id,
  },
};

export const ManyPets: Story = {
  args: {
    pets: [
      fixturePet,
      { ...fixturePet, id: 'pet-2', name: 'Marble', breed: 'Tabby', weight_lbs: 12, species: 'cat' },
      { ...fixturePet, id: 'pet-3', name: 'Pip', breed: 'Mini Aussie', weight_lbs: 22 },
      { ...fixturePet, id: 'pet-4', name: 'Luna', breed: 'Husky', weight_lbs: 55 },
    ],
    currentPetId: 'pet-3',
  },
};
