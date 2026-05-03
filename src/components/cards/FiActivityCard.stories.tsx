import type { Meta, StoryObj } from '@storybook/react';
import { FiActivityCard } from './FiActivityCard';
import {
  fixtureFiActivityHigh,
  fixtureFiActivityLow,
} from '../../../.storybook/fixtures';

const meta: Meta<typeof FiActivityCard> = {
  title: 'Cards/FiActivityCard',
  component: FiActivityCard,
};
export default meta;

type Story = StoryObj<typeof FiActivityCard>;

export const GoalExceeded: Story = {
  args: { event: fixtureFiActivityHigh },
};

export const LazyDay: Story = {
  args: { event: fixtureFiActivityLow },
};

export const NearGoal: Story = {
  args: {
    event: {
      ...fixtureFiActivityHigh,
      metadata: {
        steps: 8420,
        distance_miles: 2.4,
        rest_hours: 16,
        goal_pct: 88,
      },
    },
  },
};

export const NoData: Story = {
  args: {
    event: {
      ...fixtureFiActivityHigh,
      metadata: {},
    },
  },
};
