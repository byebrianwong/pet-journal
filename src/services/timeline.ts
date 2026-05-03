import { supabase } from './supabase';
import type { TimelineEvent, EventType, EventMetadata } from '../types/database';

export async function getTimelineEvents(petId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*, user:users(id, display_name, avatar_url)')
    .eq('pet_id', petId)
    .order('event_date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function createTimelineEvent(params: {
  petId: string;
  eventType: EventType;
  eventDate: string;
  title?: string;
  notes?: string;
  photoUrl?: string;
  metadata?: EventMetadata;
}): Promise<TimelineEvent> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      pet_id: params.petId,
      user_id: user.id,
      event_type: params.eventType,
      event_date: params.eventDate,
      title: params.title ?? null,
      notes: params.notes ?? null,
      photo_url: params.photoUrl ?? null,
      metadata: params.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadPhoto(uri: string, bucket: string = 'photos'): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, { contentType: 'image/jpeg' });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
