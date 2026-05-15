/**
 * Computes the home-feed suggestion cards shown above the journal entries.
 *
 * Rule-based, no ML. Three kinds today:
 *
 *   - photo_cluster: a group of camera-roll photos taken recently
 *     (within 24h) that haven't been added to the journal yet.
 *     Source: expo-media-library via src/services/camera-roll.ts.
 *   - medication_due: a `medications` row with no `medication_log`
 *     event in the last `frequency`-interval window.
 *   - empty_day_nudge: no entries today (and no higher-priority
 *     suggestion already taking the slot). Soft prompt to capture
 *     a moment.
 *
 * Each suggestion is a plain data object the screen renders via the
 * SuggestionCard component.
 */
import type { Medication, TimelineEvent } from '../types/database';
import type { PhotoCluster } from '../services/camera-roll';
import { intervalMs } from './medications';

export type SuggestionKind = 'medication_due' | 'empty_day_nudge' | 'photo_cluster';

export interface Suggestion {
  id: string;                 // stable key for the FlatList
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  thumbnailEmoji?: string;
  thumbnailUri?: string;      // when present, preferred over emoji
  thumbnailKind: 'photo' | 'med' | 'training';
  primaryLabel: string;
  // Embedded payload the screen can use when the user accepts.
  medication?: Medication;
  photoCluster?: PhotoCluster;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  photoClusters?: PhotoCluster[];
  now?: Date;
}): Suggestion[] {
  const now = (input.now ?? new Date()).getTime();
  const out: Suggestion[] = [];

  // ---- Photo clusters from the camera roll ----
  // Cap at 2 so the suggestion lane doesn't get spammed by burst-photo
  // mornings. Most-recent cluster first.
  for (const cluster of (input.photoClusters ?? []).slice(0, 2)) {
    // Don't suggest if we've already linked one of these photos to an
    // existing event — naive check by exact URI in event metadata.
    const used = input.events.some(e =>
      cluster.assets.some(a => e.photo_url === a.uri || (e.metadata as any)?.local_uri === a.uri)
    );
    if (used) continue;

    out.push({
      id: `photo-${cluster.id}`,
      kind: 'photo_cluster',
      title: cluster.label,
      subtitle: cluster.centroidLocation
        ? 'Tap to add as a memory'
        : 'New photos detected — add as a memory?',
      thumbnailUri: cluster.assets[0]?.uri,
      thumbnailKind: 'photo',
      primaryLabel: 'Add',
      photoCluster: cluster,
    });
  }

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
  // If there are no entries today and no higher-priority suggestion has
  // taken the slot, gently prompt them to log something. We don't gate on
  // past activity — sparse loggers and returning users benefit most.
  // todayKey uses the user's *local* date; toISOString() is UTC and would
  // silently shift the boundary by up to a day for non-UTC users.
  const todayKey = new Date(now).toLocaleDateString('en-CA');
  const todayEvents = input.events.filter(e => e.event_date.startsWith(todayKey));
  if (todayEvents.length === 0 && out.length === 0) {
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
