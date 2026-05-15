import type { Meta, StoryObj } from '@storybook/react';
import { MedicationsScreen } from './MedicationsScreen';
import { fixturePet, fixtureMedications } from '../../.storybook/fixtures';

const meta: Meta<typeof MedicationsScreen> = {
  title: 'Screens/MedicationsScreen',
  component: MedicationsScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    route: { params: { petId: 'pet-buddy' } },
    navigation: { navigate: () => {}, goBack: () => {} },
  } as any,
};
export default meta;

type Story = StoryObj<typeof MedicationsScreen>;

// Day offset helper for log events relative to "today".
const daysAgo = (days: number, hour = 8) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const makeLog = (medId: string, daysOffset: number, name = 'Med') => ({
  id: `log-${medId}-${daysOffset}`,
  pet_id: 'pet-buddy',
  user_id: 'user-brian',
  event_type: 'memory' as any,
  event_date: daysAgo(daysOffset),
  title: name,
  notes: null,
  photo_url: null,
  metadata: { medication_id: medId, dosage: '16mg' },
  created_at: daysAgo(daysOffset),
  updated_at: daysAgo(daysOffset),
});

// Override the event_type for medication_log entries — fixture helper above
// uses `as any` to satisfy TS without exporting EventType.
const medLog = (medId: string, daysOffset: number, name?: string) => ({
  ...makeLog(medId, daysOffset, name),
  event_type: 'medication_log' as const,
});

export const Empty: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      medications: [],
    },
  },
};

export const WithMedications: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      medications: fixtureMedications,
      events: [
        // Apoquel logged for the past 14 days
        ...Array.from({ length: 14 }, (_, i) => medLog('med-1', i, 'Apoquel')),
        // Heartgard given roughly a month ago
        medLog('med-2', 28, 'Heartgard'),
      ],
    },
    docs: {
      description: {
        story:
          'Active daily Apoquel + monthly Heartgard. Calendar Month view should show consistent blue dots for Apoquel and a single amber dot on the day Heartgard was given.',
      },
    },
  },
};

export const ManyMedications: Story = {
  args: { route: { params: { petId: 'pet-buddy' } } } as any,
  parameters: {
    mock: {
      pets: [fixturePet],
      medications: [
        ...fixtureMedications,
        {
          id: 'med-3',
          pet_id: 'pet-buddy',
          name: 'Cosequin',
          dosage: '1 chew',
          frequency: 'twice daily',
          time_of_day: '08:00',
          start_date: '2026-03-01',
          end_date: null,
          created_by: 'user-brian',
          created_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'med-4',
          pet_id: 'pet-buddy',
          name: 'Bravecto',
          dosage: '1000mg chew',
          frequency: 'every 3 months',
          time_of_day: null,
          start_date: '2026-01-01',
          end_date: null,
          created_by: 'user-brian',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      events: [
        ...Array.from({ length: 14 }, (_, i) => medLog('med-1', i, 'Apoquel')),
        medLog('med-2', 28, 'Heartgard'),
        medLog('med-4', 88, 'Bravecto'),
      ],
    },
    docs: {
      description: {
        story:
          'Stress test: daily + monthly + twice-daily + quarterly (every 3 months). The 90-day Bravecto exercises the outlier case the user flagged.',
      },
    },
  },
};

export const OverdueMonthly: Story = {
  parameters: {
    mock: {
      pets: [fixturePet],
      medications: [
        {
          ...fixtureMedications[1],
          start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
      events: [], // never logged
    },
    docs: {
      description: {
        story:
          'Monthly med started 40 days ago, never logged. Next-dose countdown should read "Overdue" with the X-days-late subtitle in terracotta.',
      },
    },
  },
};
