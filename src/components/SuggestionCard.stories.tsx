import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SuggestionCard } from './SuggestionCard';

const meta: Meta<typeof SuggestionCard> = {
  title: 'Components/SuggestionCard',
  component: SuggestionCard,
  parameters: { layout: 'padded' },
  args: { onPrimary: fn(), onSecondary: fn() },
};
export default meta;

type Story = StoryObj<typeof SuggestionCard>;

export const PhotoMemory: Story = {
  args: {
    title: '4 photos from Lake Park',
    subtitle: '3:24 PM · new spot — add memory?',
    thumbnailUri: 'https://placedog.net/100/100?id=311',
    primaryLabel: 'Add',
    secondaryLabel: 'Dismiss',
  },
};

export const MedicationDue: Story = {
  args: {
    title: 'Flea & tick due today',
    subtitle: 'Last given 30 days ago',
    thumbnailEmoji: '💊',
    thumbnailKind: 'med',
    primaryLabel: 'Done',
    secondaryLabel: 'Snooze',
  },
};

export const TrainingHint: Story = {
  args: {
    title: 'Quick training log?',
    subtitle: 'You spent ~1 hour around family',
    thumbnailEmoji: '🎯',
    thumbnailKind: 'training',
    primaryLabel: 'Yes',
    secondaryLabel: 'No',
  },
};
