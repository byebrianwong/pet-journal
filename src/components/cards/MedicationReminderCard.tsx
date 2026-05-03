import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../utils/colors';
import type { Medication } from '../../types/database';

interface Props {
  medication: Medication;
  onMarkDone: (medication: Medication) => void;
}

export function MedicationReminderCard({ medication, onMarkDone }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💊</Text>
      <View style={styles.text}>
        <Text style={styles.title}>{medication.name} — {medication.dosage}</Text>
        <Text style={styles.time}>
          {medication.time_of_day
            ? `Due at ${formatTime(medication.time_of_day)} · ${medication.frequency}`
            : medication.frequency}
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => onMarkDone(medication)}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reminderBg,
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.reminder,
    gap: 10,
  },
  icon: { fontSize: 20 },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.reminder,
  },
  buttonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
