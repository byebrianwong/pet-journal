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

export const NoPetsFirstRun: Story = {
  parameters: {
    mock: {
      pets: [],
      shares: [],
      events: [],
      medications: [],
    },
    docs: {
      description: {
        story:
          'No pets yet — first-run experience. The screen renders an inline "Add a Pet" CTA instead of redirecting to AddPet (which used to destroy the back stack).',
      },
    },
  },
};

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

export const OverdueMedSuggestion: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      // No medication_log events for Heartgard recently → suggestion fires
      events: [],
      medications: [
        // Heartgard is monthly + start_date 40 days ago — should trigger
        // "💊 Heartgard due today" suggestion above the feed.
        {
          ...fixtureMedications[1],
          start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
    },
    docs: {
      description: {
        story:
          'A monthly medication whose last log was >30 days ago. The smart-suggestion engine surfaces it as a SuggestionCard at the top of the feed, separate from the daily reminder list.',
      },
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

const yearsAgo = (years: number, monthOffset = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth());
  d.setDate(d.getDate() - monthOffset);
  return d.toISOString();
};

export const Throwback: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [fixtureMemoryEvent],
      throwbacks: [
        {
          ...fixtureMemoryEvent,
          id: 'tb-1',
          title: 'First beach trip!',
          notes: 'Buddy was scared of the waves at first, then refused to come out.',
          event_date: yearsAgo(1),
          created_at: yearsAgo(1),
          updated_at: yearsAgo(1),
        },
      ],
      medications: [],
    },
    docs: {
      description: {
        story: '"On this day, 1 year ago" — a single throwback memory injected above the Recently section.',
      },
    },
  },
};

export const ThrowbackMultipleYears: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [fixtureMemoryEvent],
      throwbacks: [
        {
          ...fixtureMemoryEvent,
          id: 'tb-1',
          title: 'First beach trip',
          notes: 'Refused to come out of the water.',
          event_date: yearsAgo(1),
        },
        {
          ...fixtureVetVisitFull,
          id: 'tb-2',
          title: 'Puppy checkup',
          event_date: yearsAgo(2),
        },
      ],
      medications: [],
    },
    docs: {
      description: {
        story: 'Throwbacks from multiple past years. Header reads simply "On this day".',
      },
    },
  },
};
