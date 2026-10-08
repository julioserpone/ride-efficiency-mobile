import '@/theme/global-styles';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/lib/auth-store';
import { AppThemeProvider, useAppTheme } from '@/theme/theme-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Keeps the status bar legible on both the light and the dark canvas. */
function StatusBarForTheme() {
  const { mode } = useAppTheme();

  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          {/* Screens paint their own aurora background, so the stacks are transparent. */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            <Stack.Screen name="receipt/[id]" />
            <Stack.Screen name="shift/new" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBarForTheme />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
