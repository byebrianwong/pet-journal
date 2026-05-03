import { fiCollar } from './fi-collar';
import { supabase } from './supabase';
import { todayISO } from '../utils/dates';

/**
 * Syncs Fi Collar activity data for a pet, creating or updating
 * today's fi_activity timeline event. Called on app foreground
 * and by background fetch.
 */
export async function syncFiActivity(petId: string): Promise<boolean> {
  const configured = await fiCollar.isConfigured();
  if (!configured) return false;

  const today = todayISO();

  try {
    // Fetch activity from Fi. petId here is the Fi pet ID.
    // For V1, we assume the Fi pet ID matches. A mapping table
    // could be added later if the user has multiple Fi pets.
    const activity = await fiCollar.getActivity(petId, today);
    if (!activity) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if today's fi_activity event already exists
    const { data: existing } = await supabase
      .from('timeline_events')
      .select('id')
      .eq('pet_id', petId)
      .eq('event_type', 'fi_activity')
      .gte('event_date', `${today}T00:00:00`)
      .lt('event_date', `${today}T23:59:59`)
      .single();

    const metadata = {
      steps: activity.steps,
      distance_miles: Math.round(activity.distance_miles * 100) / 100,
      rest_hours: Math.round(activity.rest_hours * 10) / 10,
      goal_pct: Math.round(activity.goal_pct),
    };

    if (existing) {
      // Update existing
      await supabase
        .from('timeline_events')
        .update({ metadata })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('timeline_events')
        .insert({
          pet_id: petId,
          user_id: user.id,
          event_type: 'fi_activity',
          event_date: new Date().toISOString(),
          title: "Today's Activity",
          metadata,
        });
    }

    return true;
  } catch (err) {
    console.warn('Fi sync failed:', err);
    return false;
  }
}
