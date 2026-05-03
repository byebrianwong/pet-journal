import type { Meta, StoryObj } from '@storybook/react';
import { MedicationLogCard } from './MedicationLogCard';
import { fixtureMedLog } from '../../../.storybook/fixtures';

const meta: Meta<typeof MedicationLogCard> = {
  title: 'Cards/MedicationLogCard',
  component: MedicationLogCard,
};
export default meta;

type Story = StoryObj<typeof MedicationLogCard>;

export const WithDosage: Story = {
  args: { event: fixtureMedLog },
};

export const NoDosage: Story = {
  args: {
    event: {
      ...fixtureMedLog,
      title: 'Heartgard',
      metadata: { medication_id: 'med-2' },
    },
  },
};

export const UntitledFallback: Story = {
  args: {
    event: {
      ...fixtureMedLog,
      title: null,
      metadata: {},
    },
  },
};
