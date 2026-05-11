import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import {
  useFonts as useFraunces,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Caveat_400Regular,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { supabase } from './src/services/supabase';
import { PetProvider, usePets } from './src/state/PetContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { AddEntryScreen } from './src/screens/AddEntryScreen';
import { AddPetScreen } from './src/screens/AddPetScreen';
import { MedicationsScreen } from './src/screens/MedicationsScreen';
import { SharingScreen } from './src/screens/SharingScreen';
import { PetProfileScreen } from './src/screens/PetProfileScreen';
import { FiSetupScreen } from './src/screens/FiSetupScreen';
import { AcceptInviteScreen } from './src/screens/AcceptInviteScreen';
import { HeatmapScreen } from './src/screens/HeatmapScreen';
import { addNotificationResponseListener } from './src/services/notifications';
import { colors } from './src/utils/colors';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Meds"
        component={MedicationsTabWrapper}
        options={{
          title: 'Medications',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PetProfileScreen}
        options={{
          title: 'Pet',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐾" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Wrapper to pass petId to MedicationsScreen from tab
function MedicationsTabWrapper(props: any) {
  const { currentPetId, loading, error } = usePets();

  if (loading) {
    return (
      <View style={emptyStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={emptyStyles.container}>
        <Text style={emptyStyles.emoji}>⚠️</Text>
        <Text style={emptyStyles.title}>Could not load</Text>
        <Text style={emptyStyles.subtitle}>{error}</Text>
      </View>
    );
  }
  if (!currentPetId) {
    return (
      <View style={emptyStyles.container}>
        <Text style={emptyStyles.emoji}>🐾</Text>
        <Text style={emptyStyles.title}>No pet yet</Text>
        <Text style={emptyStyles.subtitle}>Add a pet to start tracking medications.</Text>
        <TouchableOpacity
          style={emptyStyles.button}
          onPress={() => props.navigation.navigate('AddPet')}
        >
          <Text style={emptyStyles.buttonText}>Add a Pet</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <MedicationsScreen {...props} route={{ ...props.route, params: { petId: currentPetId } }} />;
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;

function SetupRequiredScreen() {
  return (
    <View style={setupStyles.container}>
      <Text style={setupStyles.emoji}>🔑</Text>
      <Text style={setupStyles.title}>Setup required</Text>
      <Text style={setupStyles.subtitle}>
        Pet Journal needs Supabase credentials to start. Create a{' '}
        <Text style={setupStyles.code}>.env</Text> file in the project root with:
      </Text>
      <View style={setupStyles.codeBlock}>
        <Text style={setupStyles.codeText}>
          EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
          EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
        </Text>
      </View>
      <Text style={setupStyles.hint}>
        Find these in your Supabase project at Settings → API. Paste either the
        new <Text style={setupStyles.code}>sb_publishable_</Text> key (preferred)
        or the legacy anon JWT — both work. Then restart the dev server.
      </Text>
    </View>
  );
}

const setupStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: 480,
  },
  code: { fontFamily: 'monospace', color: colors.text },
  codeBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    maxWidth: 480,
    width: '100%',
  },
  codeText: { fontFamily: 'monospace', fontSize: 12, color: colors.text },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 480,
  },
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(SUPABASE_CONFIGURED);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [fontsLoaded] = useFraunces({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Caveat_400Regular,
    Caveat_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle notification taps (medication reminders)
  useEffect(() => {
    const sub = addNotificationResponseListener(async (response) => {
      const data = response.notification.request.content.data;
      if (data?.type !== 'medication_reminder') return;
      if (!navigationRef.current?.isReady()) return;

      // Look up the pet for this medication so MedicationsScreen has its petId
      const { data: med } = await supabase
        .from('medications')
        .select('pet_id')
        .eq('id', data.medicationId)
        .maybeSingle();
      if (!med?.pet_id) return;

      navigationRef.current.navigate('Medications', { petId: med.pet_id });
    });
    return () => sub.remove();
  }, []);

  if (!SUPABASE_CONFIGURED) return <SetupRequiredScreen />;
  if (loading) return null;
  if (!fontsLoaded) return null;

  const linking = {
    prefixes: [Linking.createURL('/'), 'petjournal://'],
    config: {
      screens: {
        AcceptInvite: 'invite/:code',
        Main: '',
      },
    },
  };

  const stack = (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {session ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddEntry" component={AddEntryScreen} options={{ title: '' }} />
          <Stack.Screen name="AddPet" component={AddPetScreen} options={{ title: 'Add a Pet' }} />
          <Stack.Screen name="Medications" component={MedicationsScreen} options={{ title: 'Medications' }} />
          <Stack.Screen name="Sharing" component={SharingScreen} options={{ title: 'Sharing' }} />
          <Stack.Screen name="FiSetup" component={FiSetupScreen} options={{ title: 'Fi Collar' }} />
          <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Heatmap" component={HeatmapScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <StatusBar style="dark" />
      {session ? <PetProvider>{stack}</PetProvider> : stack}
    </NavigationContainer>
  );
}
