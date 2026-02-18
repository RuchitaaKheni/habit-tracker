import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useHabitStore } from '../src/store/habitStore';
import { useThemeStore } from '../src/store/themeStore';
import { useAdStore } from '../src/store/adStore';
import { useColors } from '../src/hooks/useColors';
import { loadInterstitial } from '../src/components/ads/InterstitialAd';
import { loadRewardedAd } from '../src/components/ads/RewardedAd';
import { OnboardingScreen } from '../src/components/onboarding/OnboardingScreen';
import {
  cancelAllNotifications,
  registerHabitNotificationActions,
  scheduleAllHabitReminders,
  setupNotificationCategories,
} from '../src/services/notifications';
import { getToday } from '../src/utils/date';
import { useShallow } from 'zustand/react/shallow';

function AppContent() {
  const colors = useColors();
  const {
    initialize,
    isLoading,
    profile,
    habits,
    setSelectedDate,
    setCompletionStatus,
    loadTodayCompletions,
  } = useHabitStore(
    useShallow((state) => ({
      initialize: state.initialize,
      isLoading: state.isLoading,
      profile: state.profile,
      habits: state.habits,
      setSelectedDate: state.setSelectedDate,
      setCompletionStatus: state.setCompletionStatus,
      loadTodayCompletions: state.loadTodayCompletions,
    }))
  );
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const isDark = useThemeStore((s) => s.isDark);
  const loadAdState = useAdStore((s) => s.loadAdState);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function boot() {
      await Promise.all([
        loadTheme(),
        loadAdState(),
        setupNotificationCategories(),
        initialize(),
      ]);

      // Pre-load ads
      void loadInterstitial();
      void loadRewardedAd();
    }
    void boot();
  }, [loadTheme, loadAdState, initialize]);

  useEffect(() => {
    const unsubscribe = registerHabitNotificationActions({
      onDone: async (habitId: string) => {
        setSelectedDate(getToday());
        await setCompletionStatus(habitId, 'completed');
        await loadTodayCompletions();
      },
      onSkip: async (habitId: string) => {
        setSelectedDate(getToday());
        await setCompletionStatus(habitId, 'skipped', { tag: 'busy' });
        await loadTodayCompletions();
      },
    });

    return unsubscribe;
  }, [setSelectedDate, setCompletionStatus, loadTodayCompletions]);

  useEffect(() => {
    if (isLoading) return;
    if (profile?.notificationEnabled) {
      void scheduleAllHabitReminders(habits);
      return;
    }

    void cancelAllNotifications();
  }, [isLoading, profile?.notificationEnabled, habits]);

  useEffect(() => {
    if (!isLoading && profile) {
      setShowOnboarding(!profile.onboardingCompleted);
    }
  }, [isLoading, profile]);

  if (isLoading || showOnboarding === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="habit/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="habit/create"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="habit/edit"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="knowledge/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="legal/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
