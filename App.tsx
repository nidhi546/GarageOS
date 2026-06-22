import React, { useEffect, useState, Component } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from './src/hooks/useFonts';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CustomToast } from './src/components/CustomToast';
import { toastRef } from './src/utils/toast';
import { Colors } from './src/constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Global error boundary — prevents JS errors from crashing the whole app ──

interface ErrorBoundaryState { hasError: boolean }

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.body}>Please close and reopen the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 32 },
  title:     { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 8 },
  body:      { fontSize: 14, color: '#666', textAlign: 'center' },
});

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const { fontsLoaded, fontError } = useAppFonts();
  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setSplashHidden(true));
    }
  }, [fontsLoaded, fontError]);

  // Failsafe: force-show after 4 s so a font hang never freezes the app
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setSplashHidden(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!splashHidden && !fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>

        {/* Global toast — sits above all navigation; fired via showToast() anywhere */}
        <CustomToast ref={toastRef} />
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
