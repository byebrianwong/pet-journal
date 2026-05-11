/**
 * Dashed-border suggestion card for the home feed. Used for:
 *   - "4 photos from Lake Park — add memory?"
 *   - "Flea & tick due today"
 *   - "You opened the app for ~1h around family — log training?"
 *
 * The thumbnail can be a real image (memory suggestion) or an emoji
 * (medication / training suggestion).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, fonts } from '../utils/colors';

interface Props {
  title: string;
  subtitle: string;
  thumbnailUri?: string;
  thumbnailEmoji?: string;
  thumbnailKind?: 'photo' | 'med' | 'training';
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function SuggestionCard({
  title,
  subtitle,
  thumbnailUri,
  thumbnailEmoji,
  thumbnailKind = 'photo',
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  const kindBg = {
    photo: '#fff',
    med: colors.dayMed.bg,
    training: colors.dayTraining.bg,
  }[thumbnailKind];

  return (
    <View style={styles.card}>
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumbEmoji, { backgroundColor: kindBg }]}>
          <Text style={styles.thumbEmojiText}>{thumbnailEmoji ?? '📷'}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primary} onPress={onPrimary}>
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </TouchableOpacity>
        {secondaryLabel && onSecondary && (
          <TouchableOpacity onPress={onSecondary}>
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffbed',
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 10,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.backgroundDim,
  },
  thumbEmoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbEmojiText: { fontSize: 22 },
  body: { flex: 1 },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.serif,
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: { gap: 4, alignItems: 'flex-end' },
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  primaryText: {
    color: '#fff',
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  secondaryText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
  },
});
