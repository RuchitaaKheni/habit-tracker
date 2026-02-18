import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';
import { BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { getDateRange, isHabitDueOnDate, isHabitPausedOnDate } from '../../src/utils/date';
import * as db from '../../src/database/database';
import { useShallow } from 'zustand/react/shallow';

interface Achievement {
  id: string;
  title: string;
  description: string;
  principle: string;
  icon: string;
  unlocked: boolean;
}

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, getFlexStreak } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      getFlexStreak: state.getFlexStreak,
    }))
  );
  const [refreshing, setRefreshing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [maxDailyCompletions, setMaxDailyCompletions] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);

  const loadStats = useCallback(async () => {
    const trackableHabits = habits.filter((h) => h.status !== 'archived');
    const { start, end } = getDateRange(60);
    const completions = await db.getAllCompletionsInRange(start, end);

    const completed = completions.filter((c) => c.status === 'completed');
    setCompletedCount(completed.length);

    const completedByDay = new Map<string, number>();
    for (const comp of completed) {
      completedByDay.set(comp.date, (completedByDay.get(comp.date) || 0) + 1);
    }

    setMaxDailyCompletions(
      Array.from(completedByDay.values()).reduce((max, current) => Math.max(max, current), 0)
    );

    let fullDays = 0;
    for (const [date, doneCount] of completedByDay.entries()) {
      const dueCount = trackableHabits.filter((habit) => {
        if (!isHabitDueOnDate(habit.frequency, habit.customDays, date)) return false;
        return !isHabitPausedOnDate(habit, date);
      }).length;
      if (dueCount > 0 && doneCount >= dueCount) {
        fullDays++;
      }
    }
    setPerfectDays(fullDays);

    if (trackableHabits.length === 0) {
      setBestStreak(0);
      return;
    }

    const streakValues = await Promise.all(trackableHabits.map((habit) => getFlexStreak(habit.id)));
    setBestStreak(
      streakValues.reduce((best, value) => Math.max(best, value.bestStreak), 0)
    );
  }, [habits, getFlexStreak]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const achievements: Achievement[] = useMemo(
    () => [
      {
        id: 'first-step',
        title: 'First Step',
        description: 'Complete your first habit',
        principle: '3rd Law: Make it easy',
        icon: '🌱',
        unlocked: completedCount >= 1,
      },
      {
        id: 'hat-trick',
        title: 'Hat Trick',
        description: 'Complete 3 habits in one day',
        principle: 'Compound effect',
        icon: '🎩',
        unlocked: maxDailyCompletions >= 3,
      },
      {
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Reach a 7-day streak',
        principle: 'Never miss twice',
        icon: '⚔️',
        unlocked: bestStreak >= 7,
      },
      {
        id: 'consistency-king',
        title: 'Consistency King',
        description: 'Reach a 14-day streak',
        principle: '1% better every day',
        icon: '👑',
        unlocked: bestStreak >= 14,
      },
      {
        id: 'showing-up',
        title: 'Showing Up',
        description: 'Complete all due habits in a day',
        principle: 'Master the art of showing up',
        icon: '✅',
        unlocked: perfectDays >= 1,
      },
    ],
    [completedCount, maxDailyCompletions, bestStreak, perfectDays]
  );

  const unlocked = achievements.filter((item) => item.unlocked);
  const locked = achievements.filter((item) => !item.unlocked);
  const progress = achievements.length ? unlocked.length / achievements.length : 0;

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Achievements</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {unlocked.length}/{achievements.length} unlocked
          </Text>
        </View>

        <View style={[styles.lawBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.lawIcon}>✨</Text>
          <View style={styles.lawTextWrap}>
            <Text style={[styles.lawTitle, { color: colors.textPrimary }]}>
              4th Law: Make It Satisfying
            </Text>
            <Text style={[styles.lawText, { color: colors.textSecondary }]}>
              Rewarded behavior gets repeated. Track your wins to reinforce consistency.
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: '#F59E0B' },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Unlocked</Text>
          {unlocked.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Complete your first check-in to unlock rewards.
              </Text>
            </View>
          ) : (
            unlocked.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: '#FDE3C2' }]}
              >
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.cardPrinciple, { color: colors.primary }]}>
                    {item.principle}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {locked.length > 0 && (
          <View style={styles.section}>
            <View style={styles.lockedHeader}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                Keep Going
              </Text>
            </View>
            {locked.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: colors.surface }]}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.cardPrinciple, { color: colors.textTertiary }]}>
                    {item.principle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  lawBanner: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  lawIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  lawTextWrap: {
    flex: 1,
  },
  lawTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  lawText: {
    ...Typography.caption,
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    marginRight: Spacing.md,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  cardDescription: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  cardPrinciple: {
    ...Typography.caption,
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.bodySmall,
  },
});
