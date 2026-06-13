import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/auth.store';

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { init(); }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#161b22' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0f1117' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Prijava' }} />
        <Stack.Screen name="register" options={{ title: 'Registracija' }} />
        <Stack.Screen name="trip/[id]" options={{ title: 'Vožnja' }} />
        <Stack.Screen name="sensor-lab" options={{ title: 'Senzorski laboratorij' }} />
      </Stack>
    </>
  );
}
