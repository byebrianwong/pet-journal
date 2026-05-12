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

const monthsAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
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
          event_date: monthsAgo(3),
          created_at: monthsAgo(3),
          updated_at: monthsAgo(3),
        },
      ],
      medications: [],
    },
    docs: {
      description: {
        story: 'A single throwback memory from a few months ago, surfaced above Recently.',
      },
    },
  },
};

export const ThrowbackMultiple: Story = {
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
          event_date: monthsAgo(2),
        },
        {
          ...fixtureMemoryEvent,
          id: 'tb-2',
          title: 'Tail Lake hike',
          notes: 'Made a new dog friend at the trailhead.',
          event_date: monthsAgo(7),
          photo_url: null,
        },
        {
          ...fixtureMemoryEvent,
          id: 'tb-3',
          title: 'Snow day',
          notes: 'First snow — confused at first, then ran zoomies for an hour.',
          event_date: monthsAgo(14),
        },
      ],
      medications: [],
    },
    docs: {
      description: {
        story: 'Three throwback memories spanning several months and years. Header reads "Throwback".',
      },
    },
  },
};
