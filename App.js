import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';

import AppNavigator from './src/navigation/AppNavigator';
import { AppStateProvider } from './src/hooks/useStore';
import { MusicPlaybackProvider } from './src/context/MusicPlaybackContext';
import { ToastProvider } from './src/components/Toast';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) onLayoutRootView();
  }, [fontsLoaded, onLayoutRootView]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.secondary }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.secondary }} onLayout={onLayoutRootView}>
          <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
          <AppStateProvider>
            <MusicPlaybackProvider>
              <ToastProvider>
                <AppNavigator />
              </ToastProvider>
            </MusicPlaybackProvider>
          </AppStateProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
