/**
 * 2-week compact strip showing one cell per day. Today's cell shows a
 * "+" prompt. Past days fill with their primary day-icon. Future days
 * stay dotted. Tap "View all" to navigate to the full heatmap page.
 *
 * Matches the V2 design exploration (final-v2 board, 2026-05-10).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../utils/colors';
import {
  DAY_ICON_EMOJI,
  dateKey,
  isFuture,
  isToday,
  type DaySummaryMap,
  weekAlignedWindow,
} from '../utils/dayIcons';

interface Props {
  summaries: DaySummaryMap;
  weeks?: number;
  onViewAll?: () => void;
  onPressDay?: (date: Date) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HeatmapStrip({
  summaries,
  weeks = 2,
  onViewAll,
  onPressDay,
}: Props) {
  const days = weekAlignedWindow(weeks);

  const totalDays = days.filter(d => !isFuture(d)).length;
  const loggedDays = days.filter(d => !isFuture(d) && summaries[dateKey(d)]).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>
          Last {weeks} weeks · <Text style={styles.titleAccent}>{loggedDays} of {totalDays}</Text> logged
        </Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.link}>View all →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((wd, i) => (
          <Text key={i} style={styles.weekday}>{wd}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {chunk(days, 7).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((d, i) => {
              const key = dateKey(d);
              const summary = summaries[key];
              const today = isToday(d);
              const future = isFuture(d);

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={onPressDay ? 0.6 : 1}
                  onPress={() => onPressDay?.(d)}
                  style={[
                    styles.cell,
                    today && styles.cellToday,
                    future && styles.cellFuture,
                    summary && !today && cellStyleFor(summary.icon),
                  ]}
                >
                  {today ? (
                    <Text style={styles.cellTodayPlus}>+</Text>
                  ) : summary ? (
                    <>
                      <Text style={styles.cellEmoji}>{DAY_ICON_EMOJI[summary.icon]}</Text>
                      {summary.multi && <View style={styles.multiDot} />}
                    </>
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function cellStyleFor(icon: keyof typeof colors.dayPhoto extends never ? never : any) {
  const map = {
    photo: { backgroundColor: colors.dayPhoto.bg, borderColor: colors.dayPhoto.border },
    training: { backgroundColor: colors.dayTraining.bg, borderColor: colors.dayTraining.border },
    activity: { backgroundColor: colors.dayActivity.bg, borderColor: colors.dayActivity.border },
    med: { backgroundColor: colors.dayMed.bg, borderColor: colors.dayMed.border },
    reaction: { backgroundColor: colors.dayReaction.bg, borderColor: colors.dayReaction.border },
    milestone: { backgroundColor: colors.dayMilestone.bg, borderColor: colors.dayMilestone.border },
  } as const;
  return map[icon as keyof typeof map];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 12,
    paddingBottom: 10,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 13,
    color: colors.text,
  },
  titleAccent: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.success,
  },
  link: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.primary,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.textHint,
    letterSpacing: 0.5,
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cellToday: {
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderWidth: 2,
    backgroundColor: '#fffbed',
  },
  cellTodayPlus: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.primary,
    lineHeight: 20,
  },
  cellFuture: {
    opacity: 0.35,
  },
  cellEmoji: {
    fontSize: 14,
  },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.emptyDot,
  },
  multiDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
