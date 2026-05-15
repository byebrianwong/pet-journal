/**
 * Month / week calendar for the Medications tab.
 *
 * Shared header: prev/next arrows + range label, view toggle is owned
 * by the parent (MedicationsScreen) so the same buttons drive both
 * subcomponents.
 *
 * Conventions:
 *   - Week starts Monday (Mon … Sun).
 *   - "Given" dots/cells are filled in the med's hashed color.
 *   - "Due" dots/cells are outlined in the same color (forecast).
 *   - "Missed" only renders in the week view for daily meds — non-daily
 *     missed cells stay empty so the grid doesn't scream at a user
 *     whose monthly med isn't due yet.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../utils/colors';
import {
  buildMonthCells,
  buildWeekCells,
  medColor,
  monthLabel,
  weekRangeLabel,
  type DayCell,
} from '../utils/medications';
import type { Medication, TimelineEvent } from '../types/database';

interface MonthProps {
  year: number;
  monthIndex: number;
  meds: Medication[];
  logs: TimelineEvent[];
  today?: Date;
}

export function CalendarMonth({ year, monthIndex, meds, logs, today = new Date() }: MonthProps) {
  const cells = buildMonthCells(year, monthIndex, meds, logs, today);

  return (
    <View style={styles.box}>
      <View style={styles.weekHead}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekHeadLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => (
          <DayCellView key={i} cell={cell} />
        ))}
      </View>
    </View>
  );
}

function DayCellView({ cell }: { cell: DayCell }) {
  const hasDots = cell.given.length > 0 || cell.due.length > 0;
  const dayStyle = [
    styles.day,
    cell.inMonth && styles.dayInMonth,
    cell.inMonth && hasDots && styles.dayWithDots,
    cell.isToday && styles.dayToday,
  ];
  const numStyle = [
    styles.dayNum,
    cell.isPast && cell.inMonth && styles.dayNumPast,
    cell.isToday && styles.dayNumToday,
    !cell.inMonth && styles.dayNumOutOfMonth,
  ];
  return (
    <View style={dayStyle}>
      <Text style={numStyle}>{cell.dayNum}</Text>
      <View style={styles.dots}>
        {cell.given.slice(0, 3).map((d, i) => (
          <View key={`g-${i}`} style={[styles.dot, { backgroundColor: d.color.fg }]} />
        ))}
        {cell.due.slice(0, 3).map((d, i) => (
          <View key={`d-${i}`} style={[styles.dotOutlined, { borderColor: d.color.fg }]} />
        ))}
      </View>
    </View>
  );
}

interface WeekProps {
  anchor: Date;
  meds: Medication[];
  logs: TimelineEvent[];
  today?: Date;
}

export function CalendarWeek({ anchor, meds, logs, today = new Date() }: WeekProps) {
  const { columns, cells } = buildWeekCells(anchor, meds, logs, today);

  return (
    <View style={styles.box}>
      <View style={styles.weekViewHead}>
        <View style={styles.weekLabelGutter} />
        {columns.map((col, i) => (
          <View key={i} style={styles.weekDayHead}>
            <Text style={styles.weekDayLetter}>{col.letter}</Text>
            <Text style={[styles.weekDayNum, col.isToday && styles.weekDayNumToday]}>{col.dayNum}</Text>
            {col.isToday && <View style={styles.todayUnderline} />}
          </View>
        ))}
      </View>

      {meds.length === 0 ? (
        <View style={styles.weekEmpty}>
          <Text style={styles.weekEmptyText}>No active medications yet.</Text>
        </View>
      ) : (
        <View style={styles.weekRows}>
          {cells.map((row, medIdx) => {
            const med = meds[medIdx];
            const color = medColor(med.id);
            return (
              <View key={med.id} style={styles.weekRow}>
                <View style={styles.weekRowLabel}>
                  <View style={[styles.medDotSm, { backgroundColor: color.fg }]} />
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.weekRowName} numberOfLines={1}>{med.name}</Text>
                    <Text style={styles.weekRowFreq}>{med.frequency}</Text>
                  </View>
                </View>
                {row.map((cell, dayIdx) => (
                  <WeekCellView key={dayIdx} status={cell.status} color={color} />
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function WeekCellView({ status, color }: { status: 'given' | 'due' | 'missed' | 'empty'; color: { bg: string; fg: string } }) {
  if (status === 'given') {
    return (
      <View style={[styles.weekCell, { backgroundColor: color.bg, borderColor: color.fg }]}>
        <Text style={[styles.weekCellCheck, { color: color.fg }]}>✓</Text>
      </View>
    );
  }
  if (status === 'due') {
    return (
      <View style={[styles.weekCell, styles.weekCellDue]}>
        <Text style={styles.weekCellDueIcon}>💊</Text>
      </View>
    );
  }
  if (status === 'missed') {
    return (
      <View style={[styles.weekCell, styles.weekCellMissed]}>
        <Text style={styles.weekCellMissedX}>×</Text>
      </View>
    );
  }
  return <View style={styles.weekCell} />;
}

// Standalone nav row used by the parent: prev / range / next.
export function CalendarNavRow({
  label,
  sublabel,
  onPrev,
  onNext,
}: {
  label: string;
  sublabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.navRow}>
      <TouchableOpacity style={styles.navArrow} onPress={onPrev}>
        <Text style={styles.navArrowText}>‹</Text>
      </TouchableOpacity>
      <View style={styles.navLabelWrap}>
        <Text style={styles.navLabel}>{label}</Text>
        <Text style={styles.navSub}>{sublabel}</Text>
      </View>
      <TouchableOpacity style={styles.navArrow} onPress={onNext}>
        <Text style={styles.navArrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// Convenience labels used by the parent.
export function monthRangeLabel(year: number, monthIndex: number): string {
  return monthLabel(year, monthIndex);
}
export function weekRangeLabelFor(anchor: Date): string {
  const dow = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - dow);
  return weekRangeLabel(monday);
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
  },
  weekHead: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  weekHeadLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.textHint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  day: {
    width: '13.5%',
    aspectRatio: 1,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  dayInMonth: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  dayWithDots: {
    backgroundColor: colors.surfaceWarm ?? '#fffaec',
  },
  dayToday: {
    backgroundColor: colors.surfaceWarm ?? '#fffaec',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNum: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 11,
  },
  dayNumPast: { color: colors.textMuted },
  dayNumToday: { color: colors.primary },
  dayNumOutOfMonth: { color: 'transparent' },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOutlined: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.4,
    backgroundColor: 'transparent',
  },

  // Week view
  weekViewHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  weekLabelGutter: { width: 76 },
  weekDayHead: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayLetter: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textHint,
  },
  weekDayNum: {
    fontFamily: fonts.serifBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weekDayNumToday: { color: colors.primary },
  todayUnderline: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  weekRows: { flexDirection: 'column', gap: 6 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekRowLabel: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  medDotSm: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  weekRowName: {
    fontFamily: fonts.serifBold,
    fontSize: 12,
    color: colors.text,
    lineHeight: 13,
  },
  weekRowFreq: {
    fontFamily: fonts.cursive,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  weekCell: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCellCheck: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  weekCellDue: {
    backgroundColor: colors.surfaceWarm ?? '#fffaec',
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderWidth: 1.4,
  },
  weekCellDueIcon: { fontSize: 13, opacity: 0.75 },
  weekCellMissed: { opacity: 0.5 },
  weekCellMissedX: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  weekEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  weekEmptyText: {
    fontFamily: fonts.cursive,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 8,
  },
  navArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    lineHeight: 16,
  },
  navLabelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  navLabel: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    color: colors.text,
  },
  navSub: {
    fontFamily: fonts.cursive,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
