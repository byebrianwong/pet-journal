export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function groupByDate<T extends { event_date: string }>(events: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const event of events) {
    const label = formatRelativeDate(event.event_date);
    const existing = groups.get(label) ?? [];
    existing.push(event);
    groups.set(label, existing);
  }

  return groups;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// User's local YYYY-MM-DD (en-CA renders ISO format). Use this anywhere the
// "what day is it" decision is calendar-driven from the user's perspective,
// since toISOString() / new Date().toISOString() are UTC and silently shift.
export function todayLocalISO(): string {
  return new Date().toLocaleDateString('en-CA');
}
