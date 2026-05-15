/**
 * Medication helpers shared by MedicationsScreen, the home-feed
 * suggestion engine, and Storybook.
 *
 * Three responsibilities:
 *   1. Frequency parsing — turn a user-typed "monthly" / "twice daily" / etc.
 *      into a millisecond interval. Used to forecast next-dose dates.
 *   2. Calendar layout — given meds + medication_log events, produce the
 *      grid cells for the Medications tab month / week views.
 *   3. Pretty labels — "2 weeks, 1 day" / "8 hours" / "yesterday".
 */

import type { Medication, TimelineEvent } from '../types/database';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Approximate next-due interval (in ms) for a medication based on its
 * `frequency` text. Keep loose — users phrase frequencies in many ways
 * and we'd rather over-prompt than miss a dose.
 */
export function intervalMs(frequency: string): number {
  const f = (frequency ?? '').toLowerCase();
  if (f.includes('twice')) return ONE_DAY_MS / 2;
  if (f.includes('daily') || f.includes('every day')) return ONE_DAY_MS;
  if (f.includes('weekly') || f.includes('every week')) return 7 * ONE_DAY_MS;
  if (f.includes('biweekly') || f.includes('every 2 weeks')) return 14 * ONE_DAY_MS;
  if (f.includes('monthly') || f.includes('every month')) return 30 * ONE_DAY_MS;
  if (f.includes('every 3 months') || f.includes('quarterly')) return 90 * ONE_DAY_MS;
  // Conservative default for unknown intervals — prompt once a month.
  return 30 * ONE_DAY_MS;
}

// Per-med color palette, hashed from med id so the same med keeps its
// color across the calendar grid, refill section, and next-dose panel.
// Pastel pairs taken from the Living Journal palette in colors.ts.
const MED_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#e0e8f0', fg: '#4a6fa5' }, // blue   (medication)
  { bg: '#fff0d8', fg: '#c4805a' }, // amber  (heartworm-ish)
  { bg: '#e8f5e0', fg: '#5a8f5a' }, // green  (vaccine / activity)
  { bg: '#f0d4c4', fg: '#a85a3a' }, // terra
  { bg: '#e8e0f0', fg: '#6a4a85' }, // purple
  { bg: '#f5d8c8', fg: '#a06030' }, // peach
];

export function medColor(medId: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < medId.length; i++) {
    hash = medId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MED_PALETTE[Math.abs(hash) % MED_PALETTE.length];
}

/**
 * "2 weeks, 1 day" / "8 hours" / "Due now" / "Due today".
 * `big` is the prominent line, `sub` is the optional remainder.
 */
export function formatCountdown(targetMs: number, nowMs: number = Date.now()): { big: string; sub: string; due: boolean } {
  const ms = targetMs - nowMs;
  if (ms <= 0) {
    const overdueDays = Math.floor(-ms / ONE_DAY_MS);
    if (overdueDays === 0) return { big: 'Due now', sub: '', due: true };
    if (overdueDays === 1) return { big: 'Overdue', sub: '1 day late', due: true };
    return { big: 'Overdue', sub: `${overdueDays} days late`, due: true };
  }

  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return { big: `${minutes} min`, sub: '', due: minutes < 30 };

  const hours = Math.floor(ms / ONE_HOUR_MS);
  if (hours < 24) return { big: `${hours} hour${hours === 1 ? '' : 's'}`, sub: '', due: hours < 12 };

  const days = Math.floor(ms / ONE_DAY_MS);
  if (days < 14) {
    const remHours = Math.floor((ms - days * ONE_DAY_MS) / ONE_HOUR_MS);
    return {
      big: `${days} day${days === 1 ? '' : 's'}`,
      sub: remHours > 0 ? `${remHours} hour${remHours === 1 ? '' : 's'}` : '',
      due: false,
    };
  }

  const weeks = Math.floor(days / 7);
  const remDays = days - weeks * 7;
  return {
    big: `${weeks} week${weeks === 1 ? '' : 's'}${remDays > 0 ? `, ${remDays} day${remDays === 1 ? '' : 's'}` : ''}`,
    sub: '',
    due: false,
  };
}

export function formatLastGiven(lastMs: number | null, nowMs: number = Date.now()): string {
  if (lastMs == null) return 'never given';
  const elapsed = nowMs - lastMs;
  const days = Math.floor(elapsed / ONE_DAY_MS);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'a week ago';
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// "Calculate when this med is next due" — uses the most recent
// medication_log event for this med, falling back to start_date.
export function nextDoseFor(med: Medication, logs: TimelineEvent[]): {
  lastAt: number | null;
  nextAt: number;
  interval: number;
} {
  const interval = intervalMs(med.frequency);
  const medLogs = logs
    .filter(e => e.event_type === 'medication_log' && (e.metadata as any)?.medication_id === med.id)
    .map(e => new Date(e.event_date).getTime())
    .sort((a, b) => b - a);

  const lastAt = medLogs[0] ?? (med.start_date ? new Date(med.start_date).getTime() : null);
  const baseline = lastAt ?? Date.now();
  return { lastAt, nextAt: baseline + interval, interval };
}

// --- Calendar grid helpers -------------------------------------------------

export interface DayCell {
  date: Date;          // anchored to local midnight
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  given: { medId: string; color: { bg: string; fg: string } }[];
  due: { medId: string; color: { bg: string; fg: string } }[];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Build a 6-row Mon-Sun grid for a given month, including leading and trailing
 * cells from adjacent months so the grid is always 42 cells. Each cell records
 * which meds were given that day and which are forecast to be due.
 *
 * Forecast: from each med's last log (or start_date), step forward by
 * intervalMs until we leave the calendar window. Daily meds only forecast
 * future days (no need to clutter every empty future cell — the next-dose
 * panel handles the "what's due tomorrow" question).
 */
export function buildMonthCells(
  year: number,
  monthIndex: number,
  meds: Medication[],
  logs: TimelineEvent[],
  today: Date = new Date(),
): DayCell[] {
  const todayMid = startOfDay(today);
  const first = new Date(year, monthIndex, 1);
  // Monday-first: 0 = Sunday in JS. Map to 0=Mon..6=Sun.
  const dayOfWeek = (first.getDay() + 6) % 7;

  const cells: DayCell[] = [];
  // Leading days from previous month
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    cells.push(emptyCell(d, monthIndex, todayMid));
  }
  // Days in this month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push(emptyCell(d, monthIndex, todayMid));
  }
  // Trailing days to fill to 42
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push(emptyCell(d, monthIndex, todayMid));
  }

  // Populate `given` from medication_log events
  const logsByDay = new Map<string, { medId: string }[]>();
  for (const ev of logs) {
    if (ev.event_type !== 'medication_log') continue;
    const medId = (ev.metadata as any)?.medication_id;
    if (!medId) continue;
    const d = new Date(ev.event_date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = logsByDay.get(key) ?? [];
    arr.push({ medId });
    logsByDay.set(key, arr);
  }
  for (const cell of cells) {
    const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
    const entries = logsByDay.get(key) ?? [];
    for (const e of entries) {
      cell.given.push({ medId: e.medId, color: medColor(e.medId) });
    }
  }

  // Populate `due` from forecast — step forward from last log by interval.
  const winStart = cells[0].date.getTime();
  const winEnd = cells[cells.length - 1].date.getTime() + ONE_DAY_MS;
  for (const med of meds) {
    if (med.end_date) continue;
    const { nextAt, interval } = nextDoseFor(med, logs);
    // Daily meds: too noisy to forecast every future cell. The next-doses
    // panel makes "tomorrow at 8 AM" clear enough.
    if (interval <= ONE_DAY_MS) continue;

    let t = nextAt;
    let safety = 0;
    while (t < winEnd && safety < 50) {
      if (t >= winStart) {
        const d = new Date(t);
        const cell = cells.find(c => sameDay(c.date, d));
        if (cell && !cell.given.some(g => g.medId === med.id)) {
          cell.due.push({ medId: med.id, color: medColor(med.id) });
        }
      }
      t += interval;
      safety++;
    }
  }

  return cells;
}

function emptyCell(date: Date, monthIndex: number, todayMid: Date): DayCell {
  return {
    date,
    dayNum: date.getDate(),
    inMonth: date.getMonth() === monthIndex,
    isToday: sameDay(date, todayMid),
    isPast: date.getTime() < todayMid.getTime(),
    given: [],
    due: [],
  };
}

// --- Week view -------------------------------------------------------------

export interface WeekColumn {
  date: Date;
  dayNum: number;
  letter: string;   // 'M' / 'T' / 'W' / 'T' / 'F' / 'S' / 'S'
  isToday: boolean;
}

export interface WeekCell {
  med: Medication;
  status: 'given' | 'due' | 'missed' | 'empty';
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Monday-start week containing `anchor`. Returns the 7 columns + a
 * (rows × cols) cell matrix indexed [medIdx][dayIdx].
 */
export function buildWeekCells(
  anchor: Date,
  meds: Medication[],
  logs: TimelineEvent[],
  today: Date = new Date(),
): { columns: WeekColumn[]; cells: WeekCell[][] } {
  const todayMid = startOfDay(today);
  const anchorDow = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchorDow);

  const columns: WeekColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    columns.push({
      date: d,
      dayNum: d.getDate(),
      letter: DAY_LETTERS[i],
      isToday: sameDay(d, todayMid),
    });
  }

  // Pre-index logs by (medId, day)
  const givenSet = new Set<string>();
  for (const ev of logs) {
    if (ev.event_type !== 'medication_log') continue;
    const medId = (ev.metadata as any)?.medication_id;
    if (!medId) continue;
    const d = new Date(ev.event_date);
    givenSet.add(`${medId}|${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  // Pre-compute forecast-due days per med
  const dueSet = new Set<string>();
  const weekStart = monday.getTime();
  const weekEnd = monday.getTime() + 7 * ONE_DAY_MS;
  for (const med of meds) {
    if (med.end_date) continue;
    const interval = intervalMs(med.frequency);
    const { nextAt } = nextDoseFor(med, logs);
    let t = nextAt;
    let safety = 0;
    while (t < weekEnd && safety < 50) {
      if (t >= weekStart) {
        const d = new Date(t);
        dueSet.add(`${med.id}|${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
      t += interval;
      safety++;
    }
  }

  const cells: WeekCell[][] = meds.map((med) => {
    const interval = intervalMs(med.frequency);
    const isDaily = interval <= ONE_DAY_MS;
    return columns.map((col) => {
      const key = `${med.id}|${col.date.getFullYear()}-${col.date.getMonth()}-${col.date.getDate()}`;
      if (givenSet.has(key)) return { med, status: 'given' as const };
      if (dueSet.has(key)) return { med, status: 'due' as const };
      // For daily meds, past empty cell = missed; future/today = empty.
      if (isDaily && col.date.getTime() < todayMid.getTime()) {
        return { med, status: 'missed' as const };
      }
      return { med, status: 'empty' as const };
    });
  });

  return { columns, cells };
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function weekRangeLabel(monday: Date): string {
  const sun = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  if (monday.getMonth() === sun.getMonth()) {
    return `${month(monday)} ${monday.getDate()} – ${sun.getDate()}`;
  }
  return `${month(monday)} ${monday.getDate()} – ${month(sun)} ${sun.getDate()}`;
}
