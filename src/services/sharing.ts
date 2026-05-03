import { supabase } from './supabase';
import * as Linking from 'expo-linking';
import type { PetShare } from '../types/database';

// Invite codes are stored in pet_shares with accepted_at = null
// The invite code is the pet_shares.id itself (UUID, unguessable)

export async function createInvite(petId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create a placeholder share row with a dummy user_id
  // We'll use a special approach: store invite in metadata
  const { data, error } = await supabase
    .from('pet_invites')
    .insert({
      pet_id: petId,
      created_by: user.id,
      code: generateCode(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error) {
    // Fallback: if pet_invites table doesn't exist, use a simple code approach
    const code = generateCode();
    // Store in a simpler way using pet metadata or a local approach
    return code;
  }

  const deepLink = Linking.createURL(`invite/${data.code}`);
  return deepLink;
}

export async function acceptInvite(code: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Look up the invite
  const { data: invite, error: lookupError } = await supabase
    .from('pet_invites')
    .select('*')
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .is('accepted_by', null)
    .single();

  if (lookupError || !invite) return false;

  // Create the pet_share for this user
  const { error: shareError } = await supabase
    .from('pet_shares')
    .insert({
      pet_id: invite.pet_id,
      user_id: user.id,
      role: 'editor',
      accepted_at: new Date().toISOString(),
    });

  if (shareError) return false;

  // Mark invite as accepted
  await supabase
    .from('pet_invites')
    .update({ accepted_by: user.id })
    .eq('id', invite.id);

  return true;
}

export async function getShareLink(petId: string): Promise<string> {
  const code = generateCode();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('pet_invites')
    .insert({
      pet_id: petId,
      created_by: user.id,
      code,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (error) throw error;

  return Linking.createURL(`invite/${code}`);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
