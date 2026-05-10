import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { confirm } from '../utils/feedback';
import { getMyPets, getPetShares } from '../services/pets';
import { supabase } from '../services/supabase';
import type { Pet } from '../types/database';
import { formatDate } from '../utils/dates';

export function PetProfileScreen({ navigation }: any) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPet = useCallback(async () => {
    const pets = await getMyPets();
    if (pets.length > 0) {
      setPet(pets[0]);
      const shares = await getPetShares(pets[0].id);
      setShareCount(shares.length);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPet(); }, [loadPet]);

  const handleSignOut = () => {
    confirm('Sign out?', 'You can always sign back in.', {
      destructive: true,
      confirmText: 'Sign Out',
      onConfirm: () => {
        void supabase.auth.signOut();
      },
    });
  };

  if (loading) return null;

  if (!pet) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyEmoji}>🐾</Text>
        <Text style={styles.emptyTitle}>No pet yet</Text>
        <Text style={styles.emptySubtitle}>Add a pet to set up their profile.</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('AddPet')}
        >
          <Text style={styles.emptyButtonText}>Add a Pet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
          <Text style={styles.signOutLinkText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>🐕</Text>
      </View>
      <Text style={styles.petName}>{pet.name}</Text>
      <Text style={styles.petDetails}>
        {[pet.breed, pet.birthday ? formatDate(pet.birthday) : null, pet.weight_lbs ? `${pet.weight_lbs} lbs` : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Medications', { petId: pet.id })}
        >
          <Text style={styles.menuEmoji}>💊</Text>
          <Text style={styles.menuText}>Medications</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sharing', { petId: pet.id, petName: pet.name })}
        >
          <Text style={styles.menuEmoji}>👥</Text>
          <View style={styles.menuTextRow}>
            <Text style={styles.menuText}>Sharing</Text>
            <Text style={styles.menuSubtext}>{shareCount} {shareCount === 1 ? 'person' : 'people'}</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('FiSetup', { petId: pet.id })}
        >
          <Text style={styles.menuEmoji}>📡</Text>
          <Text style={styles.menuText}>Fi Collar</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AddPet')}
        >
          <Text style={styles.menuEmoji}>➕</Text>
          <Text style={styles.menuText}>Add another pet</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Text style={styles.menuEmoji}>🚪</Text>
          <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, alignItems: 'center' },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  avatarEmoji: { fontSize: 40 },
  petName: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 12 },
  petDetails: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  section: {
    width: '100%',
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  menuEmoji: { fontSize: 20 },
  menuText: { fontSize: 16, color: colors.text, flex: 1 },
  menuTextRow: { flex: 1 },
  menuSubtext: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  menuChevron: { fontSize: 20, color: colors.textMuted },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signOutLink: { marginTop: 24, padding: 8 },
  signOutLinkText: { color: colors.error, fontSize: 14 },
});
