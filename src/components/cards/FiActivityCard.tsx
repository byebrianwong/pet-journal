import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import type { TimelineEvent, FiActivityMetadata } from '../../types/database';

export function FiActivityCard({ event }: { event: TimelineEvent }) {
  const meta = event.metadata as FiActivityMetadata;
  const goalPct = meta.goal_pct ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.headerText}>Today's Activity</Text>
      </View>

      <View style={styles.stats}>
        <Stat value={meta.steps?.toLocaleString() ?? '—'} label="Steps" />
        <Stat value={meta.distance_miles?.toFixed(1) ?? '—'} label="Miles" />
        <Stat value={meta.rest_hours ? `${Math.round(meta.rest_hours)}h` : '—'} label="Rest" />
        <Stat value={`${Math.round(goalPct)}%`} label="Goal" />
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${Math.min(100, goalPct)}%` }]} />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.fi },
  headerText: { fontSize: 13, fontWeight: '600', color: colors.fi },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  barContainer: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 10,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.fi,
    borderRadius: 3,
  },
});
