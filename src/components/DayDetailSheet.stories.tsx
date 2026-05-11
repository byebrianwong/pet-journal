import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DayDetailSheet } from './DayDetailSheet';
import {
  fixtureMemoryEvent,
  fixtureVetVisitFull,
  fixtureFiActivityHigh,
} from '../../.storybook/fixtures';

const meta: Meta<typeof DayDetailSheet> = {
  title: 'Components/DayDetailSheet',
  component: DayDetailSheet,
  parameters: { layout: 'fullscreen' },
  args: { onClose: fn() },
};
export default meta;

type Story = StoryObj<typeof DayDetailSheet>;

const today = new Date();

export const SingleEntry: Story = {
  args: {
    date: today,
    events: [fixtureMemoryEvent],
  },
};

export const FullDay: Story = {
  args: {
    date: today,
    events: [
      fixtureFiActivityHigh,
      fixtureMemoryEvent,
      fixtureVetVisitFull,
    ],
  },
};

export const ToughDay: Story = {
  args: {
    date: today,
    events: [
      {
        ...fixtureMemoryEvent,
        title: 'Place training · 1 hour',
        notes: 'Around family. One reaction at 3pm when the doorbell rang.',
        metadata: {
          entry_kind: 'training',
          tough_moment: true,
          duration: '60 min',
          around: ['family'],
          reaction_count: 1,
        } as any,
      },
    ],
  },
};

export const EmptyDay: Story = {
  args: {
    date: today,
    events: [],
  },
};
