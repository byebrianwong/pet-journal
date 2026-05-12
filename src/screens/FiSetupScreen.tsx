import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { colors } from '../utils/colors';
import { notify, confirm } from '../utils/feedback';
import { fiCollar, type FiPet } from '../services/fi-collar';
import { getPet, setFiPetId } from '../services/pets';
import type { Pet } from '../types/database';

type Stage = 'loading' | 'login' | 'pick' | 'linked';

export function FiSetupScreen({ navigation, route }: any) {
  const petId: string | undefined = route?.params?.petId;

  const [stage, setStage] = useState<Stage>('loading');
  const [pet, setPet] = useState<Pet | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [fiPets, setFiPets] = useState<FiPet[]>([]);
  const [linkedFiPet, setLinkedFiPet] = useState<FiPet | null>(null);
  const [picking, setPicking] = useState(false);

  const refresh = useCallback(async () => {
    if (!petId) {
      setStage('login');
      return;
    }
    setStage('loading');

    const [configured, p] = await Promise.all([
      fiCollar.isConfigured(),
      getPet(petId),
    ]);
    setPet(p);

    if (!configured) {
      setStage('login');
      return;
    }

    // Fi account is connected — does this Pet Journal pet have a Fi pet linked?
    const fiPetId = p?.fi_pet_id ?? null;
    const pets = await fiCollar.listPets();
    setFiPets(pets);

    if (fiPetId) {
      const match = pets.find((fp) => fp.id === fiPetId) ?? { id: fiPetId, name: 'Fi Pet', photo_url: null };
      setLinkedFiPet(match);
      setStage('linked');
    } else {
      setLinkedFiPet(null);
      setStage('pick');
    }
  }, [petId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleConnect = async () => {
    if (!email.trim() || !password.trim()) {
      notify('Required', 'Enter your Fi account email and password.');
      return;
    }

    setConnecting(true);
    try {
      const success = await fiCollar.login(email.trim(), password);
      if (success) {
        setPassword('');
        await refresh();
      } else {
        notify('Login failed', 'Check your Fi credentials and try again.');
      }
    } catch {
      notify('Error', 'Could not connect to Fi. Try again later.');
    } finally {
      setConnecting(false);
    }
  };

  const handlePick = async (fiPet: FiPet) => {
    if (!petId) return;
    setPicking(true);
    try {
      await setFiPetId(petId, fiPet.id);
      setLinkedFiPet(fiPet);
      setStage('linked');
      notify('Linked!', `${fiPet.name} is now syncing daily activity.`);
    } catch {
      notify('Error', 'Could not save the link. Try again.');
    } finally {
      setPicking(false);
    }
  };

  const handleUnlink = () => {
    if (!petId) return;
    confirm('Unlink Fi pet?', 'Activity will stop syncing for this pet. Your Fi account stays connected.', {
      destructive: true,
      confirmText: 'Unlink',
      onConfirm: async () => {
        await setFiPetId(petId, null);
        setLinkedFiPet(null);
        setStage('pick');
      },
    });
  };

  const handleDisconnect = () => {
    confirm('Disconnect Fi?', 'Signs out of your Fi account on this device. Linked pets stay linked.', {
      destructive: true,
      confirmText: 'Disconnect',
      onConfirm: async () => {
        await fiCollar.disconnect();
        setStage('login');
      },
    });
  };

  if (stage === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.fi} />
      </View>
    );
  }

  if (stage === 'login') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.title}>Connect Fi Collar</Text>
        <Text style={styles.subtitle}>
          Link your Fi account to automatically track daily activity (steps, distance, rest).
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Fi email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="Fi password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity
          style={[styles.primaryButton, connecting && styles.primaryButtonDisabled]}
          onPress={handleConnect}
          disabled={connecting}
        >
          <Text style={styles.primaryButtonText}>
            {connecting ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Your credentials are stored securely on this device only, never on our servers.
          Pet Journal uses the Fi API to read activity data.
        </Text>
      </ScrollView>
    );
  }

  if (stage === 'pick') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>
          Which Fi pet is {pet?.name ?? 'this pet'}?
        </Text>
        <Text style={styles.subtitle}>
          Pick the Fi profile that matches. We&apos;ll sync that pet&apos;s daily activity here.
        </Text>

        {fiPets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Fi pets found</Text>
            <Text style={styles.emptySubtitle}>
              Your Fi account is connected, but we couldn&apos;t find any pets on it.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={refresh}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {fiPets.map((fp) => (
              <TouchableOpacity
                key={fp.id}
                style={[styles.petRow, picking && { opacity: 0.5 }]}
                onPress={() => handlePick(fp)}
                disabled={picking}
              >
                {fp.photo_url ? (
                  <Image source={{ uri: fp.photo_url }} style={styles.petAvatar} />
                ) : (
                  <View style={[styles.petAvatar, styles.petAvatarFallback]}>
                    <Text style={styles.petAvatarEmoji}>🐕</Text>
                  </View>
                )}
                <Text style={styles.petRowName}>{fp.name}</Text>
                <Text style={styles.petRowChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.linkButton} onPress={handleDisconnect}>
          <Text style={styles.linkButtonText}>Disconnect Fi account</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // stage === 'linked'
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusTitle}>Fi Collar Connected</Text>
        <Text style={styles.statusSubtitle}>
          {pet?.name ?? 'This pet'} ↔ {linkedFiPet?.name ?? 'Fi pet'}
        </Text>
        <Text style={styles.statusFinePrint}>Activity syncs whenever you open the app.</Text>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleUnlink}>
        <Text style={styles.secondaryButtonText}>Change linked Fi pet</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={handleDisconnect}>
        <Text style={[styles.linkButtonText, { color: colors.error }]}>Disconnect Fi account</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Your Fi credentials are stored securely on this device and never sent to our servers.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 48 },
  center: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginTop: 24 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.fi,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  linkButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  linkButtonText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  statusCard: {
    backgroundColor: colors.fiBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.fi, marginBottom: 12 },
  statusTitle: { fontSize: 18, fontWeight: '600', color: colors.fi },
  statusSubtitle: { fontSize: 15, color: colors.text, marginTop: 6, fontWeight: '500' },
  statusFinePrint: { fontSize: 12, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  petAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
  petAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  petAvatarEmoji: { fontSize: 22 },
  petRowName: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  petRowChevron: { fontSize: 20, color: colors.textMuted },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
