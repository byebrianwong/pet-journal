import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { HeatmapStrip } from './HeatmapStrip';
import { dateKey, type DaySummaryMap } from '../utils/dayIcons';

function buildSummaries(pattern: Array<{ daysAgo: number; icon: 'photo' | 'training' | 'activity' | 'med' | 'reaction' | 'milestone'; multi?: boolean }>): DaySummaryMap {
  const now = new Date();
  const out: DaySummaryMap = {};
  for (const p of pattern) {
    const d = new Date(now);
    d.setDate(now.getDate() - p.daysAgo);
    out[dateKey(d)] = { icon: p.icon, multi: !!p.multi, eventCount: p.multi ? 2 : 1 };
  }
  return out;
}

const meta: Meta<typeof HeatmapStrip> = {
  title: 'Components/HeatmapStrip',
  component: HeatmapStrip,
  parameters: { layout: 'padded' },
  args: { onViewAll: fn(), onPressDay: fn() },
};
export default meta;

type Story = StoryObj<typeof HeatmapStrip>;

export const ActiveTwoWeeks: Story = {
  args: {
    summaries: buildSummaries([
      { daysAgo: 13, icon: 'activity' },
      { daysAgo: 11, icon: 'photo' },
      { daysAgo: 10, icon: 'training' },
      { daysAgo: 9, icon: 'activity' },
      { daysAgo: 8, icon: 'milestone' },
      { daysAgo: 7, icon: 'photo' },
      { daysAgo: 6, icon: 'training', multi: true },
      { daysAgo: 5, icon: 'reaction' },
      { daysAgo: 4, icon: 'training' },
      { daysAgo: 3, icon: 'med' },
      { daysAgo: 2, icon: 'photo' },
      { daysAgo: 1, icon: 'training' },
    ]),
  },
};

export const SparseWeek: Story = {
  args: {
    summaries: buildSummaries([
      { daysAgo: 9, icon: 'photo' },
      { daysAgo: 6, icon: 'photo' },
      { daysAgo: 2, icon: 'training' },
    ]),
  },
};

export const FirstDay: Story = {
  args: { summaries: {} },
};

export const ToughWeek: Story = {
  args: {
    summaries: buildSummaries([
      { daysAgo: 13, icon: 'training' },
      { daysAgo: 11, icon: 'reaction' },
      { daysAgo: 9, icon: 'reaction' },
      { daysAgo: 7, icon: 'reaction' },
      { daysAgo: 5, icon: 'training' },
      { daysAgo: 3, icon: 'training' },
      { daysAgo: 1, icon: 'training' },
    ]),
  },
};
