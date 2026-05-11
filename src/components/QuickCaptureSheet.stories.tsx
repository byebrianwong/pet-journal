import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { View } from 'react-native';
import { QuickCaptureSheet, type QuickMode } from './QuickCaptureSheet';
import { colors } from '../utils/colors';

const meta: Meta<typeof QuickCaptureSheet> = {
  title: 'Components/QuickCaptureSheet',
  component: QuickCaptureSheet,
  parameters: { layout: 'fullscreen' },
  args: { onSave: fn(async () => {}), onCollapse: fn() },
};
export default meta;

type Story = StoryObj<typeof QuickCaptureSheet>;

const InPhone: React.FC<{ initialMode?: QuickMode; expanded?: boolean }> = ({ initialMode, expanded: initialExpanded }) => {
  const [expanded, setExpanded] = useState(initialExpanded ?? true);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'flex-end' }}>
      <QuickCaptureSheet
        expanded={expanded}
        initialMode={initialMode}
        onCollapse={() => setExpanded(v => !v)}
        onSave={async () => {}}
      />
    </View>
  );
};

export const Collapsed: Story = {
  render: () => <InPhone expanded={false} />,
};

export const TrainingMode: Story = {
  render: () => <InPhone initialMode="training" />,
};

export const MemoryMode: Story = {
  render: () => <InPhone initialMode="memory" />,
};

export const MedicineMode: Story = {
  render: () => <InPhone initialMode="med" />,
};
