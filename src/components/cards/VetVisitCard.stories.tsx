import type { Meta, StoryObj } from '@storybook/react';
import { VetVisitCard } from './VetVisitCard';
import {
  fixtureVetVisitFull,
  fixtureVetVisitMinimal,
} from '../../../.storybook/fixtures';

const meta: Meta<typeof VetVisitCard> = {
  title: 'Cards/VetVisitCard',
  component: VetVisitCard,
};
export default meta;

type Story = StoryObj<typeof VetVisitCard>;

export const FullData: Story = {
  args: { event: fixtureVetVisitFull },
};

export const Minimal: Story = {
  args: { event: fixtureVetVisitMinimal },
};

export const DiagnosesOnly: Story = {
  args: {
    event: {
      ...fixtureVetVisitFull,
      title: 'Ear infection',
      notes: 'Started with head shaking last week. Drops twice daily for 10 days.',
      metadata: {
        clinic_name: 'Maple Vet Clinic',
        diagnoses: ['Otitis externa'],
        medications_prescribed: [],
        cost_total: undefined,
      },
    },
  },
};

export const ManyTags: Story = {
  args: {
    event: {
      ...fixtureVetVisitFull,
      title: 'Wellness + dental',
      metadata: {
        clinic_name: 'Maple Vet Clinic',
        vet_name: 'Smith',
        diagnoses: ['Healthy', 'Mild tartar', 'Slight ear redness'],
        medications_prescribed: [
          'Apoquel 16mg',
          'Heartgard',
          'Bravecto',
          'Ear drops',
        ],
        cost_total: 542.0,
      },
    },
  },
};

export const NoCost: Story = {
  args: {
    event: {
      ...fixtureVetVisitFull,
      metadata: {
        ...fixtureVetVisitFull.metadata,
        cost_total: undefined,
      },
    },
  },
};
