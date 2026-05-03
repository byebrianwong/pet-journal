import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../utils/colors';
import { fiCollar } from '../services/fi-collar';

export function FiSetupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fiCollar.isConfigured().then((configured) => {
      setConnected(configured);
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter your Fi account email and password.');
      return;
    }

    setConnecting(true);
    try {
      const success = await fiCollar.login(email.trim(), password);
      if (success) {
        setConnected(true);
        Alert.alert('Connected!', 'Fi Collar data will sync automatically.');
      } else {
        Alert.alert('Login failed', 'Check your Fi credentials and try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to Fi. Try again later.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect Fi?', 'Activity data will stop syncing.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await fiCollar.disconnect();
          setConnected(false);
        },
      },
    ]);
  };

  if (loading) return null;

  if (connected) {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <Text style={styles.statusTitle}>Fi Collar Connected</Text>
          <Text style={styles.statusSubtitle}>Activity data syncs every 4 hours</Text>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Text style={styles.disconnectText}>Disconnect Fi Collar</Text>
        </TouchableOpacity>
        <Text style={styles.note}>
          Your Fi credentials are stored securely on this device and never sent to our servers.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
        onPress={handleConnect}
        disabled={connecting}
      >
        <Text style={styles.connectButtonText}>
          {connecting ? 'Connecting...' : 'Connect'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Your credentials are stored securely on this device only, never on our servers.
        Pet Journal uses the Fi API to read activity data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  emoji: { fontSize: 48, textAlign: 'center', marginTop: 40 },
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
  connectButton: {
    backgroundColor: colors.fi,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  connectButtonDisabled: { opacity: 0.6 },
  connectButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  statusCard: {
    backgroundColor: colors.fiBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.fi, marginBottom: 12 },
  statusTitle: { fontSize: 18, fontWeight: '600', color: colors.fi },
  statusSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  disconnectButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disconnectText: { fontSize: 15, color: colors.error, fontWeight: '600' },
});
