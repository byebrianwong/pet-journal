import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../utils/colors';
import type { Pet, PetShare, UserProfile } from '../types/database';

interface Props {
  pet: Pet;
  shares: (PetShare & { user: { display_name: string; avatar_url: string | null } })[];
  fiStatus?: { connected: boolean; steps?: number };
}

export function PetHeader({ pet, shares, fiStatus }: Props) {
  const age = pet.birthday ? getAge(pet.birthday) : null;

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {pet.photo_url ? (
          <Image source={{ uri: pet.photo_url }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarEmoji}>🐕</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.details}>
          {[pet.breed, age, pet.weight_lbs ? `${pet.weight_lbs} lbs` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {fiStatus?.connected && (
          <View style={styles.fiRow}>
            <View style={styles.fiDot} />
            <Text style={styles.fiText}>
              Fi connected{fiStatus.steps != null ? ` · ${fiStatus.steps.toLocaleString()} steps today` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.avatars}>
        {shares.map((share) => (
          <View key={share.id} style={[styles.familyAvatar, { backgroundColor: stringToColor(share.user.display_name ?? '') }]}>
            <Text style={styles.familyInitial}>
              {(share.user.display_name ?? '?')[0].toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getAge(birthday: string): string {
  const birth = new Date(birthday);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  if (years === 0) {
    const months = now.getMonth() - birth.getMonth();
    return `${Math.max(1, months)} mo`;
  }
  return `${years} yr${years !== 1 ? 's' : ''}`;
}

function stringToColor(str: string): string {
  const pastelColors = ['#dbc4f0', '#c4daf0', '#f0d4c4', '#c4f0d4', '#f0eac4'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 56, height: 56 },
  avatarEmoji: { fontSize: 28 },
  info: { marginLeft: 14, flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  details: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  fiRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  fiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.fi, marginRight: 4 },
  fiText: { fontSize: 11, color: colors.fi },
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
  familyInitial: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
