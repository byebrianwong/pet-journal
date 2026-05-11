import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, fonts } from '../../utils/colors';
import { formatDate } from '../../utils/dates';
import { DAY_ICON_EMOJI, classifyEvent } from '../../utils/dayIcons';
import type { TimelineEvent } from '../../types/database';

export function MemoryCard({ event }: { event: TimelineEvent }) {
  const userName = event.user?.display_name ?? 'Unknown';
  const iconEmoji = DAY_ICON_EMOJI[classifyEvent(event)];

  return (
    <View style={styles.card}>
      {event.photo_url && (
        <Image source={{ uri: event.photo_url }} style={styles.photo} />
      )}
      <View style={styles.caption}>
        {event.title && (
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{iconEmoji}</Text>
            <Text style={styles.title}>{event.title}</Text>
          </View>
        )}
        {event.notes && <Text style={styles.notes}>{event.notes}</Text>}
        <Text style={styles.author}>
          {formatDate(event.event_date)} · added by {userName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  photo: {
    width: '100%',
    height: 160,
    backgroundColor: colors.primaryLight,
  },
  caption: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 14 },
  title: { fontFamily: fonts.serifBold, fontSize: 15, color: colors.text },
  notes: { fontFamily: fonts.serif, fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  author: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
