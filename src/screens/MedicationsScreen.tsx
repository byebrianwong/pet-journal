/**
 * Medications tab — A3 layout.
 *
 *   ┌──────────────────────────────────────┐
 *   │  Header (Medications · for <pet>)    │
 *   │  Next Doses panel                    │
 *   │   - per-med countdown + Log dose     │
 *   │  Calendar section                    │
 *   │   - [Month | Week] segmented control │
 *   │   - ‹ Range › nav arrows             │
 *   │   - CalendarMonth or CalendarWeek    │
 *   │  Refills section                     │
 *   │   - bars + Order CTA (V1 stubbed)    │
 *   │  + Add medication (floating)         │
 *   └──────────────────────────────────────┘
 *
 * Wires to real `medications` + `medication_log` events via Supabase.
 * The Add Medication modal carries over from the previous screen.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts } from '../utils/colors';
import { notify, confirm } from '../utils/feedback';
import { getMedications, getMedicationLogs, createMedication } from '../services/pets';
import { createTimelineEvent } from '../services/timeline';
import { scheduleMedicationReminders } from '../services/notifications';
import { supabase } from '../services/supabase';
import { usePets } from '../state/PetContext';
import {
  medColor,
  formatCountdown,
  formatLastGiven,
  nextDoseFor,
  monthLabel,
  weekRangeLabel,
} from '../utils/medications';
import {
  CalendarMonth,
  CalendarWeek,
  CalendarNavRow,
} from '../components/MedicationCalendar';
import type { Medication, TimelineEvent } from '../types/database';

type CalView = 'month' | 'week';

export function MedicationsScreen({ route }: any) {
  // petId comes from the route param when navigated from PetProfile;
  // fall back to the current pet from context so the tab works standalone.
  const { currentPetId, currentPet } = usePets();
  const petId: string | undefined = route?.params?.petId ?? currentPetId ?? undefined;

  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<CalView>('month');
  // Anchor is the date inside the currently-viewed range. Prev/next shift
  // by a month (for month view) or 7 days (for week view).
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  // Add Medication modal state — preserved from the previous screen.
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!petId) return;
    try {
      const [medsData, logsData] = await Promise.all([
        getMedications(petId),
        getMedicationLogs(petId, 60),
      ]);
      setMeds(medsData);
      setLogs(logsData);
      await scheduleMedicationReminders(medsData);
    } catch (err: any) {
      notify('Error', err?.message ?? 'Could not load medications.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Sort meds by how soon their next dose is — what the user cares about most.
  const sortedMeds = useMemo(() => {
    const now = Date.now();
    return [...meds]
      .filter(m => !m.end_date)
      .map(m => ({ med: m, ...nextDoseFor(m, logs) }))
      .sort((a, b) => (a.nextAt - now) - (b.nextAt - now))
      .map(x => x.med);
  }, [meds, logs]);

  // The first med in the sorted list gets the "Log dose" button inline,
  // since it's the next one the user actually needs to act on.
  const nextUpId = sortedMeds[0]?.id;

  const handleLogDose = useCallback(async (med: Medication) => {
    if (!petId) return;
    try {
      await createTimelineEvent({
        petId,
        eventType: 'medication_log',
        eventDate: new Date().toISOString(),
        title: med.name,
        metadata: {
          medication_id: med.id,
          dosage: med.dosage,
          frequency: med.frequency,
        } as any,
      });
      await loadData();
    } catch (err: any) {
      notify('Error', err?.message ?? 'Could not log dose.');
    }
  }, [petId, loadData]);

  const handleStop = (med: Medication) => {
    confirm(
      `Stop ${med.name}?`,
      'Stops tracking. History stays.',
      {
        destructive: true,
        confirmText: 'Stop',
        onConfirm: async () => {
          await supabase
            .from('medications')
            .update({ end_date: new Date().toISOString().split('T')[0] })
            .eq('id', med.id);
          await loadData();
        },
      },
    );
  };

  const handleAdd = async () => {
    if (!petId) return;
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
      await loadData();
    } catch (err: any) {
      notify('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Range nav helpers — month: ±1 month, week: ±7 days.
  const onPrev = () => {
    if (view === 'month') {
      setAnchor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      setAnchor(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
    }
  };
  const onNext = () => {
    if (view === 'month') {
      setAnchor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      setAnchor(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    }
  };

  const navLabel = view === 'month'
    ? monthLabel(anchor.getFullYear(), anchor.getMonth())
    : (() => {
        const dow = (anchor.getDay() + 6) % 7;
        const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - dow);
        return weekRangeLabel(monday);
      })();

  const navSub = (() => {
    const now = new Date();
    if (view === 'month') {
      if (anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth()) return 'this month';
      const diff = (anchor.getFullYear() - now.getFullYear()) * 12 + (anchor.getMonth() - now.getMonth());
      return diff < 0 ? `${-diff} month${-diff === 1 ? '' : 's'} ago` : `in ${diff} month${diff === 1 ? '' : 's'}`;
    }
    const dow = (anchor.getDay() + 6) % 7;
    const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - dow);
    const nowDow = (now.getDay() + 6) % 7;
    const nowMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - nowDow);
    const weeks = Math.round((monday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeks === 0) return 'this week';
    return weeks < 0 ? `${-weeks} week${-weeks === 1 ? '' : 's'} ago` : `in ${weeks} week${weeks === 1 ? '' : 's'}`;
  })();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.title}>Medications</Text>
          {currentPet && <Text style={styles.subtitle}>for {currentPet.name}</Text>}
        </View>

        {/* Next doses */}
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Next doses</Text>
            <Text style={styles.panelMeta}>{sortedMeds.length} active</Text>
          </View>

          {sortedMeds.length === 0 ? (
            <View style={styles.panelEmpty}>
              <Text style={styles.emptyEmoji}>💊</Text>
              <Text style={styles.emptyTitle}>No active medications</Text>
              <Text style={styles.emptySubtitle}>Add one to get reminders</Text>
            </View>
          ) : sortedMeds.map((med, idx) => {
            const { lastAt, nextAt } = nextDoseFor(med, logs);
            const cd = formatCountdown(nextAt);
            const color = medColor(med.id);
            const lastTxt = formatLastGiven(lastAt);
            return (
              <TouchableOpacity
                key={med.id}
                style={[styles.medRow, idx > 0 && styles.medRowBorder]}
                onLongPress={() => handleStop(med)}
              >
                <View style={[styles.medDot, { backgroundColor: color.fg }]} />
                <View style={styles.medMain}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medFreq}>{med.dosage} · {med.frequency}</Text>
                </View>
                <View style={styles.medCountdown}>
                  <Text style={[styles.countdownBig, cd.due && styles.countdownDue]}>{cd.big}</Text>
                  <Text style={styles.countdownSub} numberOfLines={1}>
                    {cd.sub ? `${cd.sub} · ` : ''}{lastAt ? `last given ${lastTxt}` : 'never given'}
                  </Text>
                  {med.id === nextUpId && (
                    <TouchableOpacity style={styles.logBtn} onPress={() => handleLogDose(med)}>
                      <Text style={styles.logBtnText}>Log dose</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          {sortedMeds.length > 0 && (
            <Text style={styles.hint}>Long-press a med to stop tracking.</Text>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.calSection}>
          <View style={styles.calToolbar}>
            <Text style={styles.calTitle}>Calendar</Text>
            <View style={styles.segControl}>
              {(['month', 'week'] as CalView[]).map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.seg, view === v && styles.segActive]}
                  onPress={() => setView(v)}
                >
                  <Text style={[styles.segText, view === v && styles.segTextActive]}>
                    {v === 'month' ? 'Month' : 'Week'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CalendarNavRow
            label={navLabel}
            sublabel={navSub}
            onPrev={onPrev}
            onNext={onNext}
          />

          {view === 'month' ? (
            <CalendarMonth
              year={anchor.getFullYear()}
              monthIndex={anchor.getMonth()}
              meds={sortedMeds}
              logs={logs}
            />
          ) : (
            <CalendarWeek
              anchor={anchor}
              meds={sortedMeds}
              logs={logs}
            />
          )}

          {sortedMeds.length > 0 && (
            <View style={styles.legend}>
              {sortedMeds.map(m => {
                const color = medColor(m.id);
                return (
                  <View key={m.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.fg }]} />
                    <Text style={styles.legendText}>{m.name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Refills — V1 stub. Real supply tracking needs schema additions:
            see TODOS.md "medication refill tracking". */}
        {sortedMeds.length > 0 && (
          <View style={styles.refillPanel}>
            <Text style={styles.refillHead}>Refills</Text>
            <Text style={styles.refillEmpty}>
              Supply tracking is coming soon. For now, set a reminder to refill in your calendar.
            </Text>
          </View>
        )}

      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Text style={styles.addBtnText}>+ Add medication</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Medication</Text>

            <TextInput style={styles.input} placeholder="Medication name" value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} placeholder="Dosage (e.g. 16mg)" value={dosage} onChangeText={setDosage} placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>Frequency</Text>
            <View style={styles.freqRow}>
              {['daily', 'twice daily', 'weekly', 'monthly'].map((f) => (
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 96 },

  header: { marginBottom: 12 },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.cursive,
    fontSize: 18,
    color: colors.primary,
    marginTop: 2,
  },

  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  panelTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  panelMeta: {
    fontFamily: fonts.cursive,
    fontSize: 14,
    color: colors.textMuted,
  },
  panelEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36, marginBottom: 6 },
  emptyTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: fonts.cursive,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  medRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  medDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  medMain: { flex: 1 },
  medName: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    color: colors.text,
  },
  medFreq: {
    fontFamily: fonts.cursive,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  medCountdown: {
    alignItems: 'flex-end',
    maxWidth: 170,
  },
  countdownBig: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.text,
    lineHeight: 16,
  },
  countdownDue: { color: colors.primary },
  countdownSub: {
    fontFamily: fonts.cursive,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'right',
  },
  logBtn: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  logBtnText: {
    color: '#fff',
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  hint: {
    fontFamily: fonts.cursive,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },

  // Calendar
  calSection: { marginBottom: 14 },
  calToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  calTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: colors.text,
  },
  segControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    padding: 2,
  },
  seg: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  segActive: { backgroundColor: colors.primary },
  segText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  segTextActive: { color: '#fff' },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMuted,
  },

  // Refills (V1 stub)
  refillPanel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  refillHead: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  refillEmpty: {
    fontFamily: fonts.cursive,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // Add medication CTA + modal
  addBtn: {
    position: 'absolute',
    bottom: 22,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
  },
  addBtnText: {
    color: '#fff',
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
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
  modalTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 16,
  },
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
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  freqOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary },
  freqTextActive: { color: '#fff', fontFamily: fonts.sansBold },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.textSecondary },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
});
