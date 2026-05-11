import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { confirm } from '../utils/feedback';
import { getPetShares } from '../services/pets';
import { supabase } from '../services/supabase';
import { formatDate } from '../utils/dates';
import { usePets } from '../state/PetContext';
import { PetSwitcherSheet } from '../components/PetSwitcherSheet';

export function PetProfileScreen({ navigation }: any) {
  const { pets, currentPet, currentPetId, loading: petsLoading, error: petsError, setCurrentPetId } = usePets();
  const pet = currentPet;
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(petsError);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const loadShares = useCallback(async () => {
    setError(null);
    if (!currentPetId) {
      setShareCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const shares = await getPetShares(currentPetId);
      setShareCount(shares.length);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load shares.');
    } finally {
      setLoading(false);
    }
  }, [currentPetId]);

  useEffect(() => { loadShares(); }, [loadShares]);
  useEffect(() => { if (petsError) setError(petsError); }, [petsError]);

  const handleSignOut = () => {
    confirm('Sign out?', 'You can always sign back in.', {
      destructive: true,
      confirmText: 'Sign Out',
      onConfirm: () => {
        void supabase.auth.signOut();
      },
    });
  };

  if (loading || petsLoading) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyEmoji}>{error ? '⚠️' : '🐾'}</Text>
        <Text style={styles.emptyTitle}>{error ? 'Could not load' : 'No pet yet'}</Text>
        <Text style={styles.emptySubtitle}>
          {error ?? 'Add a pet to set up their profile.'}
        </Text>
        {error ? (
          <TouchableOpacity style={styles.emptyButton} onPress={loadShares}>
            <Text style={styles.emptyButtonText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Text style={styles.emptyButtonText}>Add a Pet</Text>
          </TouchableOpacity>
        )}
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
        {pets.length > 1 && (
          <TouchableOpacity style={styles.menuItem} onPress={() => setSwitcherOpen(true)}>
            <Text style={styles.menuEmoji}>🔄</Text>
            <View style={styles.menuTextRow}>
              <Text style={styles.menuText}>Switch pet</Text>
              <Text style={styles.menuSubtext}>{pets.length} pets</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        )}
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

      <PetSwitcherSheet
        visible={switcherOpen}
        pets={pets}
        currentPetId={currentPetId}
        onSelect={setCurrentPetId}
        onAddPet={() => navigation.navigate('AddPet')}
        onClose={() => setSwitcherOpen(false)}
      />
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
