import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MedicationReminderCard } from './MedicationReminderCard';
import { fixtureMedications } from '../../../.storybook/fixtures';

const meta: Meta<typeof MedicationReminderCard> = {
  title: 'Cards/MedicationReminderCard',
  component: MedicationReminderCard,
  args: { onMarkDone: fn() },
};
export default meta;

type Story = StoryObj<typeof MedicationReminderCard>;

export const MorningDose: Story = {
  args: { medication: fixtureMedications[0] },
};

export const EveningMonthly: Story = {
  args: { medication: fixtureMedications[1] },
};

export const NoTime: Story = {
  args: {
    medication: {
      ...fixtureMedications[0],
      time_of_day: null,
      frequency: 'as needed',
    },
  },
};

export const TwiceDaily: Story = {
  args: {
    medication: {
      ...fixtureMedications[0],
      name: 'Cosequin',
      dosage: '1 chew',
      frequency: 'twice daily',
      time_of_day: '08:00',
    },
  },
};
