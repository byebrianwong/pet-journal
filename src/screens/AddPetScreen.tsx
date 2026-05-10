import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../utils/colors';
import { notify } from '../utils/feedback';
import { createPet } from '../services/pets';

export function AddPetScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      notify('Name required', "What's your pet's name?");
      return;
    }

    setSaving(true);
    try {
      await createPet({
        name: name.trim(),
        species: 'dog',
        breed: breed.trim() || undefined,
        birthday: birthday.trim() || undefined,
        weight_lbs: weight ? parseFloat(weight) : undefined,
      });
      navigation.replace('Main');
    } catch (err: any) {
      notify('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.form}>
      <Text style={styles.emoji}>🐕</Text>
      <Text style={styles.title}>Add Your Pet</Text>
      <Text style={styles.subtitle}>Tell us about your furry friend</Text>

      <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} autoCapitalize="words" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Breed (e.g. Golden Retriever)" value={breed} onChangeText={setBreed} autoCapitalize="words" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Birthday (YYYY-MM-DD)" value={birthday} onChangeText={setBirthday} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Weight (lbs)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} />

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Creating...' : 'Create Pet Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, marginTop: 4 },
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
