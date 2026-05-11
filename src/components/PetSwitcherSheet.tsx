/**
 * Bottom-sheet pet picker. Opens when the user taps the avatar in
 * PetHeader. Lists every pet they share with one tap each to switch.
 * "Add another pet" lives here too so the multi-pet flow has one home.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { colors, fonts } from '../utils/colors';
import type { Pet } from '../types/database';

interface Props {
  visible: boolean;
  pets: Pet[];
  currentPetId: string | null;
  onSelect: (petId: string) => void;
  onAddPet: () => void;
  onClose: () => void;
}

export function PetSwitcherSheet({ visible, pets, currentPetId, onSelect, onAddPet, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleRow}><View style={styles.handle} /></View>

          <Text style={styles.title}>Your pets</Text>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {pets.map(pet => {
              const active = pet.id === currentPetId;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => { onSelect(pet.id); onClose(); }}
                >
                  <View style={styles.avatar}>
                    {pet.photo_url ? (
                      <Image source={{ uri: pet.photo_url }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarEmoji}>🐕</Text>
                    )}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petSub}>
                      {[pet.breed, pet.weight_lbs ? `${pet.weight_lbs} lbs` : null]
                        .filter(Boolean)
                        .join(' · ') || 'no details yet'}
                    </Text>
                  </View>
                  {active && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.addRow}
              onPress={() => { onClose(); onAddPet(); }}
            >
              <View style={styles.addAvatar}>
                <Text style={styles.addPlus}>+</Text>
              </View>
              <Text style={styles.addLabel}>Add another pet</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 22, paddingBottom: 28, paddingTop: 10,
    maxHeight: '80%',
  },
  handleRow: { alignItems: 'center', marginBottom: 8 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  title: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text, marginBottom: 12 },
  list: { paddingBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  rowActive: { borderColor: colors.primary, borderWidth: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarImg: { width: 48, height: 48 },
  avatarEmoji: { fontSize: 24 },
  rowBody: { flex: 1 },
  petName: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.text },
  petSub: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  check: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.primary },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: 14,
  },
  addAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  addPlus: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.textMuted },
  addLabel: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15, color: colors.textSecondary },
  closeButton: {
    marginTop: 8, paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontFamily: fonts.serifBold, fontStyle: 'italic', fontSize: 14 },
});
