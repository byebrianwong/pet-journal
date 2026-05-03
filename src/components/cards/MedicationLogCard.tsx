import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import { formatDate } from '../../utils/dates';
import type { TimelineEvent, MedicationLogMetadata } from '../../types/database';

export function MedicationLogCard({ event }: { event: TimelineEvent }) {
  const meta = event.metadata as MedicationLogMetadata;
  const userName = event.user?.display_name ?? 'Unknown';

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>✅</Text>
      <View style={styles.text}>
        <Text style={styles.title}>
          {event.title ?? 'Medication'}{meta.dosage ? ` — ${meta.dosage}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Marked by {userName} · {formatDate(event.event_date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  icon: { fontSize: 18 },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
