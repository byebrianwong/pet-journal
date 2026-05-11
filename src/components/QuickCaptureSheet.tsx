/**
 * Quick-capture bottom sheet — the V2 chip-based entry surface.
 *
 *   ┌─────────────────────────────┐
 *   │   ─── handle ───            │
 *   │  Memory   Training   Med    │   <- segmented tabs
 *   │                             │
 *   │  Cue:  [Place ✓] [Sit] ...  │   <- chip rows
 *   │  Around: [Family ✓] ...     │
 *   │  + tough moment?            │   <- optional escalator
 *   │                             │
 *   │  [    Save today's hour ]   │
 *   └─────────────────────────────┘
 *
 * Three modes: 'memory' / 'training' / 'med'. Each mode renders its
 * own chip configuration and serializes to a TimelineEvent on save.
 * No keyboard required for the happy path.
 *
 * Implemented as a bottom-aligned overlay rather than @gorhom/bottom-sheet
 * because the V2 design wants it persistent (always reachable), not a
 * modal that has to be summoned. The sheet has expanded/collapsed
 * states the screen orchestrates.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, fonts } from '../utils/colors';
import { notify } from '../utils/feedback';

export type QuickMode = 'memory' | 'training' | 'med';

export interface QuickEntry {
  mode: QuickMode;
  // training
  cue?: string;
  around?: string[];
  duration?: string;
  toughMoment?: boolean;
  // memory
  kind?: string;
  // med
  medName?: string;
  isRecurring?: boolean;
}

interface Props {
  expanded: boolean;
  initialMode?: QuickMode;
  onCollapse: () => void;
  onSave: (entry: QuickEntry) => Promise<void>;
}

const TRAINING_CUES = ['Place', 'Sit', 'Stay', 'Recall', 'Down', 'Leave it'];
const TRAINING_AROUND = ['Family', 'Strangers', 'Dogs', 'Quiet'];
const TRAINING_DURATION = ['5 min', '15 min', '30 min', '60 min'];

const MEMORY_KINDS = ['Outing', 'Photo', 'Funny', 'Milestone'];

const MED_OPTIONS = ['Flea & tick', 'Heartgard', 'Apoquel', '+ Other'];

export function QuickCaptureSheet({ expanded, initialMode = 'training', onCollapse, onSave }: Props) {
  const [mode, setMode] = useState<QuickMode>(initialMode);
  const [cue, setCue] = useState<string | null>('Place');
  const [around, setAround] = useState<string[]>(['Family']);
  const [duration, setDuration] = useState<string | null>('60 min');
  const [toughMoment, setToughMoment] = useState(false);
  const [memoryKind, setMemoryKind] = useState<string | null>('Outing');
  const [medName, setMedName] = useState<string | null>('Flea & tick');
  const [isRecurring, setIsRecurring] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleAround = (val: string) => {
    setAround(prev => (prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entry: QuickEntry =
        mode === 'training'
          ? { mode, cue: cue ?? undefined, around, duration: duration ?? undefined, toughMoment }
          : mode === 'memory'
          ? { mode, kind: memoryKind ?? undefined }
          : { mode, medName: medName ?? undefined, isRecurring };
      await onSave(entry);
      onCollapse();
    } catch (err: any) {
      notify('Could not save', err?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.sheet, !expanded && styles.sheetCollapsed]}>
      {!expanded ? (
        <TouchableOpacity style={styles.collapsedRow} onPress={onCollapse}>
          <View style={styles.handle} />
          <Text style={styles.collapsedText}>Tap to log a moment</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={onCollapse} style={styles.handleHit}>
            <View style={styles.handle} />
          </TouchableOpacity>

          <View style={styles.tabs}>
            {(['memory', 'training', 'med'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'memory' ? 'Memory' : m === 'training' ? 'Training' : 'Medicine'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'training' && (
            <>
              <ChipSection
                label="What we practiced"
                chips={TRAINING_CUES}
                value={cue}
                onChange={setCue}
              />
              <ChipMultiSection
                label="Around"
                chips={TRAINING_AROUND}
                values={around}
                onToggle={toggleAround}
              />
              <ChipSection
                label="Duration"
                chips={TRAINING_DURATION}
                value={duration}
                onChange={setDuration}
              />
              <TouchableOpacity
                style={[styles.toughChip, toughMoment && styles.toughChipActive]}
                onPress={() => setToughMoment(v => !v)}
              >
                <Text style={[styles.toughChipText, toughMoment && styles.toughChipTextActive]}>
                  {toughMoment ? '⚠️  Tough moment marked' : '+ tough moment?'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'memory' && (
            <>
              <ChipSection
                label="What kind?"
                chips={MEMORY_KINDS}
                value={memoryKind}
                onChange={setMemoryKind}
              />
              <Text style={styles.hint}>
                Pick a kind and save — you can add a photo and note from the journal afterwards.
              </Text>
            </>
          )}

          {mode === 'med' && (
            <>
              <ChipSection
                label="Which medication?"
                chips={MED_OPTIONS}
                value={medName}
                onChange={setMedName}
              />
              <TouchableOpacity
                style={[styles.recurringRow, isRecurring && styles.recurringRowActive]}
                onPress={() => setIsRecurring(v => !v)}
              >
                <Text style={styles.recurringText}>
                  {isRecurring ? '✓  Remind me monthly' : '○  One-time only'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.save, saving && styles.saveDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving…' : saveLabel(mode)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function saveLabel(mode: QuickMode): string {
  switch (mode) {
    case 'training': return "Save today's hour";
    case 'memory': return 'Save memory';
    case 'med': return 'Mark medicine given';
  }
}

function ChipSection({
  label, chips, value, onChange,
}: { label: string; chips: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {chips.map(chip => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, value === chip && styles.chipActive]}
            onPress={() => onChange(chip)}
          >
            <Text style={[styles.chipText, value === chip && styles.chipTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ChipMultiSection({
  label, chips, values, onToggle,
}: { label: string; chips: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {chips.map(chip => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, values.includes(chip) && styles.chipActive]}
            onPress={() => onToggle(chip)}
          >
            <Text style={[styles.chipText, values.includes(chip) && styles.chipTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80, // sits above the tab bar
    backgroundColor: colors.surfaceWarm,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    maxHeight: 480,
  },
  sheetCollapsed: {
    paddingBottom: 14,
  },
  collapsedRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleHit: { alignItems: 'center', paddingVertical: 4, marginBottom: 8 },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 8,
  },
  collapsedText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textMuted,
  },
  scroll: { paddingBottom: 8 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    marginBottom: 10,
  },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.text, fontFamily: fonts.serifBold, fontStyle: 'normal' },
  section: { marginBottom: 10 },
  sectionLabel: {
    fontFamily: fonts.serifBold,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontFamily: fonts.sansBold },
  toughChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  toughChipActive: {
    backgroundColor: colors.dayReaction.bg,
    borderColor: colors.dayReaction.border,
  },
  toughChipText: { fontFamily: fonts.sans, fontStyle: 'italic', fontSize: 12, color: colors.textMuted },
  toughChipTextActive: { color: colors.text, fontStyle: 'normal' },
  hint: {
    fontFamily: fonts.serif, fontStyle: 'italic',
    fontSize: 11, color: colors.textMuted,
    marginTop: 4, marginBottom: 4,
  },
  recurringRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: 6,
  },
  recurringRowActive: {
    backgroundColor: colors.dayMed.bg,
    borderColor: colors.dayMed.border,
  },
  recurringText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  save: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.6 },
  saveText: {
    color: '#fff',
    fontFamily: fonts.serifBold,
    fontStyle: 'italic',
    fontSize: 14,
  },
});
