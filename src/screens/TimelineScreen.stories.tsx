import type { Meta, StoryObj } from '@storybook/react';
import { TimelineScreen } from './TimelineScreen';
import {
  fixturePet,
  fixtureShares,
  fixtureMemoryEvent,
  fixtureMemoryEventNoPhoto,
  fixtureVetVisitFull,
  fixtureFiActivityHigh,
  fixtureMedLog,
  fixtureMedications,
} from '../../.storybook/fixtures';

const noopNav = {
  navigate: () => {},
  replace: () => {},
  goBack: () => {},
  push: () => {},
} as any;

const meta: Meta<typeof TimelineScreen> = {
  title: 'Screens/TimelineScreen',
  component: TimelineScreen,
  parameters: { layout: 'fullscreen' },
  args: { navigation: noopNav } as any,
};
export default meta;

type Story = StoryObj<typeof TimelineScreen>;

export const EmptyTimeline: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [],
      medications: [],
    },
  },
};

export const ActiveDay: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: fixtureShares,
      events: [
        fixtureFiActivityHigh,
        fixtureMemoryEvent,
        fixtureMedLog,
        fixtureVetVisitFull,
        fixtureMemoryEventNoPhoto,
      ],
      medications: fixtureMedications,
      fiConnected: true,
      fiSteps: 12420,
    },
  },
};

export const RemindersOnly: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [],
      medications: fixtureMedications,
    },
  },
};

export const HistoryNoFi: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [
        fixtureMemoryEvent,
        fixtureVetVisitFull,
        fixtureMedLog,
        fixtureMemoryEventNoPhoto,
      ],
      medications: [],
    },
  },
};
