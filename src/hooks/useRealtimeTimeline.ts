import { useEffect } from 'react';
import { supabase } from '../services/supabase';

/**
 * Subscribes to real-time inserts on timeline_events for a pet.
 * When the partner adds an entry, onNewEvent fires and the
 * timeline can refresh.
 */
export function useRealtimeTimeline(
  petId: string | null,
  onNewEvent: () => void
) {
  useEffect(() => {
    if (!petId) return;

    const channel = supabase
      .channel(`timeline-${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timeline_events',
          filter: `pet_id=eq.${petId}`,
        },
        () => {
          onNewEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId, onNewEvent]);
}
