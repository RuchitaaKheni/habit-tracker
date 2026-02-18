import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../../src/hooks/useColors';
import { Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/themeStore';
import { useHabitStore } from '../../src/store/habitStore';
import { exportAllData, clearAllData } from '../../src/database/database';
import {
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleAllHabitReminders,
} from '../../src/services/notifications';
import { getDateRange, getToday } from '../../src/utils/date';
import * as db from '../../src/database/database';
import { useShallow } from 'zustand/react/shallow';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, setMode } = useThemeStore();
  const { profile, updateProfile, habits, getFlexStreak, initialize } = useHabitStore(
    useShallow((state) => ({
      profile: state.profile,
      updateProfile: state.updateProfile,
      habits: state.habits,
      getFlexStreak: state.getFlexStreak,
      initialize: state.initialize,
    }))
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationEnabled ?? true
  );
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const loadProfileStats = useCallback(async () => {
    const { start } = getDateRange(120);
    const completions = await db.getAllCompletionsInRange(start, getToday());
    setTotalCheckIns(completions.filter((c) => c.status === 'completed').length);

    const activeHabits = habits.filter((h) => h.status === 'active');
    if (activeHabits.length === 0) {
      setBestStreak(0);
      return;
    }
    const streaks = await Promise.all(activeHabits.map((habit) => getFlexStreak(habit.id)));
    setBestStreak(streaks.reduce((best, streak) => Math.max(best, streak.bestStreak), 0));
  }, [habits, getFlexStreak]);

  useEffect(() => {
    loadProfileStats();
  }, [loadProfileStats]);

  useEffect(() => {
    setNotificationsEnabled(profile?.notificationEnabled ?? true);
  }, [profile?.notificationEnabled]);

  const handleNotificationToggle = useCallback(
    async (enabled: boolean) => {
      setNotificationsEnabled(enabled);
      if (enabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive reminders.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setNotificationsEnabled(false) },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      } else {
        await cancelAllNotifications();
      }
      if (enabled) {
        await scheduleAllHabitReminders(habits);
      }
      await updateProfile({ notificationEnabled: enabled });
    },
    [updateProfile, habits]
  );

  const handleThemePress = useCallback(() => {
    Alert.alert('Appearance', 'Choose your theme preference', [
      { text: 'Light', onPress: () => setMode('light') },
      { text: 'Dark', onPress: () => setMode('dark') },
      { text: 'System', onPress: () => setMode('system') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [setMode]);

  const handleExportData = useCallback(async () => {
    const data = await exportAllData();
    await Share.share({
      title: 'HabitFlow Data Export',
      message: data,
    });
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all habits, completions, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            await clearAllData();
            await initialize();
            Alert.alert('Done', 'All data has been reset.');
          },
        },
      ]
    );
  }, [initialize]);

  const activeHabits = habits.filter((habit) => habit.status === 'active').length;
  const profileName = profile?.name?.trim() ? profile.name : 'Habit Builder';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Profile</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>🧑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profileName}</Text>
            <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]}>
              Building better habits every day
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{activeHabits}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Habits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalCheckIns}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Check-ins</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{bestStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Manage reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity style={[styles.settingRow, { borderTopColor: colors.border }]} onPress={handleThemePress}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="moon-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Theme: {mode}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderTopColor: colors.border }]}
            onPress={() => router.push('/knowledge')}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>About</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Atomic Habits principles in HabitFlow
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderTopColor: colors.border }]}
            onPress={() => router.push('/habits')}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="list-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Manage Habits</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Edit, archive, and organize
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderTopColor: colors.border }]}
            onPress={handleExportData}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Export Data</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Save your progress snapshot
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderTopColor: colors.border }]}
            onPress={() => router.push('/legal')}
          >
            <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Privacy & Terms</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Review legal and data usage details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, Shadows.sm, { backgroundColor: colors.errorLight }]}
          onPress={handleClearData}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={[styles.resetText, { color: colors.error }]}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: {
    ...Typography.h1,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 30,
  },
  profileName: {
    ...Typography.h2,
  },
  profileSubtitle: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h1,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  sectionLabel: {
    ...Typography.h3,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  settingsCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 0.5,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  settingSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  resetButton: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  resetText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
