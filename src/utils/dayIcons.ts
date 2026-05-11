/**
 * Classifies which icon a calendar day cell should render based on the
 * timeline events that fell on that day. The rule (most → least emotional):
 *
 *   milestone > tough day > training > outing > med > memory
 *
 * Days with no events stay empty (dotted in the UI). Multi-event days
 * still resolve to a single primary icon plus a `multi` flag so the cell
 * can show a small dot in the corner.
 */
import type { TimelineEvent } from '../types/database';

export type DayIcon =
  | 'photo'        // 📷 memory (default)
  | 'training'     // 🎯
  | 'activity'     // 🐾 outing / walk
  | 'med'          // 💊
  | 'reaction'     // ⚠️ tough day
  | 'milestone';   // ⭐

export const DAY_ICON_EMOJI: Record<DayIcon, string> = {
  photo: '📷',
  training: '🎯',
  activity: '🐾',
  med: '💊',
  reaction: '⚠️',
  milestone: '⭐',
};

export const DAY_ICON_LABEL: Record<DayIcon, string> = {
  photo: 'memory',
  training: 'training',
  activity: 'outing',
  med: 'medication',
  reaction: 'tough day',
  milestone: 'milestone',
};

// Priority order — lower index wins on multi-event days.
const PRIORITY: DayIcon[] = ['milestone', 'reaction', 'training', 'activity', 'med', 'photo'];

export interface DaySummary {
  icon: DayIcon;
  multi: boolean;          // true if 2+ distinct event types that day
  eventCount: number;
}

export type DaySummaryMap = Record<string, DaySummary>;

/**
 * dateKey is YYYY-MM-DD in the local tz. Use this for stable lookups.
 */
export function dateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Classify a single event into a DayIcon. Order of escalation:
 *   milestone > tough_moment > entry_kind override > event_type default
 *
 * Tough moments win regardless of underlying type — a "training around
 * family with one reaction" entry is a training+tough_moment combo and
 * shows as ⚠️ on the heatmap, not 🎯. That's the whole point of the
 * tough-moment flag — to make hard days visible without forcing the
 * user to count reactions per session.
 */
export function classifyEvent(event: TimelineEvent): DayIcon {
  const meta = (event.metadata ?? {}) as any;

  // 1. Milestones always win.
  if (meta.is_milestone) return 'milestone';

  // 2. Tough moments escalate any event type to 'reaction'.
  if (meta.tough_moment === true || (typeof meta.reaction_count === 'number' && meta.reaction_count > 0)) {
    return 'reaction';
  }

  // 3. Type-specific defaults.
  if (event.event_type === 'medication_log') {
    // Daily meds shouldn't flood the calendar — only non-daily count.
    const isDaily = meta.frequency === 'daily';
    return isDaily ? 'photo' : 'med';
  }
  if (event.event_type === 'vet_visit') return 'med';
  if (event.event_type === 'fi_activity') return 'activity';

  // 4. Memory entries can be tagged with an entry_kind override.
  if (event.event_type === 'memory') {
    if (meta.entry_kind === 'training') return 'training';
    if (meta.entry_kind === 'outing') return 'activity';
    return 'photo';
  }

  return 'photo';
}

/**
 * Build a date-keyed summary map from a list of events. Use this to feed
 * the HeatmapStrip and HeatmapFullPage components.
 */
export function summarizeDays(events: TimelineEvent[]): DaySummaryMap {
  const buckets: Record<string, DayIcon[]> = {};
  for (const event of events) {
    const key = dateKey(event.event_date);
    const icon = classifyEvent(event);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(icon);
  }
  const result: DaySummaryMap = {};
  for (const key in buckets) {
    const icons = buckets[key];
    // pick the highest-priority icon
    let chosen: DayIcon = 'photo';
    for (const p of PRIORITY) {
      if (icons.includes(p)) {
        chosen = p;
        break;
      }
    }
    const uniqueKinds = new Set(icons).size;
    result[key] = {
      icon: chosen,
      multi: uniqueKinds > 1,
      eventCount: icons.length,
    };
  }
  return result;
}

/**
 * Return an array of the last N days as Date objects, oldest first.
 * Used by HeatmapStrip to build its grid.
 */
export function lastNDays(n: number, asOf: Date = new Date()): Date[] {
  const result: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(asOf);
    d.setDate(d.getDate() - i);
    result.push(d);
  }
  return result;
}

/**
 * For the strip view: align the visible window to a weekday-grid so users
 * read it like a real calendar. Returns days from the Monday of (today's
 * week - (weeks-1)) up through next Sunday — fills the last few cells
 * with "future" Dates so the grid is always weeks*7 cells.
 */
export function weekAlignedWindow(weeks: number, asOf: Date = new Date()): Date[] {
  // Monday of current week (treating Monday as week start)
  const today = new Date(asOf);
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - (weeks - 1) * 7);

  const result: Date[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(d);
  }
  return result;
}

export function isToday(d: Date, asOf: Date = new Date()): boolean {
  return dateKey(d) === dateKey(asOf);
}

export function isFuture(d: Date, asOf: Date = new Date()): boolean {
  return d.getTime() > new Date(dateKey(asOf) + 'T23:59:59').getTime();
}
