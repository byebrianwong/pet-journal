import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../utils/colors';
import { acceptInvite } from '../services/sharing';

export function AcceptInviteScreen({ route, navigation }: any) {
  const { code } = route.params;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function accept() {
      const success = await acceptInvite(code);
      setStatus(success ? 'success' : 'error');

      if (success) {
        setTimeout(() => navigation.replace('Main'), 1500);
      }
    }
    accept();
  }, [code, navigation]);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Joining pet journal...</Text>
        </>
      )}
      {status === 'success' && (
        <>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're in!</Text>
          <Text style={styles.text}>Opening the timeline...</Text>
        </>
      )}
      {status === 'error' && (
        <>
          <Text style={styles.emoji}>😔</Text>
          <Text style={styles.title}>Invite expired or invalid</Text>
          <Text style={styles.text}>Ask the pet owner to send a new invite link.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  text: { fontSize: 15, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
});
