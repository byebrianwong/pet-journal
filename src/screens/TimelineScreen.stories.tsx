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
  fixtureOverdueMonthlyMed,
  fixtureOverdueWeeklyMed,
  fixturePhotoCluster,
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
      events: [],
      medications: [fixtureOverdueMonthlyMed],
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

// =============================================================================
// Data-scenario stories
// -----------------------------------------------------------------------------
// Use these as a reference for testing data-driven UI: each story declares the
// minimum mock data needed to trigger a specific code path. Copy and adjust.
// See `.storybook/mocks/state.ts` for the full MockState shape.
// =============================================================================

export const PhotoClusterSuggestion: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [],
      medications: [],
      photoClusters: [fixturePhotoCluster],
    },
    docs: {
      description: {
        story:
          'Camera-roll cluster detected ("4 photos from Lake Park"). Suggestion card uses the first asset URI as its thumbnail. Mobile-only in production; this story drives it via the camera-roll mock so the UI is reviewable on web.',
      },
    },
  },
};

export const StackedSuggestions: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [],
      medications: [fixtureOverdueWeeklyMed],
      photoClusters: [fixturePhotoCluster],
    },
    docs: {
      description: {
        story:
          'Two suggestions surface at once: photo cluster (photo_cluster kind) and an overdue weekly med (medication_due kind). Verifies the suggestion lane handles N>1 cards in priority order.',
      },
    },
  },
};

export const MixedRecurringMedications: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      events: [
        // Daily Apoquel already logged earlier today — should NOT fire med_due.
        {
          ...fixtureMedLog,
          id: 'evt-log-today-apo',
          metadata: { medication_id: 'med-1', dosage: '16mg' },
        },
      ],
      medications: [
        fixtureMedications[0],     // daily Apoquel (reminder card)
        fixtureOverdueWeeklyMed,   // weekly Cytopoint, last given 10 days ago (med_due)
        fixtureOverdueMonthlyMed,  // monthly Heartgard, last given 40 days ago (med_due)
      ],
    },
    docs: {
      description: {
        story:
          'Three medications at different frequencies: a daily reminder (already logged), a weekly that is overdue, and a monthly that is overdue. Tests that daily meds render as reminders, non-daily overdue meds render as suggestions, and a today-logged daily does not double-suggest.',
      },
    },
  },
};

export const NudgeWithRecentHistory: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: [fixtureShares[0]],
      // No events from today — empty_day_nudge should fire.
      events: [
        { ...fixtureMemoryEvent, id: 'evt-yest-1', event_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { ...fixtureVetVisitFull, id: 'evt-recent-vet', event_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      medications: [],
    },
    docs: {
      description: {
        story:
          'Empty today + recent activity in the last few days. The "How was today?" nudge appears above a Recently section. Useful regression check for the empty-day-nudge rule that used to require ≥2 past events.',
      },
    },
  },
};

export const FiConnectedActiveDay: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: fixtureShares,
      events: [
        fixtureFiActivityHigh,  // today's Fi activity card
        fixtureMemoryEvent,
        fixtureMedLog,
      ],
      medications: [fixtureMedications[0]],
      fiConnected: true,
      fiSteps: 12420,
    },
    docs: {
      description: {
        story:
          "Fi connected and today's activity card rendered alongside a memory and a med log. Use this to review Fi step counts and goal-bar rendering without a real collar.",
      },
    },
  },
};

export const KitchenSink: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      shares: fixtureShares,
      events: [
        fixtureFiActivityHigh,
        fixtureMemoryEvent,
        fixtureMedLog,
        fixtureVetVisitFull,
      ],
      throwbacks: [
        {
          ...fixtureMemoryEvent,
          id: 'tb-ks-1',
          title: 'Beach trip last year',
          event_date: monthsAgo(13),
        },
      ],
      medications: [
        fixtureMedications[0],
        fixtureOverdueWeeklyMed,
      ],
      photoClusters: [fixturePhotoCluster],
      fiConnected: true,
      fiSteps: 12420,
    },
    docs: {
      description: {
        story:
          'Everything on at once: photo cluster suggestion, overdue weekly med, daily med reminder, Fi activity card, fresh memory, vet visit, and a throwback. Useful for visual regression of the full feed.',
      },
    },
  },
};
