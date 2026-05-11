import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../utils/colors';
import { notify } from '../utils/feedback';
import { createTimelineEvent, uploadPhoto } from '../services/timeline';
import { scanVetReceipt } from '../services/receipt-scanner';
import { readAsStringAsync } from 'expo-file-system/legacy';
import type { VetVisitMetadata } from '../types/database';

type EntryMode = 'choose' | 'memory' | 'vet_visit' | 'scanning';

export function AddEntryScreen({ route, navigation }: any) {
  const { petId } = route.params;
  const [mode, setMode] = useState<EntryMode>('choose');

  // Memory fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Vet visit fields
  const [clinicName, setClinicName] = useState('');
  const [vetName, setVetName] = useState('');
  const [diagnoses, setDiagnoses] = useState('');
  const [medications, setMedications] = useState('');
  const [cost, setCost] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      notify('Permission needed', 'Camera access is required to scan receipts.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const handleScanReceipt = async () => {
    const uri = await takePhoto();
    if (!uri) return;

    setReceiptUri(uri);
    setMode('scanning');

    try {
      const base64 = await readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const result = await scanVetReceipt(base64);

      if (result.success) {
        setClinicName(result.data.clinic_name ?? '');
        setVetName(result.data.vet_name ?? '');
        setDiagnoses(result.data.diagnoses?.join(', ') ?? '');
        setMedications(result.data.medications_prescribed?.join(', ') ?? '');
        setCost(result.data.cost_total?.toString() ?? '');
        setTitle(result.data.clinic_name ? `Visit to ${result.data.clinic_name}` : 'Vet Visit');
      } else {
        notify('Scan incomplete', 'Some fields could not be extracted. Please fill in manually.');
      }
    } catch {
      notify('Scan failed', 'Could not process the receipt. Please enter details manually.');
    }

    setMode('vet_visit');
  };

  const handleSaveMemory = async () => {
    if (!title.trim()) {
      notify('Title required', 'Give this memory a title.');
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, petId, 'photos');
      }

      await createTimelineEvent({
        petId,
        eventType: 'memory',
        eventDate: new Date().toISOString(),
        title: title.trim(),
        notes: notes.trim() || undefined,
        photoUrl,
      });

      navigation.goBack();
    } catch (err: any) {
      notify('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVetVisit = async () => {
    setSaving(true);
    try {
      let receiptUrl: string | undefined;
      if (receiptUri) {
        receiptUrl = await uploadPhoto(receiptUri, petId, 'receipts');
      }

      const metadata: VetVisitMetadata = {
        clinic_name: clinicName.trim() || undefined,
        vet_name: vetName.trim() || undefined,
        diagnoses: diagnoses.split(',').map(s => s.trim()).filter(Boolean),
        medications_prescribed: medications.split(',').map(s => s.trim()).filter(Boolean),
        cost_total: cost ? parseFloat(cost) : undefined,
        receipt_photo_url: receiptUrl,
      };

      await createTimelineEvent({
        petId,
        eventType: 'vet_visit',
        eventDate: new Date().toISOString(),
        title: title.trim() || 'Vet Visit',
        notes: notes.trim() || undefined,
        metadata,
      });

      navigation.goBack();
    } catch (err: any) {
      notify('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Add Entry</Text>

        <TouchableOpacity style={styles.option} onPress={async () => {
          const uri = await pickImage();
          if (uri) setPhotoUri(uri);
          setMode('memory');
        }}>
          <Text style={styles.optionEmoji}>📷</Text>
          <View>
            <Text style={styles.optionTitle}>Memory</Text>
            <Text style={styles.optionDesc}>Photo, milestone, or fun moment</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setMode('vet_visit')}>
          <Text style={styles.optionEmoji}>🏥</Text>
          <View>
            <Text style={styles.optionTitle}>Vet Visit</Text>
            <Text style={styles.optionDesc}>Log a visit manually</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleScanReceipt}>
          <Text style={styles.optionEmoji}>📋</Text>
          <View>
            <Text style={styles.optionTitle}>Scan Receipt</Text>
            <Text style={styles.optionDesc}>AI extracts vet visit details from a photo</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'scanning') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.scanningEmoji}>🔍</Text>
        <Text style={styles.scanningText}>Scanning receipt...</Text>
        <Text style={styles.scanningSubtext}>AI is extracting vet visit details</Text>
      </View>
    );
  }

  if (mode === 'memory') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.form}>
        <Text style={styles.heading}>Add Memory</Text>

        {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
        {!photoUri && (
          <TouchableOpacity style={styles.photoButton} onPress={async () => {
            const uri = await pickImage();
            if (uri) setPhotoUri(uri);
          }}>
            <Text style={styles.photoButtonText}>+ Add Photo</Text>
          </TouchableOpacity>
        )}

        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} placeholderTextColor={colors.textMuted} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Caption (optional)" value={notes} onChangeText={setNotes} multiline placeholderTextColor={colors.textMuted} />

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveMemory} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Memory'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // vet_visit mode
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.form}>
      <Text style={styles.heading}>Vet Visit</Text>

      {receiptUri && (
        <View>
          <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
          <Text style={styles.receiptNote}>Auto-extracted from receipt photo</Text>
        </View>
      )}

      <TextInput style={styles.input} placeholder="Title (e.g. Annual Checkup)" value={title} onChangeText={setTitle} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Clinic Name" value={clinicName} onChangeText={setClinicName} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Vet / Doctor Name" value={vetName} onChangeText={setVetName} placeholderTextColor={colors.textMuted} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Diagnoses (comma separated)" value={diagnoses} onChangeText={setDiagnoses} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Medications prescribed (comma separated)" value={medications} onChangeText={setMedications} placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Total cost ($)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} />

      {!receiptUri && (
        <TouchableOpacity style={styles.photoButton} onPress={handleScanReceipt}>
          <Text style={styles.photoButtonText}>📋 Scan a receipt instead</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveVetVisit} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Vet Visit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  form: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  optionEmoji: { fontSize: 28 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  optionDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  receiptPreview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 4 },
  receiptNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  photoButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  photoButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  scanningEmoji: { fontSize: 48, marginBottom: 12 },
  scanningText: { fontSize: 18, fontWeight: '600', color: colors.text },
  scanningSubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
