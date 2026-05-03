import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../../utils/colors';
import { formatDate } from '../../utils/dates';
import type { TimelineEvent } from '../../types/database';

export function MemoryCard({ event }: { event: TimelineEvent }) {
  const userName = event.user?.display_name ?? 'Unknown';

  return (
    <View style={styles.card}>
      {event.photo_url && (
        <Image source={{ uri: event.photo_url }} style={styles.photo} />
      )}
      <View style={styles.caption}>
        {event.title && <Text style={styles.title}>{event.title}</Text>}
        {event.notes && <Text style={styles.notes}>{event.notes}</Text>}
        <Text style={styles.author}>
          Added by {userName} · {formatDate(event.event_date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: colors.primaryLight,
  },
  caption: { padding: 12 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  notes: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  author: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
