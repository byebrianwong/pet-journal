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

export async function getThrowbackEvents(petId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase.rpc('get_throwback_events', { p_pet_id: petId });
  if (error) throw error;
  return (data ?? []) as TimelineEvent[];
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

/**
 * Upload a photo to a Supabase Storage bucket and return its public URL.
 *
 * Object names are namespaced as `<petId>/<timestamp>-<rand>.jpg` so the
 * storage RLS policies (defined in schema.sql / patch-storage-buckets.sql)
 * can scope read/write to people who share the pet.
 *
 * Buckets:
 *   - 'photos'   (default) — pet memory photos, public read
 *   - 'receipts'           — vet receipt scans, private
 *
 * If the bucket doesn't exist, throw a friendly message pointing at the
 * fix instead of the cryptic supabase error.
 */
export async function uploadPhoto(
  uri: string,
  petId: string,
  bucket: 'photos' | 'receipts' = 'photos',
): Promise<string> {
  const fileName = `${petId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, { contentType: 'image/jpeg' });

  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        `The "${bucket}" storage bucket isn't set up yet. Run supabase/patch-storage-buckets.sql in your Supabase SQL Editor.`,
      );
    }
    if (/policy/i.test(error.message)) {
      throw new Error(
        `Storage upload was rejected by row-level security. Make sure supabase/patch-storage-buckets.sql has been applied so your share grants you upload access for this pet.`,
      );
    }
    throw error;
  }

  if (bucket === 'photos') {
    // Public bucket — direct CDN URL.
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  } else {
    // Private bucket — return a signed URL good for 1 year. (Receipts are
    // shown back to the same family/share group so a long signed URL is
    // fine; we can shorten if we ever expose receipts publicly.)
    const { data, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    if (signErr) throw signErr;
    return data.signedUrl;
  }
}
