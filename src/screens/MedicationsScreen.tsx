import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal,
} from 'react-native';
import { colors } from '../utils/colors';
import { notify, confirm } from '../utils/feedback';
import { getMedications, createMedication } from '../services/pets';
import { scheduleMedicationReminders } from '../services/notifications';
import { supabase } from '../services/supabase';
import type { Medication } from '../types/database';

export function MedicationsScreen({ route }: any) {
  const { petId } = route.params;
  const [meds, setMeds] = useState<Medication[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const loadMeds = useCallback(async () => {
    const data = await getMedications(petId);
    setMeds(data);
    await scheduleMedicationReminders(data);
  }, [petId]);

  useEffect(() => { loadMeds(); }, [loadMeds]);

  const handleAdd = async () => {
    if (!name.trim() || !dosage.trim()) {
      notify('Required', 'Name and dosage are required.');
      return;
    }

    setSaving(true);
    try {
      await createMedication({
        petId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        timeOfDay,
      });
      setShowAdd(false);
      setName('');
      setDosage('');
      await loadMeds();
    } catch (err: any) {
      notify('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStop = async (med: Medication) => {
    confirm(
      'Stop medication?',
      `Stop tracking ${med.name}? This won't delete history.`,
      {
        destructive: true,
        confirmText: 'Stop',
        onConfirm: async () => {
          await supabase
            .from('medications')
            .update({ end_date: new Date().toISOString().split('T')[0] })
            .eq('id', med.id);
          await loadMeds();
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={meds}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.medCard}>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{item.name}</Text>
              <Text style={styles.medDosage}>{item.dosage} · {item.frequency}</Text>
              {item.time_of_day && (
                <Text style={styles.medTime}>Reminder at {formatTime(item.time_of_day)}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleStop(item)}>
              <Text style={styles.stopButton}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>No active medications</Text>
            <Text style={styles.emptySubtitle}>Add one to get reminders</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(true)}>
        <Text style={styles.addButtonText}>+ Add Medication</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Medication</Text>

            <TextInput style={styles.input} placeholder="Medication name" value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} placeholder="Dosage (e.g. 16mg)" value={dosage} onChangeText={setDosage} placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>Frequency</Text>
            <View style={styles.freqRow}>
              {['daily', 'twice daily', 'weekly'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqOption, frequency === f && styles.freqActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Reminder time</Text>
            <TextInput style={styles.input} placeholder="HH:MM (24h)" value={timeOfDay} onChangeText={setTimeOfDay} placeholderTextColor={colors.textMuted} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleAdd}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 80 },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '600', color: colors.text },
  medDosage: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  medTime: { fontSize: 12, color: colors.fi, marginTop: 4 },
  stopButton: { fontSize: 14, color: colors.error, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  freqRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  freqOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqText: { fontSize: 13, color: colors.textSecondary },
  freqTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
