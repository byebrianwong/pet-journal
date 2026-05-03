import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import { formatDate } from '../../utils/dates';
import type { TimelineEvent, VetVisitMetadata } from '../../types/database';

export function VetVisitCard({ event }: { event: TimelineEvent }) {
  const meta = event.metadata as VetVisitMetadata;

  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>🏥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{event.title ?? 'Vet Visit'}</Text>
          <Text style={styles.clinic}>
            {[meta.clinic_name, meta.vet_name ? `Dr. ${meta.vet_name}` : null]
              .filter(Boolean)
              .join(' · ') || formatDate(event.event_date)}
          </Text>
        </View>
      </View>

      {event.notes && (
        <View style={styles.details}>
          <Text style={styles.detailsText}>{event.notes}</Text>
        </View>
      )}

      <View style={styles.tags}>
        {meta.medications_prescribed?.map((med, i) => (
          <View key={i} style={[styles.tag, styles.tagMed]}>
            <Text style={styles.tagMedText}>{med}</Text>
          </View>
        ))}
        {meta.diagnoses?.map((dx, i) => (
          <View key={`dx-${i}`} style={[styles.tag, styles.tagVaccine]}>
            <Text style={styles.tagVaccineText}>{dx}</Text>
          </View>
        ))}
      </View>

      {meta.cost_total != null && (
        <Text style={styles.cost}>Total: ${meta.cost_total.toFixed(2)}</Text>
      )}
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
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.vetIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  clinic: { fontSize: 12, color: colors.textMuted },
  details: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  detailsText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagMed: { backgroundColor: colors.medicationBg },
  tagMedText: { fontSize: 11, fontWeight: '600', color: colors.medication },
  tagVaccine: { backgroundColor: colors.vaccineBg },
  tagVaccineText: { fontSize: 11, fontWeight: '600', color: colors.vaccine },
  cost: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
