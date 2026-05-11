/**
 * Full-page heatmap — Month / 3-Month / Year toggle + tap-to-drill.
 *
 *   Month: 7-col weekday grid with full-size cells. The home strip
 *   already shows 2 weeks of this; the full Month view shows the
 *   entire current month.
 *
 *   3 months: three smaller month tiles stacked. Same emoji rendering
 *   at a more compressed size.
 *
 *   Year: 12 monthly tiles in a 3-column grid showing density via
 *   color intensity (no emojis at this scale — cells are too small).
 *
 * Tapping any past cell opens the DayDetailSheet with that day's
 * events. Tapping today's cell does nothing here (today is the
 * home tab's job).
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../utils/colors';
import {
  DAY_ICON_EMOJI,
  dateKey,
  isFuture,
  isToday,
  summarizeDays,
  type DayIcon,
  type DaySummaryMap,
} from '../utils/dayIcons';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { getTimelineEvents } from '../services/timeline';
import { getMyPets } from '../services/pets';
import type { TimelineEvent } from '../types/database';

type Mode = 'month' | 'three' | 'year';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HeatmapScreen({ navigation }: any) {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [summaries, setSummaries] = useState<DaySummaryMap>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('month');
  const [openDate, setOpenDate] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const pets = await getMyPets();
        if (pets.length === 0) {
          setLoading(false);
          return;
        }
        const events = await getTimelineEvents(pets[0].id);
        setAllEvents(events);
        setSummaries(summarizeDays(events));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCellTap = useCallback((d: Date) => {
    if (isFuture(d)) return;
    if (isToday(d)) {
      // Today is the home screen's job — bounce them back.
      navigation.goBack();
      return;
    }
    setOpenDate(d);
  }, [navigation]);

  const openEvents = useMemo(() => {
    if (!openDate) return [];
    const k = dateKey(openDate);
    return allEvents
      .filter(e => dateKey(e.event_date) === k)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [openDate, allEvents]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headTitle}>
          <Text style={styles.title}>A year with your pet</Text>
          <Text style={styles.subtitle}>Tap any day to see what happened</Text>
        </View>
      </View>

      <View style={styles.toggle}>
        {(['month', 'three', 'year'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.seg, mode === m && styles.segActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.segText, mode === m && styles.segActiveText]}>
              {m === 'month' ? 'Month' : m === 'three' ? '3 months' : 'Year'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {mode === 'month' && <MonthView anchor={new Date()} summaries={summaries} onCellTap={handleCellTap} />}
        {mode === 'three' && <ThreeMonthView summaries={summaries} onCellTap={handleCellTap} />}
        {mode === 'year' && <YearView summaries={summaries} onMonthTap={(d) => { setMode('month'); /* would scroll to month */ }} />}
      </ScrollView>

      <DayDetailSheet
        date={openDate}
        events={openEvents}
        onClose={() => setOpenDate(null)}
      />
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------
// Month View (full-size cells)
// ----------------------------------------------------------------

function MonthView({
  anchor, summaries, onCellTap,
}: { anchor: Date; summaries: DaySummaryMap; onCellTap: (d: Date) => void }) {
  const days = monthGrid(anchor);
  const monthName = anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const totals = computeMonthStats(days, summaries);

  return (
    <>
      <View style={styles.monthCard}>
        <View style={styles.monthHead}>
          <Text style={styles.monthName}>{monthName}</Text>
          <Text style={styles.monthStat}>
            <Text style={styles.monthStatBold}>{totals.logged} of {totals.total}</Text> days logged
          </Text>
        </View>
        <View style={styles.weekdays}>
          {WEEKDAYS.map((wd, i) => <Text key={i} style={styles.weekday}>{wd}</Text>)}
        </View>
        {chunk(days, 7).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((d, i) => (
              <MonthCell key={i} date={d} summaries={summaries} onTap={onCellTap} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{monthName.split(' ')[0]} at a glance</Text>
        <View style={styles.statsGrid}>
          <Stat num={totals.logged} label="days logged" />
          <Stat num={totals.byKind.photo + totals.byKind.activity} label="photos & outings" />
          <Stat num={totals.byKind.training} label="training" />
        </View>
      </View>
    </>
  );
}

function MonthCell({
  date, summaries, onTap, compact,
}: { date: Date | null; summaries: DaySummaryMap; onTap: (d: Date) => void; compact?: boolean }) {
  if (!date) return <View style={[compact ? styles.cellSmall : styles.cell]} />;
  const summary = summaries[dateKey(date)];
  const today = isToday(date);
  const future = isFuture(date);

  return (
    <TouchableOpacity
      activeOpacity={future ? 1 : 0.6}
      onPress={() => onTap(date)}
      disabled={future}
      style={[
        compact ? styles.cellSmall : styles.cell,
        today && styles.cellToday,
        future && styles.cellFuture,
        summary && !today && cellStyleFor(summary.icon),
      ]}
    >
      {today ? (
        <Text style={compact ? styles.cellSmallTodayPlus : styles.cellTodayPlus}>+</Text>
      ) : summary ? (
        <Text style={compact ? styles.cellSmallEmoji : styles.cellEmoji}>{DAY_ICON_EMOJI[summary.icon]}</Text>
      ) : (
        <View style={styles.emptyDot} />
      )}
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------
// 3-Month View
// ----------------------------------------------------------------

function ThreeMonthView({
  summaries, onCellTap,
}: { summaries: DaySummaryMap; onCellTap: (d: Date) => void }) {
  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1),
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
    new Date(now.getFullYear(), now.getMonth(), 1),
  ];

  return (
    <>
      {months.map((anchor, idx) => {
        const days = monthGrid(anchor);
        const monthName = anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
        const totals = computeMonthStats(days, summaries);
        return (
          <View key={idx} style={styles.monthCard}>
            <View style={styles.monthHead}>
              <Text style={styles.monthName}>{monthName}</Text>
              <Text style={styles.monthStat}>
                <Text style={styles.monthStatBold}>{totals.logged}</Text> days
              </Text>
            </View>
            <View style={styles.weekdays}>
              {WEEKDAYS.map((wd, i) => <Text key={i} style={styles.weekday}>{wd}</Text>)}
            </View>
            {chunk(days, 7).map((row, rowIdx) => (
              <View key={rowIdx} style={styles.rowCompact}>
                {row.map((d, i) => (
                  <MonthCell key={i} date={d} summaries={summaries} onTap={onCellTap} compact />
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

// ----------------------------------------------------------------
// Year View (12 tiny tiles, color-density only)
// ----------------------------------------------------------------

function YearView({
  summaries, onMonthTap,
}: { summaries: DaySummaryMap; onMonthTap: (anchor: Date) => void }) {
  const now = new Date();
  const startMonth = now.getMonth() - 11;
  const months: Date[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(new Date(now.getFullYear(), startMonth + i, 1));
  }

  let totalLogged = 0;
  let totalKinds: Record<DayIcon, number> = { photo: 0, training: 0, activity: 0, med: 0, reaction: 0, milestone: 0 };
  for (const k in summaries) {
    totalLogged++;
    totalKinds[summaries[k].icon]++;
  }

  return (
    <>
      <View style={styles.yearHeaderCard}>
        <Text style={styles.yearHeaderTitle}>{months[0].toLocaleString(undefined, { month: 'short', year: 'numeric' })} → {months[11].toLocaleString(undefined, { month: 'short', year: 'numeric' })}</Text>
        <Text style={styles.yearHeaderStat}>
          <Text style={styles.monthStatBold}>{totalLogged}</Text> days · <Text style={styles.monthStatBold}>{totalKinds.photo + totalKinds.activity}</Text> photos & outings · <Text style={styles.monthStatBold}>{totalKinds.milestone}</Text> milestones
        </Text>
      </View>

      <View style={styles.yearGrid}>
        {months.map((anchor, idx) => (
          <YearMonthTile
            key={idx}
            anchor={anchor}
            summaries={summaries}
            onPress={() => onMonthTap(anchor)}
          />
        ))}
      </View>
    </>
  );
}

function YearMonthTile({
  anchor, summaries, onPress,
}: { anchor: Date; summaries: DaySummaryMap; onPress: () => void }) {
  const days = monthGrid(anchor);
  const filtered = days.filter(d => d !== null) as Date[];
  return (
    <TouchableOpacity style={styles.yearTile} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.yearTileLabel}>{anchor.toLocaleString(undefined, { month: 'short' })}</Text>
      <View style={styles.yearTileGrid}>
        {filtered.map((d, i) => {
          const summary = summaries[dateKey(d)];
          const future = isFuture(d);
          const today = isToday(d);
          return (
            <View
              key={i}
              style={[
                styles.yearTileCell,
                summary && yearCellStyle(summary.icon),
                future && styles.yearTileCellFuture,
                today && styles.yearTileCellToday,
              ]}
            />
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function cellStyleFor(icon: DayIcon) {
  const map: Record<DayIcon, { backgroundColor: string; borderColor: string }> = {
    photo: { backgroundColor: colors.dayPhoto.bg, borderColor: colors.dayPhoto.border },
    training: { backgroundColor: colors.dayTraining.bg, borderColor: colors.dayTraining.border },
    activity: { backgroundColor: colors.dayActivity.bg, borderColor: colors.dayActivity.border },
    med: { backgroundColor: colors.dayMed.bg, borderColor: colors.dayMed.border },
    reaction: { backgroundColor: colors.dayReaction.bg, borderColor: colors.dayReaction.border },
    milestone: { backgroundColor: colors.dayMilestone.bg, borderColor: colors.dayMilestone.border },
  };
  return map[icon];
}

// At year-tile scale, we just use a flat fill color per kind. Border
// is omitted because the cells are 4-5px.
function yearCellStyle(icon: DayIcon): any {
  return { backgroundColor: cellStyleFor(icon).borderColor };
}

function monthGrid(anchor: Date): (Date | null)[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekday = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function computeMonthStats(days: (Date | null)[], summaries: DaySummaryMap) {
  let logged = 0;
  let total = 0;
  const byKind: Record<DayIcon, number> = {
    photo: 0, training: 0, activity: 0, med: 0, reaction: 0, milestone: 0,
  };
  for (const d of days) {
    if (!d || isFuture(d)) continue;
    total++;
    const s = summaries[dateKey(d)];
    if (s) {
      logged++;
      byKind[s.icon]++;
    }
  }
  return { logged, total, byKind };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8, gap: 14 },
  back: { fontSize: 22, color: colors.primary, fontWeight: '300' },
  headTitle: { flex: 1 },
  title: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.text },
  subtitle: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 12, color: colors.textMuted },

  toggle: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 12,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 3,
  },
  seg: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 11 },
  segActive: { backgroundColor: '#fff' },
  segText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.textMuted },
  segActiveText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.text },

  monthCard: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: 14, padding: 14, paddingBottom: 12,
  },
  monthHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  monthName: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.text },
  monthStat: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 11, color: colors.textMuted },
  monthStatBold: { fontFamily: fonts.sansBold, color: colors.primary, fontStyle: 'normal' },

  weekdays: { flexDirection: 'row', marginBottom: 5, gap: 5 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 9, color: colors.textHint },
  row: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  rowCompact: { flexDirection: 'row', gap: 3, marginBottom: 3 },

  cell: {
    flex: 1, aspectRatio: 1, borderRadius: 7,
    borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cellSmall: {
    flex: 1, aspectRatio: 1, borderRadius: 4,
    borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cellToday: {
    borderColor: colors.primary, borderStyle: 'dashed', borderWidth: 2,
    backgroundColor: '#fffbed',
  },
  cellTodayPlus: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.primary, lineHeight: 20 },
  cellSmallTodayPlus: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary, lineHeight: 14 },
  cellFuture: { opacity: 0.35 },
  cellEmoji: { fontSize: 14 },
  cellSmallEmoji: { fontSize: 10 },
  emptyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.emptyDot },

  summary: {
    marginHorizontal: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14,
  },
  summaryTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: colors.text, marginBottom: 10 },
  statsGrid: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.primary },
  statLabel: {
    fontFamily: fonts.sansBold, fontSize: 10, color: colors.textMuted,
    fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
  },

  // Year view
  yearHeaderCard: {
    marginHorizontal: 16, marginBottom: 12,
    padding: 14, backgroundColor: colors.surfaceWarm,
    borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong,
  },
  yearHeaderTitle: { fontFamily: fonts.serifBold, fontSize: 14, color: colors.text },
  yearHeaderStat: { fontFamily: fonts.serif, fontSize: 11, color: colors.textMuted, marginTop: 4 },

  yearGrid: {
    marginHorizontal: 16,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  yearTile: {
    width: '31%',
    backgroundColor: colors.surfaceWarm,
    borderRadius: 10, padding: 8, borderWidth: 1, borderColor: colors.borderStrong,
  },
  yearTileLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.textHint,
    textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },
  yearTileGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 1.5,
    justifyContent: 'flex-start',
  },
  yearTileCell: {
    width: '13%', aspectRatio: 1, borderRadius: 1.5,
    backgroundColor: colors.emptyDot, opacity: 0.4,
  },
  yearTileCellFuture: { opacity: 0.15 },
  yearTileCellToday: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary, opacity: 1 },
});
