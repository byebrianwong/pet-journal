import { getMockState } from './state';
import type { TimelineEvent } from '../../src/types/database';

export async function getTimelineEvents(_petId: string): Promise<TimelineEvent[]> {
  return getMockState().events;
}

export async function getThrowbackEvents(_petId: string, _today?: string): Promise<TimelineEvent[]> {
  return getMockState().throwbacks ?? [];
}

export async function createTimelineEvent(params: any): Promise<TimelineEvent> {
  return {
    id: `evt-${Date.now()}`,
    pet_id: params.petId,
    user_id: 'mock-user-1',
    event_type: params.eventType,
    event_date: params.eventDate,
    title: params.title ?? null,
    notes: params.notes ?? null,
    photo_url: params.photoUrl ?? null,
    metadata: params.metadata ?? {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function uploadPhoto(_uri: string, _petId: string, _bucket?: string): Promise<string> {
  return 'https://placehold.co/600x400/c4a882/fff?text=Photo';
}
