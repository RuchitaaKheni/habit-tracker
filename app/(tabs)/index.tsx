import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { useColors } from '../../src/hooks/useColors';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { HabitCard } from '../../src/components/habits/HabitCard';
import { ContextTagSheet } from '../../src/components/habits/ContextTagSheet';
import { PauseSheet } from '../../src/components/habits/PauseSheet';
import { MoodTracker } from '../../src/components/habits/MoodTracker';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Toast } from '../../src/components/ui/Toast';
import { HabitCardSkeleton } from '../../src/components/ui/SkeletonLoader';
import { BannerAdComponent } from '../../src/components/ads/BannerAd';
import { maybeShowInterstitial } from '../../src/components/ads/InterstitialAd';
import { getGreeting, isHabitDueOnDate, isHabitPausedOnDate } from '../../src/utils/date';
import { encouragingMessages } from '../../src/constants/templates';
import { ContextTag } from '../../src/types/habit';
import { useShallow } from 'zustand/react/shallow';

function areStreakMapsEqual(
  current: Record<string, number>,
  next: Record<string, number>
): boolean {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) return false;

  for (const key of nextKeys) {
    if (current[key] !== next[key]) return false;
  }

  return true;
}

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    habits,
    todayCompletions,
    isLoading,
    selectedDate,
    setSelectedDate,
    toggleCompletion,
    skipHabit,
    pauseHabit,
    loadTodayCompletions,
    getFlexStreak,
  } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      todayCompletions: state.todayCompletions,
      isLoading: state.isLoading,
      selectedDate: state.selectedDate,
      setSelectedDate: state.setSelectedDate,
      toggleCompletion: state.toggleCompletion,
      skipHabit: state.skipHabit,
      pauseHabit: state.pauseHabit,
      loadTodayCompletions: state.loadTodayCompletions,
      getFlexStreak: state.getFlexStreak,
    }))
  );

  const [refreshing, setRefreshing] = useState(false);
  const [contextSheetVisible, setContextSheetVisible] = useState(false);
  const [pauseSheetVisible, setPauseSheetVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const todayDate = useMemo(() => new Date(), []);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => subDays(todayDate, 6 - i)),
    [todayDate]
  );

  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const hasTrackableHabits = useMemo(
    () => habits.some((habit) => habit.status !== 'archived'),
    [habits]
  );

  const todayHabits = useMemo(
    () =>
      habits.filter(
        (habit) =>
          habit.status !== 'archived' &&
          isHabitDueOnDate(habit.frequency, habit.customDays, selectedDate) &&
          !isHabitPausedOnDate(habit, selectedDate)
      ),
    [habits, selectedDate]
  );

  const completedCount = useMemo(
    () =>
      todayHabits.reduce(
        (count, habit) => count + (todayCompletions.get(habit.id)?.status === 'completed' ? 1 : 0),
        0
      ),
    [todayHabits, todayCompletions]
  );
  const totalCount = todayHabits.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const maxStreak = useMemo(
    () => Object.values(streaks).reduce((max, value) => Math.max(max, value), 0),
    [streaks]
  );

  const { dailyInsightTitle, dailyInsightBody } = useMemo(() => {
    if (completionPercentage >= 80) {
      return {
        dailyInsightTitle: 'Identity Momentum',
        dailyInsightBody:
          'You are reinforcing identity with repeat action. Protect this rhythm tomorrow.',
      };
    }

    if (completionPercentage >= 40) {
      return {
        dailyInsightTitle: 'Keep the Chain Alive',
        dailyInsightBody: 'One more check-in today can push your day into a winning pattern.',
      };
    }

    return {
      dailyInsightTitle: 'Start Tiny Today',
      dailyInsightBody: 'Use the 2-minute rule. Start with the smallest version and build after.',
    };
  }, [completionPercentage]);

  const refreshStreakForHabit = useCallback(
    async (habitId: string) => {
      const flex = await getFlexStreak(habitId);
      setStreaks((previous) => {
        if (previous[habitId] === flex.days7) {
          return previous;
        }
        return { ...previous, [habitId]: flex.days7 };
      });
    },
    [getFlexStreak]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadStreaks() {
      const streakEntries = await Promise.all(
        todayHabits.map(async (habit) => {
          const flex = await getFlexStreak(habit.id);
          return [habit.id, flex.days7] as const;
        })
      );

      if (cancelled) return;
      const streakData = Object.fromEntries(streakEntries) as Record<string, number>;
      setStreaks((previous) => (areStreakMapsEqual(previous, streakData) ? previous : streakData));
    }

    if (todayHabits.length > 0) {
      void loadStreaks();
    } else {
      setStreaks((previous) => (Object.keys(previous).length === 0 ? previous : {}));
    }

    return () => {
      cancelled = true;
    };
  }, [todayHabits, getFlexStreak]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodayCompletions();
    setRefreshing(false);
  }, [loadTodayCompletions]);

  const handleToggle = useCallback(
    async (habitId: string) => {
      const wasCompleted = todayCompletions.get(habitId)?.status === 'completed';
      await toggleCompletion(habitId);
      void refreshStreakForHabit(habitId);

      if (!wasCompleted) {
        setToastMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
        setShowToast(true);
        maybeShowInterstitial();
      }
    },
    [todayCompletions, toggleCompletion, refreshStreakForHabit]
  );

  const handleHabitPress = useCallback(
    (habitId: string) => {
      router.push(`/habit/${habitId}`);
    },
    [router]
  );

  const handleLongPress = useCallback((habitId: string) => {
    setSelectedHabitId(habitId);
    setContextSheetVisible(true);
  }, []);

  const handlePauseFromSkipSheet = useCallback(() => {
    setContextSheetVisible(false);
    setPauseSheetVisible(true);
  }, []);

  const handleSkip = useCallback(
    async (tag: ContextTag, note?: string) => {
      if (selectedHabitId) {
        await skipHabit(selectedHabitId, tag, note);
        void refreshStreakForHabit(selectedHabitId);
        setToastMessage('Habit skipped — no judgment!');
        setShowToast(true);
      }
    },
    [selectedHabitId, skipHabit, refreshStreakForHabit]
  );

  const handlePause = useCallback(
    async (endDate: string) => {
      if (selectedHabitId) {
        await pauseHabit(selectedHabitId, endDate);
        setToastMessage('Habit paused. Take your time!');
        setShowToast(true);
      }
    },
    [selectedHabitId, pauseHabit]
  );

  const selectedHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId),
    [habits, selectedHabitId]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.dateLine, { color: colors.textSecondary }]}>
            {format(selectedDateObj, 'EEEE, MMMM d')}
          </Text>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            {getGreeting()} 👋
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Build consistency with one clear action at a time.
          </Text>
        </View>

        <View style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.quoteIconWrap, { backgroundColor: colors.primary }]}>
            <Ionicons name="book-outline" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.quoteTextWrap}>
            <Text style={[styles.quoteText, { color: colors.textPrimary }]}>
              "Focus on who you wish to become, not only what you want to achieve."
            </Text>
            <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>James Clear</Text>
          </View>
          <TouchableOpacity
            style={[styles.quoteTag, { backgroundColor: colors.primaryLight }]}
            onPress={() => router.push('/knowledge')}
          >
            <Text style={[styles.quoteTagText, { color: colors.primary }]}>Identity</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.weekStripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.weekStrip}>
            {weekDates.map((date) => {
              const dateValue = format(date, 'yyyy-MM-dd');
              const selected = dateValue === selectedDate;
              const isToday = dateValue === format(todayDate, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={dateValue}
                  onPress={() => setSelectedDate(dateValue)}
                  style={styles.dayWrap}
                >
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                    {format(date, 'EEE')}
                  </Text>
                  <View
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.dayNumber, { color: selected ? '#FFFFFF' : colors.textPrimary }]}>
                      {format(date, 'd')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.todayDot,
                      { backgroundColor: isToday ? colors.primary : 'transparent' },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100)} style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProgressRing
            percentage={completionPercentage}
            size={88}
            strokeWidth={8}
            color={completionPercentage >= 80 ? colors.success : colors.primary}
          />
          <View style={styles.progressTextWrap}>
            <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Today's Progress</Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              {completedCount}/{totalCount} habits completed
            </Text>
            <View style={styles.progressMetaRow}>
              <Ionicons name="flame-outline" size={14} color="#F59E0B" />
              <Text style={[styles.progressMetaText, { color: colors.textPrimary }]}>
                {maxStreak} day streak
              </Text>
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity
          onPress={() => router.push('/knowledge')}
          style={[styles.dailyInsightCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}
        >
          <View style={[styles.insightIconWrap, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="bulb-outline" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.insightTextWrap}>
            <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Daily Insight</Text>
            <Text style={[styles.insightTopic, { color: colors.primary }]}>{dailyInsightTitle}</Text>
            <Text style={[styles.insightBody, { color: colors.textSecondary }]} numberOfLines={2}>
              {dailyInsightBody}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <MoodTracker />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Habits</Text>
          <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
            {completedCount}/{totalCount}
          </Text>
        </View>

        {isLoading ? (
          <>
            <HabitCardSkeleton />
            <HabitCardSkeleton />
            <HabitCardSkeleton />
          </>
        ) : todayHabits.length === 0 ? (
          <EmptyState
            icon="🌱"
            title={hasTrackableHabits ? 'No habits scheduled' : 'No habits yet'}
            message={
              hasTrackableHabits
                ? 'This date has no due habits. Pick another day or create a flexible habit.'
                : 'Create your first habit and start building a better routine.'
            }
            actionLabel={hasTrackableHabits ? undefined : 'Create Habit'}
            onAction={hasTrackableHabits ? undefined : () => router.push('/habit/create')}
          />
        ) : (
          todayHabits.map((habit, index) => (
            <Animated.View key={habit.id} entering={FadeInDown.delay(180 + index * 50)}>
              <HabitCard
                habit={habit}
                completion={todayCompletions.get(habit.id)}
                consistencyPercent={streaks[habit.id]}
                onToggle={handleToggle}
                onPress={handleHabitPress}
                onLongPress={handleLongPress}
              />
            </Animated.View>
          ))
        )}

        {todayHabits.length > 0 && (
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>
        )}
      </ScrollView>

      <ContextTagSheet
        visible={contextSheetVisible}
        onClose={() => setContextSheetVisible(false)}
        onSelect={handleSkip}
        onPausePress={handlePauseFromSkipSheet}
        habitName={selectedHabit?.name || ''}
      />

      <PauseSheet
        visible={pauseSheetVisible}
        onClose={() => setPauseSheetVisible(false)}
        onPause={handlePause}
        habitName={selectedHabit?.name || ''}
      />

      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dateLine: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  greeting: {
    ...Typography.h1,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  quoteCard: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quoteIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  quoteTextWrap: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  quoteText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  quoteAuthor: {
    ...Typography.caption,
    marginTop: 4,
  },
  quoteTag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginLeft: Spacing.xs,
  },
  quoteTagText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  weekStripCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  dayWrap: {
    alignItems: 'center',
    width: 44,
  },
  dayLabel: {
    ...Typography.caption,
    marginBottom: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
  },
  progressCard: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  },
  progressTextWrap: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  progressTitle: {
    ...Typography.h3,
  },
  progressSubtitle: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  progressMetaText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  dailyInsightCard: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  insightTopic: {
    ...Typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  insightBody: {
    ...Typography.caption,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h2,
  },
  sectionCount: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  adContainer: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
});
