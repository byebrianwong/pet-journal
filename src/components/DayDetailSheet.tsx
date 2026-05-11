/**
 * Slide-up sheet that shows every entry for a single day. Opens when
 * the user taps a cell on the heatmap.
 *
 *   ┌────────────────────────────────┐
 *   │   ─── handle ───                │
 *   │   Friday, May 8                 │  <- big serif date
 *   │                                 │
 *   │   📷 Beach day!                 │
 *   │   9:14 AM · added by Sarah     │
 *   │                                 │
 *   │   🎯 Place training             │
 *   │   2:00 PM · 60 min · family    │
 *   │                                 │
 *   │   ⚠️ Tough moment marked        │
 *   │   3:30 PM · 1 reaction         │
 *   │                                 │
 *   │   [   Close   ]                 │
 *   └────────────────────────────────┘
 *
 * Pure presentation — the parent screen owns the date/events state.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { colors, fonts } from '../utils/colors';
import {
  DAY_ICON_EMOJI,
  classifyEvent,
} from '../utils/dayIcons';
import type { TimelineEvent } from '../types/database';

interface Props {
  date: Date | null;
  events: TimelineEvent[];
  onClose: () => void;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function DayDetailSheet({ date, events, onClose }: Props) {
  const visible = date != null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {date && (
            <Text style={styles.title}>{formatDay(date)}</Text>
          )}

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>·</Text>
                <Text style={styles.emptyText}>Nothing logged this day yet.</Text>
              </View>
            ) : (
              events.map(event => (
                <EventRow key={event.id} event={event} />
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const icon = DAY_ICON_EMOJI[classifyEvent(event)];
  const meta = event.metadata as any;
  const isPhoto = !!event.photo_url;
  const userName = event.user?.display_name ?? null;

  const subtitleParts = [
    formatTime(event.event_date),
    meta?.duration,
    meta?.around && Array.isArray(meta.around) ? `around ${meta.around.join(', ')}` : null,
    userName && `added by ${userName}`,
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      {isPhoto && (
        <Image source={{ uri: event.photo_url! }} style={styles.photo} />
      )}
      <View style={styles.rowBody}>
        <View style={styles.titleRow}>
          <Text style={styles.iconTag}>{icon}</Text>
          <Text style={styles.entryTitle}>
            {event.title ?? 'Untitled'}
          </Text>
        </View>
        <Text style={styles.entrySub}>{subtitleParts.join(' · ')}</Text>
        {event.notes && <Text style={styles.notes}>{event.notes}</Text>}
        {meta?.tough_moment && (
          <Text style={styles.toughBadge}>⚠️ Tough moment marked</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingBottom: 28,
    paddingTop: 10,
    maxHeight: '80%',
  },
  handleRow: { alignItems: 'center', marginBottom: 8 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
  },
  scroll: { paddingBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 36, color: colors.textMuted, marginBottom: 8 },
  emptyText: {
    fontFamily: fonts.serif, fontStyle: 'italic',
    fontSize: 14, color: colors.textMuted,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 140, backgroundColor: colors.primaryLight },
  rowBody: { padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconTag: { fontSize: 16 },
  entryTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  entrySub: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  notes: {
    fontFamily: fonts.serif,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  toughBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.text,
    backgroundColor: colors.dayReaction.bg,
    borderColor: colors.dayReaction.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontFamily: fonts.serifBold, fontStyle: 'italic', fontSize: 14 },
});
