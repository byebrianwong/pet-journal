/**
 * Pet header for the Living Journal aesthetic. Real photo avatar
 * (or 🐕 emoji fallback), serif name, italic breed/age subtitle,
 * trailing menu / family avatars.
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../utils/colors';
import type { Pet, PetShare } from '../types/database';

interface Props {
  pet: Pet;
  shares: (PetShare & { user: { display_name: string; avatar_url: string | null } })[];
  fiStatus?: { connected: boolean; steps?: number };
  onMenu?: () => void;
}

export function PetHeader({ pet, shares, fiStatus, onMenu }: Props) {
  const age = pet.birthday ? getAge(pet.birthday) : null;

  return (
    <View style={styles.container}>
      <View style={styles.avatarRing}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarEmoji}>🐕</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.details}>
          {[pet.breed, age, pet.weight_lbs ? `${pet.weight_lbs} lbs` : null]
            .filter(Boolean)
            .join(' · ') || 'no details yet'}
        </Text>
        {fiStatus?.connected && (
          <Text style={styles.fiText}>
            • Fi connected{fiStatus.steps != null ? ` · ${fiStatus.steps.toLocaleString()} steps` : ''}
          </Text>
        )}
      </View>

      {onMenu ? (
        <TouchableOpacity style={styles.action} onPress={onMenu}>
          <Text style={styles.actionText}>⋯</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.avatars}>
          {shares.slice(0, 3).map(share => (
            <View
              key={share.id}
              style={[styles.familyAvatar, { backgroundColor: stringToColor(share.user.display_name ?? '') }]}
            >
              <Text style={styles.familyInitial}>
                {(share.user.display_name ?? '?')[0].toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getAge(birthday: string): string {
  const birth = new Date(birthday);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  if (years === 0) {
    const months = Math.max(1, now.getMonth() - birth.getMonth() + (now.getDate() < birth.getDate() ? -1 : 0));
    return `${months} mo`;
  }
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

function stringToColor(str: string): string {
  const pastels = ['#dbc4f0', '#c4daf0', '#f0d4c4', '#c4f0d4', '#f0eac4'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return pastels[Math.abs(hash) % pastels.length];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: colors.background,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarEmoji: { fontSize: 26 },
  info: { marginLeft: 14, flex: 1 },
  name: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.4,
  },
  details: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  fiText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.fi,
    marginTop: 2,
  },
  action: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 16, color: colors.textMuted, marginTop: -4 },
  avatars: { flexDirection: 'row' },
  familyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  familyInitial: { fontSize: 12, fontWeight: '600', color: '#fff', fontFamily: fonts.sansBold },
});
