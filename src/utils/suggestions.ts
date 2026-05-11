/**
 * Computes the home-feed suggestion cards shown above the journal entries.
 *
 * V1 of this engine is rule-based, server-data only — no camera-roll or
 * location detection yet. Those land when we wire up expo-media-library
 * and expo-location. For now the engine covers:
 *
 *   - Medication overdue: a `medications` row with no `medication_log`
 *     event in the last `frequency`-interval window.
 *   - Empty-day nudge: no entries today and the user has been logging
 *     recently. Soft prompt to capture a moment.
 *
 * Each suggestion is a plain data object the screen renders via the
 * SuggestionCard component.
 */
import type { Medication, TimelineEvent } from '../types/database';

export type SuggestionKind = 'medication_due' | 'empty_day_nudge';

export interface Suggestion {
  id: string;                 // stable key for the FlatList
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  thumbnailEmoji: string;
  thumbnailKind: 'photo' | 'med' | 'training';
  primaryLabel: string;
  // Embedded payload the screen can use when the user accepts.
  medication?: Medication;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Approximate next-due interval (in ms) for a medication based on its
 * `frequency` text. Keep loose — users phrase frequencies in many ways
 * and we'd rather over-prompt than miss a dose.
 */
function intervalMs(frequency: string): number {
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

/**
 * Pretty label for a frequency interval — used in suggestion subtitles
 * (e.g. "Last given 30 days ago" / "due this morning").
 */
function lastGivenLabel(lastMs: number, now: number): string {
  const elapsed = now - lastMs;
  const days = Math.floor(elapsed / ONE_DAY_MS);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'a week ago';
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export function computeSuggestions(input: {
  medications: Medication[];
  events: TimelineEvent[];
  now?: Date;
}): Suggestion[] {
  const now = (input.now ?? new Date()).getTime();
  const out: Suggestion[] = [];

  // ---- Medication overdue ----
  // Only surface non-daily meds (daily reminders are handled by the
  // existing reminder cards) so the suggestion lane doesn't double-up.
  for (const med of input.medications) {
    if (med.end_date) continue;
    const interval = intervalMs(med.frequency);
    if (interval <= ONE_DAY_MS) continue; // daily-ish — handled elsewhere

    const lastLog = input.events
      .filter(e => e.event_type === 'medication_log' && (e.metadata as any)?.medication_id === med.id)
      .map(e => new Date(e.event_date).getTime())
      .sort((a, b) => b - a)[0];

    const lastGiven = lastLog ?? (med.start_date ? new Date(med.start_date).getTime() : null);
    if (lastGiven == null) {
      // never given and just-created — skip to avoid nagging on day 1
      continue;
    }

    if (now - lastGiven >= interval) {
      out.push({
        id: `med-due-${med.id}`,
        kind: 'medication_due',
        title: `${med.name} due today`,
        subtitle: `Last given ${lastGivenLabel(lastGiven, now)}`,
        thumbnailEmoji: '💊',
        thumbnailKind: 'med',
        primaryLabel: 'Done',
        medication: med,
      });
    }
  }

  // ---- Empty-day nudge ----
  // If there are no entries today but the user has been active in the
  // last 7 days, gently prompt them to log something.
  const todayKey = new Date(now).toISOString().slice(0, 10);
  const todayEvents = input.events.filter(e => e.event_date.startsWith(todayKey));
  const weekEvents = input.events.filter(e => now - new Date(e.event_date).getTime() < 7 * ONE_DAY_MS);
  if (todayEvents.length === 0 && weekEvents.length >= 2 && out.length === 0) {
    out.push({
      id: 'nudge-empty',
      kind: 'empty_day_nudge',
      title: 'How was today?',
      subtitle: 'Tap to log a memory, training, or med.',
      thumbnailEmoji: '📖',
      thumbnailKind: 'photo',
      primaryLabel: 'Log',
    });
  }

  return out;
}
