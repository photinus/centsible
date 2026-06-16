import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';

// Keep the native splash screen visible while we load the session.
SplashScreen.preventAutoHideAsync().catch(() => {
  // preventAutoHideAsync can throw on web — that's fine.
});

export default function RootLayout() {
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => {
    rehydrate().finally(() => {
      // Hide the native splash screen once we know the auth state.
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(kid)" />
          <Stack.Screen name="(parent)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
