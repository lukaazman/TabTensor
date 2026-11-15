import React, { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';
import { colors, font } from '@/theme';

// Native builds embed the fonts through the expo-font config plugin; only the web preview loads them at runtime.
const WEB_FONTS = {
  [font.regular]: require('./assets/fonts/InstrumentSans-Regular.ttf'),
  [font.medium]: require('./assets/fonts/InstrumentSans-Medium.ttf'),
  [font.semibold]: require('./assets/fonts/InstrumentSans-SemiBold.ttf'),
};

export default function App() {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (!ready) Font.loadAsync(WEB_FONTS).finally(() => setReady(true));
  }, [ready]);
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.ground} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
