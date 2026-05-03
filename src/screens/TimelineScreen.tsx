import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/colors';
import { groupByDate } from '../utils/dates';
import { PetHeader } from '../components/PetHeader';
import { MemoryCard } from '../components/cards/MemoryCard';
import { VetVisitCard } from '../components/cards/VetVisitCard';
import { FiActivityCard } from '../components/cards/FiActivityCard';
import { MedicationReminderCard } from '../components/cards/MedicationReminderCard';
import { MedicationLogCard } from '../components/cards/MedicationLogCard';
import { getTimelineEvents, createTimelineEvent } from '../services/timeline';
import { getMyPets, getPetShares, getMedications } from '../services/pets';
import { useFiSync } from '../hooks/useFiSync';
import { useRealtimeTimeline } from '../hooks/useRealtimeTimeline';
import { fiCollar } from '../services/fi-collar';
import type { TimelineEvent, Pet, PetShare, Medication } from '../types/database';

type ListItem =
  | { type: 'date'; label: string }
  | { type: 'reminder'; medication: Medication }
  | { type: 'event'; event: TimelineEvent };

export function TimelineScreen({ navigation }: any) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [shares, setShares] = useState<(PetShare & { user: any })[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fiStatus, setFiStatus] = useState<{ connected: boolean; steps?: number }>({ connected: false });

  const loadData = useCallback(async () => {
    try {
      const pets = await getMyPets();
      if (pets.length === 0) {
        navigation.replace('AddPet');
        return;
      }

      const currentPet = pets[0];
      setPet(currentPet);

      const [sharesData, eventsData, medsData] = await Promise.all([
        getPetShares(currentPet.id),
        getTimelineEvents(currentPet.id),
        getMedications(currentPet.id),
      ]);

      setShares(sharesData);
      setEvents(eventsData);
      setMedications(medsData);

      // Check Fi status
      const fiConfigured = await fiCollar.isConfigured();
      if (fiConfigured) {
        const todayFi = eventsData.find(e => e.event_type === 'fi_activity');
        const steps = todayFi ? (todayFi.metadata as any)?.steps : undefined;
        setFiStatus({ connected: true, steps });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  // Sync Fi Collar data on foreground
  useFiSync(pet?.id ?? null);

  // Live updates when partner adds entries
  useRealtimeTimeline(pet?.id ?? null, loadData);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkMedDone = useCallback(async (med: Medication) => {
    if (!pet) return;
    try {
      await createTimelineEvent({
        petId: pet.id,
        eventType: 'medication_log',
        eventDate: new Date().toISOString(),
        title: med.name,
        metadata: { medication_id: med.id, dosage: med.dosage },
      });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [pet, loadData]);

  // Build flat list data: reminders at top, then date-grouped events
  const listData: ListItem[] = [];

  if (medications.length > 0) {
    listData.push({ type: 'date', label: 'Reminders' });
    for (const med of medications) {
      listData.push({ type: 'reminder', medication: med });
    }
  }

  const grouped = groupByDate(events);
  for (const [label, groupEvents] of grouped) {
    listData.push({ type: 'date', label });
    for (const event of groupEvents) {
      listData.push({ type: 'event', event });
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {pet && <PetHeader pet={pet} shares={shares} fiStatus={fiStatus} />}

      <FlatList
        data={listData}
        keyExtractor={(item, index) => {
          if (item.type === 'date') return `date-${item.label}-${index}`;
          if (item.type === 'reminder') return `rem-${item.medication.id}`;
          return `evt-${item.event.id}`;
        }}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return <Text style={styles.dateLabel}>{item.label}</Text>;
          }
          if (item.type === 'reminder') {
            return (
              <MedicationReminderCard
                medication={item.medication}
                onMarkDone={handleMarkMedDone}
              />
            );
          }

          const { event } = item;
          switch (event.event_type) {
            case 'memory':
              return <MemoryCard event={event} />;
            case 'vet_visit':
              return <VetVisitCard event={event} />;
            case 'fi_activity':
              return <FiActivityCard event={event} />;
            case 'medication_log':
              return <MedicationLogCard event={event} />;
            default:
              return null;
          }
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to add your first memory or vet visit
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEntry', { petId: pet?.id })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  list: { padding: 16, paddingBottom: 100 },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
});
