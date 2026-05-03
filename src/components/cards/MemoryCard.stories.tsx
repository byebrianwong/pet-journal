import type { Meta, StoryObj } from '@storybook/react';
import { MemoryCard } from './MemoryCard';
import {
  fixtureMemoryEvent,
  fixtureMemoryEventNoPhoto,
} from '../../../.storybook/fixtures';

const meta: Meta<typeof MemoryCard> = {
  title: 'Cards/MemoryCard',
  component: MemoryCard,
};
export default meta;

type Story = StoryObj<typeof MemoryCard>;

export const WithPhoto: Story = {
  args: { event: fixtureMemoryEvent },
};

export const NoPhoto: Story = {
  args: { event: fixtureMemoryEventNoPhoto },
};

export const LongNotes: Story = {
  args: {
    event: {
      ...fixtureMemoryEventNoPhoto,
      title: 'First snow',
      notes:
        "Buddy spent twenty minutes pouncing on snowdrifts and emerged completely covered. He was so confused by how it kept melting on his nose. We're going to need to invest in a dog towel.",
    },
  },
};

export const TitleOnly: Story = {
  args: {
    event: {
      ...fixtureMemoryEventNoPhoto,
      title: 'Adopted!',
      notes: null,
    },
  },
};
