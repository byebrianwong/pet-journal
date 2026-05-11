/**
 * Full-page heatmap — Month / 3-Month / Year toggle.
 * Reachable from the home strip's "View all →" link.
 *
 * V1 ships Month view + summary. 3-Month and Year follow in a later iteration.
 */
import React, { useEffect, useState, useMemo } from 'react';
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
import { getTimelineEvents } from '../services/timeline';
import { getMyPets } from '../services/pets';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HeatmapScreen({ navigation }: any) {
  const [summaries, setSummaries] = useState<DaySummaryMap>({});
  const [loading, setLoading] = useState(true);
  const [mode] = useState<'month'>('month'); // future: 'month' | 'three' | 'year'
  const [anchor] = useState(() => new Date());

  useEffect(() => {
    async function load() {
      try {
        const pets = await getMyPets();
        if (pets.length === 0) {
          setLoading(false);
          return;
        }
        const events = await getTimelineEvents(pets[0].id);
        setSummaries(summarizeDays(events));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const days = useMemo(() => monthGrid(anchor), [anchor]);
  const monthName = anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const totals = useMemo(() => computeMonthStats(days, summaries), [days, summaries]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headTitle}>
          <Text style={styles.title}>A year with your pet</Text>
          <Text style={styles.subtitle}>{monthName}</Text>
        </View>
      </View>

      <View style={styles.toggle}>
        <View style={[styles.seg, styles.segActive]}>
          <Text style={styles.segActiveText}>Month</Text>
        </View>
        <View style={styles.seg}>
          <Text style={styles.segText}>3 months</Text>
        </View>
        <View style={styles.seg}>
          <Text style={styles.segText}>Year</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.monthCard}>
          <View style={styles.monthHead}>
            <Text style={styles.monthName}>{monthName}</Text>
            <Text style={styles.monthStat}>
              <Text style={styles.monthStatBold}>{totals.logged} of {totals.total}</Text> days logged
            </Text>
          </View>

          <View style={styles.weekdays}>
            {WEEKDAYS.map((wd, i) => (
              <Text key={i} style={styles.weekday}>{wd}</Text>
            ))}
          </View>

          {chunk(days, 7).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const key = dateKey(d);
                const summary = summaries[key];
                const today = isToday(d);
                const future = isFuture(d);
                return (
                  <View
                    key={i}
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
                      <Text style={styles.cellEmoji}>{DAY_ICON_EMOJI[summary.icon]}</Text>
                    ) : (
                      <View style={styles.emptyDot} />
                    )}
                  </View>
                );
              })}
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
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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

function monthGrid(anchor: Date): (Date | null)[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekday = (first.getDay() + 6) % 7; // Mon=0
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
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 14,
    paddingBottom: 12,
  },
  monthHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  monthName: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.text },
  monthStat: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 11, color: colors.textMuted },
  monthStatBold: { fontFamily: fonts.sansBold, color: colors.primary, fontStyle: 'normal' },
  weekdays: { flexDirection: 'row', marginBottom: 5, gap: 5 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 9, color: colors.textHint },
  row: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cellToday: {
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderWidth: 2,
    backgroundColor: '#fffbed',
  },
  cellTodayPlus: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.primary, lineHeight: 20 },
  cellFuture: { opacity: 0.35 },
  cellEmoji: { fontSize: 14 },
  emptyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.emptyDot },
  summary: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  summaryTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: colors.text, marginBottom: 10 },
  statsGrid: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.primary },
  statLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
