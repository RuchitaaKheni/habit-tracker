import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '../../src/hooks/useColors';
import { Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { FlexStreakDisplay } from '../../src/components/habits/FlexStreakDisplay';
import { HabitCalendar } from '../../src/components/habits/HabitCalendar';
import { PauseSheet } from '../../src/components/habits/PauseSheet';
import { BannerAdComponent } from '../../src/components/ads/BannerAd';
import { FlexStreak, HabitCompletion } from '../../src/types/habit';
import { formatDisplay, isHabitDueOnDate, isHabitPausedOnDate } from '../../src/utils/date';
import { contextTagLabels } from '../../src/constants/templates';
import { getCompletionStatusLabel, getHabitFrequencyLabel } from '../../src/utils/habit';
import { format, parseISO } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';

export default function HabitDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    habits,
    todayCompletions,
    selectedDate,
    getFlexStreak,
    getCompletionsForHabit,
    setCompletionStatus,
    clearCompletionForSelectedDate,
    pauseHabit,
    resumeHabit,
    archiveHabit,
    deleteHabit,
  } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      todayCompletions: state.todayCompletions,
      selectedDate: state.selectedDate,
      getFlexStreak: state.getFlexStreak,
      getCompletionsForHabit: state.getCompletionsForHabit,
      setCompletionStatus: state.setCompletionStatus,
      clearCompletionForSelectedDate: state.clearCompletionForSelectedDate,
      pauseHabit: state.pauseHabit,
      resumeHabit: state.resumeHabit,
      archiveHabit: state.archiveHabit,
      deleteHabit: state.deleteHabit,
    }))
  );

  const habit = habits.find((h) => h.id === id);
  const selectedDateCompletion = habit ? todayCompletions.get(habit.id) : undefined;
  const [flexStreak, setFlexStreak] = useState<FlexStreak | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [pauseSheetVisible, setPauseSheetVisible] = useState(false);
  const [dailyNote, setDailyNote] = useState('');

  useEffect(() => {
    if (!id) return;
    async function load() {
      const streak = await getFlexStreak(id!);
      setFlexStreak(streak);
      const comps = await getCompletionsForHabit(id!, 90);
      setCompletions(comps);
    }
    load();
  }, [id, habits]);

  useEffect(() => {
    setDailyNote(selectedDateCompletion?.contextNote || '');
  }, [selectedDateCompletion?.contextNote, selectedDateCompletion?.status, selectedDate]);

  const handlePause = useCallback(async (endDate: string) => {
    if (id) await pauseHabit(id, endDate);
  }, [id]);

  const handlePausePress = useCallback(() => {
    setPauseSheetVisible(true);
  }, []);

  const handleResumePress = useCallback(async () => {
    if (!habit) return;
    await resumeHabit(habit.id);
  }, [habit, resumeHabit]);

  const handleMarkCompleted = useCallback(async () => {
    if (!habit) return;
    await setCompletionStatus(habit.id, 'completed', { note: dailyNote });
  }, [habit, dailyNote, setCompletionStatus]);

  const handleMarkMissed = useCallback(async () => {
    if (!habit) return;
    await setCompletionStatus(habit.id, 'missed', { note: dailyNote });
  }, [habit, dailyNote, setCompletionStatus]);

  const handleMarkSkipped = useCallback(async () => {
    if (!habit) return;
    await setCompletionStatus(habit.id, 'skipped', { note: dailyNote });
  }, [habit, dailyNote, setCompletionStatus]);

  const handleClearLog = useCallback(async () => {
    if (!habit) return;
    await clearCompletionForSelectedDate(habit.id);
    setDailyNote('');
  }, [habit, clearCompletionForSelectedDate]);

  const handleMoreActions = () => {
    if (!habit) return;
    const actions: any[] = [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/habit/edit', params: { id: habit.id } }),
      },
    ];

    if (habit.status === 'active') {
      actions.push({
        text: 'Pause',
        onPress: () => setPauseSheetVisible(true),
      });
      actions.push({
        text: 'Archive',
        onPress: async () => {
          await archiveHabit(habit.id);
          router.back();
        },
      });
    } else if (habit.status === 'paused') {
      actions.push({
        text: 'Resume',
        onPress: () => resumeHabit(habit.id),
      });
    }

    actions.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert('Delete Habit', 'Are you sure? This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteHabit(habit.id);
              router.back();
            },
          },
        ]);
      },
    });

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(habit.name, 'Choose an action', actions);
  };

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Habit not found</Text>
      </View>
    );
  }

  const recentCompletions = completions.slice(0, 10);
  const frequencyLabel = getHabitFrequencyLabel(habit);
  const isDueForSelectedDate = isHabitDueOnDate(habit.frequency, habit.customDays, selectedDate);
  const isPausedForSelectedDate = isHabitPausedOnDate(habit, selectedDate);
  const trackingDisabled =
    !isDueForSelectedDate || isPausedForSelectedDate || habit.status === 'archived';
  const statusLabel = !isDueForSelectedDate
    ? 'Not scheduled'
    : isPausedForSelectedDate
      ? 'Paused'
      : getCompletionStatusLabel(selectedDateCompletion);
  const selectedDateLabel = format(parseISO(selectedDate), 'EEE, MMM d');
  const statusColor = !isDueForSelectedDate
    ? colors.textSecondary
    : isPausedForSelectedDate
      ? colors.warning
      : selectedDateCompletion?.status === 'completed'
        ? colors.success
        : selectedDateCompletion?.status === 'missed'
          ? colors.error
          : selectedDateCompletion?.status === 'skipped'
            ? colors.neutralMiss
            : colors.textSecondary;
  const coachMessage = !isDueForSelectedDate
    ? 'This habit is not scheduled for this date, so logging is disabled.'
    : isPausedForSelectedDate
      ? 'Pause is active for this day. This date will not reduce your consistency.'
      : selectedDateCompletion?.status === 'completed'
        ? 'Identity vote recorded. Repeat tomorrow to strengthen the loop.'
        : selectedDateCompletion?.status === 'missed'
          ? 'Never miss twice. Shrink the action and restart on the next cue.'
          : selectedDateCompletion?.status === 'skipped'
            ? 'Compassion keeps consistency alive. Plan your next easiest win.'
            : 'Start tiny: do the smallest useful version to build momentum.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMoreActions} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Habit Info */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.habitHeader}>
          <Text style={styles.habitIcon}>{habit.icon}</Text>
          <Text style={[styles.habitName, { color: colors.textPrimary }]}>{habit.name}</Text>
          <Text style={[styles.frequencyLabel, { color: colors.textSecondary }]}>
            {frequencyLabel}
          </Text>
          {habit.implementationCue && habit.implementationAction ? (
            <Text style={[styles.implementation, { color: colors.textSecondary }]}>
              After {habit.implementationCue}, {habit.implementationAction}
            </Text>
          ) : null}
          {habit.status === 'paused' && (
            <View style={[styles.pausedBadge, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.pausedText, { color: colors.warning }]}>
                ⏸ Paused until {habit.pauseEndDate ? format(parseISO(habit.pauseEndDate), 'MMM d') : 'resumed'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Track Today */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Track This Habit</Text>
          <View
            style={[
              styles.trackCard,
              Shadows.sm,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.trackMetaLabel, { color: colors.textSecondary }]}>
              Status for {selectedDateLabel}
            </Text>
            <Text style={[styles.trackStatusText, { color: statusColor }]}>{statusLabel}</Text>
            <View style={[styles.coachBanner, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              <Text style={[styles.coachBannerText, { color: colors.textSecondary }]}>
                {coachMessage}
              </Text>
            </View>

            <TextInput
              value={dailyNote}
              onChangeText={setDailyNote}
              placeholder="Optional note (example: drank 6 glasses)"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={120}
              editable={!trackingDisabled}
              style={[
                styles.noteInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  opacity: trackingDisabled ? 0.6 : 1,
                },
              ]}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleMarkCompleted}
                disabled={trackingDisabled}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      selectedDateCompletion?.status === 'completed'
                        ? colors.success
                        : colors.successLight,
                    borderColor: colors.success,
                    opacity: trackingDisabled ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: selectedDateCompletion?.status === 'completed' ? '#FFFFFF' : colors.success },
                  ]}
                >
                  Mark Done
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleMarkMissed}
                disabled={trackingDisabled}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      selectedDateCompletion?.status === 'missed'
                        ? colors.error
                        : colors.errorLight,
                    borderColor: colors.error,
                    opacity: trackingDisabled ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: selectedDateCompletion?.status === 'missed' ? '#FFFFFF' : colors.error },
                  ]}
                >
                  Mark Missed
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleMarkSkipped}
                disabled={trackingDisabled}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      selectedDateCompletion?.status === 'skipped'
                        ? colors.neutralMiss
                        : colors.surfaceSecondary,
                    borderColor: colors.neutralMiss,
                    opacity: trackingDisabled ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color:
                        selectedDateCompletion?.status === 'skipped'
                          ? '#FFFFFF'
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Skip Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearLog}
                disabled={!selectedDateCompletion || trackingDisabled}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                    opacity: selectedDateCompletion && !trackingDisabled ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Clear Log
                </Text>
              </TouchableOpacity>
            </View>

            {habit.status === 'active' ? (
              <TouchableOpacity
                onPress={handlePausePress}
                style={[
                  styles.secondaryActionButton,
                  { borderColor: colors.warning, backgroundColor: colors.warningLight },
                ]}
              >
                <Ionicons name="pause" size={16} color={colors.warning} />
                <Text style={[styles.secondaryActionText, { color: colors.warning }]}>
                  Pause Habit
                </Text>
              </TouchableOpacity>
            ) : habit.status === 'paused' ? (
              <TouchableOpacity
                onPress={handleResumePress}
                style={[
                  styles.secondaryActionButton,
                  { borderColor: colors.success, backgroundColor: colors.successLight },
                ]}
              >
                <Ionicons name="play" size={16} color={colors.success} />
                <Text style={[styles.secondaryActionText, { color: colors.success }]}>
                  Resume Habit
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>

        {/* Flex Streak */}
        {flexStreak && (
          <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Flex Streak</Text>
            <FlexStreakDisplay streak={flexStreak} color={habit.color} />
          </Animated.View>
        )}

        {/* Calendar Heatmap */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Last 35 Days</Text>
          <HabitCalendar completions={completions} days={35} color={habit.color} />
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          {recentCompletions.length === 0 ? (
            <Text style={[styles.emptyActivity, { color: colors.textTertiary }]}>
              No activity yet
            </Text>
          ) : (
            recentCompletions.map((comp) => (
              <View
                key={comp.id}
                style={[styles.activityRow, { borderBottomColor: colors.border }]}
              >
                <View
                  style={[
                    styles.activityDot,
                    {
                      backgroundColor:
                        comp.status === 'completed'
                          ? colors.success
                          : comp.status === 'skipped'
                            ? colors.neutralMiss
                            : comp.status === 'missed'
                              ? colors.error
                              : colors.warning,
                    },
                  ]}
                />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityDate, { color: colors.textPrimary }]}>
                    {formatDisplay(parseISO(comp.date))}
                  </Text>
                  <Text style={[styles.activityStatus, { color: colors.textSecondary }]}>
                    {(() => {
                      const base =
                        comp.status === 'completed'
                          ? `Completed${comp.completedAt ? ` at ${format(parseISO(comp.completedAt), 'h:mm a')}` : ''}`
                          : comp.status === 'missed'
                            ? 'Missed'
                            : comp.status === 'skipped'
                              ? `Skipped${comp.contextTag ? ` — ${contextTagLabels[comp.contextTag] || comp.contextTag}` : ''}`
                              : 'Paused';
                      return comp.contextNote ? `${base} — ${comp.contextNote}` : base;
                    })()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        {/* Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
      </ScrollView>

      <PauseSheet
        visible={pauseSheetVisible}
        onClose={() => setPauseSheetVisible(false)}
        onPause={handlePause}
        habitName={habit.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  habitHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  habitIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  habitName: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  frequencyLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  implementation: {
    ...Typography.bodySmall,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing['3xl'],
  },
  pausedBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  pausedText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  trackCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  trackMetaLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  trackStatusText: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  noteInput: {
    ...Typography.bodySmall,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: 72,
    textAlignVertical: 'top',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  coachBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  coachBannerText: {
    ...Typography.caption,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  secondaryActionButton: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  secondaryActionText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  emptyActivity: {
    ...Typography.bodySmall,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDate: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  activityStatus: {
    ...Typography.caption,
    marginTop: 2,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 100,
  },
  adContainer: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
});
