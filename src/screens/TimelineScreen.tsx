/**
 * Home screen — Living Journal V2 layout.
 *
 *   ┌──────────────────────────────┐
 *   │  PetHeader (real photo)       │
 *   │  "Tuesday, May 10" (cursive)  │
 *   │  HeatmapStrip (2 weeks)       │
 *   ├──────────────────────────────┤
 *   │  FeedList                     │
 *   │    SuggestionCards (today)    │
 *   │    EntryCards (today/recent)  │
 *   ├──────────────────────────────┤
 *   │  QuickCaptureSheet (footer)   │
 *   ├──────────────────────────────┤
 *   │  Tab bar                      │
 *   └──────────────────────────────┘
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../utils/colors';
import { notify } from '../utils/feedback';
import { summarizeDays } from '../utils/dayIcons';
import { computeSuggestions, type Suggestion } from '../utils/suggestions';
import { PetHeader } from '../components/PetHeader';
import { PetSwitcherSheet } from '../components/PetSwitcherSheet';
import { usePets } from '../state/PetContext';
import { HeatmapStrip } from '../components/HeatmapStrip';
import { SuggestionCard } from '../components/SuggestionCard';
import { dateKey } from '../utils/dayIcons';
import { QuickCaptureSheet, type QuickEntry } from '../components/QuickCaptureSheet';
import { MemoryCard } from '../components/cards/MemoryCard';
import { VetVisitCard } from '../components/cards/VetVisitCard';
import { FiActivityCard } from '../components/cards/FiActivityCard';
import { MedicationReminderCard } from '../components/cards/MedicationReminderCard';
import { MedicationLogCard } from '../components/cards/MedicationLogCard';
import { getTimelineEvents, createTimelineEvent } from '../services/timeline';
import { getPetShares, getMedications } from '../services/pets';
import { useFiSync } from '../hooks/useFiSync';
import { useRealtimeTimeline } from '../hooks/useRealtimeTimeline';
import type { TimelineEvent, Pet, PetShare, Medication } from '../types/database';

type ListItem =
  | { type: 'header'; key: string; label: string; cursive?: boolean }
  | { type: 'suggestion'; key: string; suggestion: Suggestion }
  | { type: 'reminder'; key: string; medication: Medication }
  | { type: 'event'; key: string; event: TimelineEvent };

const TODAY_LABEL = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export function TimelineScreen({ navigation }: any) {
  const { pets, currentPet, currentPetId, loading: petsLoading, setCurrentPetId } = usePets();
  const [shares, setShares] = useState<(PetShare & { user: any })[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const pet = currentPet;

  const loadData = useCallback(async () => {
    if (!currentPetId) {
      setShares([]);
      setEvents([]);
      setMedications([]);
      setLoading(false);
      return;
    }
    try {
      const [sharesData, eventsData, medsData] = await Promise.all([
        getPetShares(currentPetId),
        getTimelineEvents(currentPetId),
        getMedications(currentPetId),
      ]);
      setShares(sharesData);
      setEvents(eventsData);
      setMedications(medsData);
    } catch (err: any) {
      notify('Error', err?.message ?? 'Could not load your timeline.');
    } finally {
      setLoading(false);
    }
  }, [currentPetId]);

  useFiSync(pet?.id ?? null);
  useRealtimeTimeline(pet?.id ?? null, loadData);
  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const summaries = useMemo(() => summarizeDays(events), [events]);
  const suggestions = useMemo(
    () => computeSuggestions({ medications, events }),
    [medications, events],
  );

  const handleSuggestionPrimary = useCallback(async (s: Suggestion) => {
    if (!pet) return;
    if (s.kind === 'medication_due' && s.medication) {
      const med = s.medication;
      try {
        await createTimelineEvent({
          petId: pet.id,
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
        notify('Error', err?.message);
      }
      return;
    }
    if (s.kind === 'empty_day_nudge') {
      setSheetExpanded(true);
    }
  }, [pet, loadData]);

  const handleQuickSave = useCallback(async (entry: QuickEntry) => {
    if (!pet) return;
    const now = new Date().toISOString();
    if (entry.mode === 'training') {
      await createTimelineEvent({
        petId: pet.id,
        eventType: 'memory',
        eventDate: now,
        title: entry.cue ?? 'Training',
        notes: [
          entry.around?.join(', ') && `Around ${entry.around.join(', ')}`,
          entry.duration && entry.duration,
          entry.toughMoment && 'Marked a tough moment.',
        ].filter(Boolean).join(' · '),
        metadata: {
          entry_kind: 'training',
          cue: entry.cue,
          around: entry.around,
          duration: entry.duration,
          tough_moment: entry.toughMoment ?? false,
          reaction_count: entry.toughMoment ? 1 : 0,
        } as any,
      });
    } else if (entry.mode === 'memory') {
      await createTimelineEvent({
        petId: pet.id,
        eventType: 'memory',
        eventDate: now,
        title: entry.kind ?? 'A moment',
        metadata: { entry_kind: entry.kind?.toLowerCase() === 'outing' ? 'outing' : 'memory' } as any,
      });
    } else if (entry.mode === 'med') {
      await createTimelineEvent({
        petId: pet.id,
        eventType: 'medication_log',
        eventDate: now,
        title: entry.medName ?? 'Medication',
        metadata: {
          medication_name: entry.medName,
          is_recurring: entry.isRecurring ?? false,
          frequency: entry.isRecurring ? 'monthly' : 'one-time',
        } as any,
      });
    }
    await loadData();
  }, [pet, loadData]);

  const handleMarkMedDone = useCallback(async (med: Medication) => {
    if (!pet) return;
    try {
      await createTimelineEvent({
        petId: pet.id,
        eventType: 'medication_log',
        eventDate: new Date().toISOString(),
        title: med.name,
        metadata: { medication_id: med.id, dosage: med.dosage, frequency: med.frequency },
      });
      await loadData();
    } catch (err: any) {
      notify('Error', err?.message);
    }
  }, [pet, loadData]);

  // Build list data
  const listData: ListItem[] = useMemo(() => {
    if (!pet) return [];
    const items: ListItem[] = [];

    // Smart suggestions go above everything else
    if (suggestions.length > 0) {
      items.push({ type: 'header', key: 'h-suggest', label: 'Suggested for you' });
      for (const s of suggestions) {
        items.push({ type: 'suggestion', key: s.id, suggestion: s });
      }
    }

    // Today's daily-med reminders
    const dueMeds = medications.filter(m => !m.end_date);
    const hasDueMeds = dueMeds.length > 0;
    if (hasDueMeds) {
      items.push({ type: 'header', key: 'h-today', label: 'Today', cursive: true });
      for (const med of dueMeds) {
        items.push({ type: 'reminder', key: `rem-${med.id}`, medication: med });
      }
    }

    // Recent events grouped by relative day
    const todayK = dateKey(new Date());
    const todaysEvents = events.filter(e => dateKey(e.event_date) === todayK);
    const olderEvents = events.filter(e => dateKey(e.event_date) !== todayK);

    if (todaysEvents.length > 0) {
      if (!hasDueMeds) {
        items.push({ type: 'header', key: 'h-today', label: 'Today', cursive: true });
      }
      for (const event of todaysEvents) {
        items.push({ type: 'event', key: `evt-${event.id}`, event });
      }
    }

    if (olderEvents.length > 0) {
      items.push({ type: 'header', key: 'h-recent', label: 'Recently' });
      for (const event of olderEvents.slice(0, 20)) {
        items.push({ type: 'event', key: `evt-${event.id}`, event });
      }
    }

    return items;
  }, [pet, medications, events, suggestions]);

  if (loading || petsLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // No pets yet — first-run state
  if (!pet) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.firstRunEmoji}>🐾</Text>
        <Text style={styles.firstRunTitle}>Welcome to Pet Journal</Text>
        <Text style={styles.firstRunSubtitle}>Add your first pet to start their timeline.</Text>
        <TouchableOpacity style={styles.firstRunButton} onPress={() => navigation.navigate('AddPet')}>
          <Text style={styles.firstRunButtonText}>Add a Pet</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <Text style={[styles.sectionLabel, item.cursive && styles.sectionLabelCursive]}>
          {item.label}
        </Text>
      );
    }
    if (item.type === 'suggestion') {
      const s = item.suggestion;
      return (
        <SuggestionCard
          title={s.title}
          subtitle={s.subtitle}
          thumbnailEmoji={s.thumbnailEmoji}
          thumbnailKind={s.thumbnailKind}
          primaryLabel={s.primaryLabel}
          onPrimary={() => handleSuggestionPrimary(s)}
        />
      );
    }
    if (item.type === 'reminder') {
      return <MedicationReminderCard medication={item.medication} onMarkDone={handleMarkMedDone} />;
    }
    if (item.type === 'event') {
      const e = item.event;
      switch (e.event_type) {
        case 'memory':
          return <MemoryCard event={e} />;
        case 'vet_visit':
          return <VetVisitCard event={e} />;
        case 'fi_activity':
          return <FiActivityCard event={e} />;
        case 'medication_log':
          return <MedicationLogCard event={e} />;
      }
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PetHeader
        pet={pet}
        shares={shares}
        onPressPet={pets.length > 1 || pets.length > 0 ? () => setSwitcherOpen(true) : undefined}
      />
      <Text style={styles.dateStamp}>{TODAY_LABEL}</Text>

      <HeatmapStrip
        summaries={summaries}
        weeks={2}
        onViewAll={() => navigation.navigate('Heatmap')}
      />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>No entries yet today</Text>
            <Text style={styles.emptySubtitle}>Tap + to log a moment or training.</Text>
          </View>
        }
      />

      <QuickCaptureSheet
        expanded={sheetExpanded}
        onCollapse={() => setSheetExpanded(v => !v)}
        onSave={handleQuickSave}
      />

      <PetSwitcherSheet
        visible={switcherOpen}
        pets={pets}
        currentPetId={currentPetId}
        onSelect={setCurrentPetId}
        onAddPet={() => navigation.navigate('AddPet')}
        onClose={() => setSwitcherOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  dateStamp: {
    marginHorizontal: 22,
    marginBottom: 8,
    fontFamily: fonts.cursive,
    fontSize: 20,
    color: colors.primary,
    transform: [{ rotate: '-0.5deg' }],
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionLabel: {
    fontFamily: fonts.serifBold,
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabelCursive: {
    fontFamily: fonts.cursive,
    fontSize: 18,
    color: colors.primary,
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: 4,
    marginBottom: 4,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.text },
  emptySubtitle: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13, color: colors.textMuted, marginTop: 4 },
  firstRunEmoji: { fontSize: 64, marginBottom: 16 },
  firstRunTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text, marginBottom: 8 },
  firstRunSubtitle: {
    fontFamily: fonts.serif, fontStyle: 'italic',
    fontSize: 15, color: colors.textMuted, textAlign: 'center',
    marginBottom: 24, paddingHorizontal: 32,
  },
  firstRunButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24,
  },
  firstRunButtonText: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 16 },
});
