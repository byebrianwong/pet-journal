import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, Share, TouchableOpacity,
} from 'react-native';
import { colors } from '../utils/colors';
import { notify, confirm } from '../utils/feedback';
import { getPetShares } from '../services/pets';
import { getShareLink } from '../services/sharing';
import { supabase } from '../services/supabase';
import type { PetShare } from '../types/database';

type ShareWithUser = PetShare & { user: { display_name: string; avatar_url: string | null } };

export function SharingScreen({ route }: any) {
  const { petId, petName } = route.params;
  const [shares, setShares] = useState<ShareWithUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadShares = useCallback(async () => {
    const data = await getPetShares(petId);
    setShares(data);
  }, [petId]);

  useEffect(() => {
    loadShares();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, [loadShares]);

  const isOwner = shares.some(s => s.user_id === currentUserId && s.role === 'owner');

  const handleInvite = async () => {
    setGenerating(true);
    try {
      const link = await getShareLink(petId);
      const message = `Join me on Pet Journal to help track ${petName}'s life! Open this link: ${link}`;

      if (Platform.OS === 'web') {
        // Native Share isn't reliable on web. Try the Web Share API; fall back
        // to clipboard so the owner can paste the invite into Messages/email.
        const webNav = typeof navigator !== 'undefined' ? (navigator as any) : null;
        if (webNav?.share) {
          try {
            await webNav.share({ title: 'Pet Journal invite', text: message, url: link });
          } catch (err: any) {
            if (err?.name !== 'AbortError') throw err;
          }
        } else if (webNav?.clipboard?.writeText) {
          await webNav.clipboard.writeText(link);
          notify('Invite link copied', 'Paste it into Messages or email to share.');
        } else {
          notify('Invite link', link);
        }
      } else {
        await Share.share({ message });
      }
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        notify('Error', err?.message ?? 'Could not generate invite link.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = async (share: ShareWithUser) => {
    if (share.role === 'owner') {
      notify('Cannot remove', 'Cannot remove the pet owner.');
      return;
    }

    confirm(
      'Remove access?',
      `Remove ${share.user.display_name ?? 'this person'} from ${petName}?`,
      {
        destructive: true,
        confirmText: 'Remove',
        onConfirm: async () => {
          await supabase.from('pet_shares').delete().eq('id', share.id);
          await loadShares();
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>People with access</Text>
      <Text style={styles.subtitle}>Everyone here can view and add entries for {petName}</Text>

      <FlatList
        data={shares}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.personRow}>
            <View style={[styles.avatar, { backgroundColor: stringToColor(item.user.display_name ?? '') }]}>
              <Text style={styles.avatarText}>
                {(item.user.display_name ?? '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{item.user.display_name ?? 'Unknown'}</Text>
              <Text style={styles.personRole}>{item.role === 'owner' ? 'Owner' : 'Editor'}</Text>
            </View>
            {isOwner && item.role !== 'owner' && (
              <TouchableOpacity onPress={() => handleRemove(item)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {isOwner && (
        <TouchableOpacity
          style={[styles.inviteButton, generating && styles.inviteButtonDisabled]}
          onPress={handleInvite}
          disabled={generating}
        >
          <Text style={styles.inviteButtonText}>
            {generating ? 'Generating link...' : '🔗 Share Invite Link'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function stringToColor(str: string): string {
  const pastelColors = ['#dbc4f0', '#c4daf0', '#f0d4c4', '#c4f0d4', '#f0eac4'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  list: { paddingBottom: 80 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  personInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '600', color: colors.text },
  personRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeText: { fontSize: 14, color: colors.error, fontWeight: '600' },
  inviteButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  inviteButtonDisabled: { opacity: 0.6 },
  inviteButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
