import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MoodCorrelation } from '../../src/components/insights/MoodCorrelation';
import { getDateRange, getToday } from '../../src/utils/date';
import * as db from '../../src/database/database';
import { HabitCompletion } from '../../src/types/habit';

const ANALYTICS_WINDOW_DAYS = 35;

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, getFlexStreak } = useHabitStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [bestStreak, setBestStreak] = useState(0);

  const activeHabits = useMemo(
    () => habits.filter((habit) => habit.status === 'active'),
    [habits]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(ANALYTICS_WINDOW_DAYS);
    const data = await db.getAllCompletionsInRange(start, end);
    setCompletions(data);

    if (activeHabits.length === 0) {
      setBestStreak(0);
      setLoading(false);
      return;
    }

    const streaks = await Promise.all(activeHabits.map((habit) => getFlexStreak(habit.id)));
    setBestStreak(streaks.reduce((best, streak) => Math.max(best, streak.bestStreak), 0));
    setLoading(false);
  }, [activeHabits, getFlexStreak]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const completed = useMemo(
    () => completions.filter((item) => item.status === 'completed'),
    [completions]
  );

  const completedByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of completed) {
      map.set(item.date, (map.get(item.date) || 0) + 1);
    }
    return map;
  }, [completed]);

  const todayCompleted = completedByDay.get(getToday()) || 0;
  const dailyAverage = completed.length / ANALYTICS_WINDOW_DAYS;

  const weeklyBars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        key: dateKey,
        label: format(date, 'EEE'),
        value: completedByDay.get(dateKey) || 0,
      };
    });
  }, [completedByDay]);

  const maxWeekValue = Math.max(1, ...weeklyBars.map((bar) => bar.value));

  const heatmap = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 28 }, (_, i) => {
      const date = subDays(today, 27 - i);
      const key = format(date, 'yyyy-MM-dd');
      const value = completedByDay.get(key) || 0;
      return { key, value };
    });
  }, [completedByDay]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingCenter}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (activeHabits.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics</Text>
        <EmptyState
          icon="📊"
          title="No analytics yet"
          message="Create and track habits to unlock your performance dashboard."
        />
      </View>
    );
  }

  const metricCards = [
    {
      key: 'checkins',
      icon: 'radio-button-on-outline',
      iconColor: colors.primary,
      value: completed.length.toString(),
      label: 'Total Check-ins',
    },
    {
      key: 'streak',
      icon: 'flame-outline',
      iconColor: '#F59E0B',
      value: `${bestStreak}d`,
      label: 'Best Streak',
    },
    {
      key: 'average',
      icon: 'trending-up-outline',
      iconColor: colors.success,
      value: dailyAverage.toFixed(1),
      label: 'Daily Average',
    },
    {
      key: 'today',
      icon: 'calendar-outline',
      iconColor: colors.primary,
      value: `${todayCompleted}/${activeHabits.length}`,
      label: 'Today',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your habit progress at a glance
        </Text>

        <View style={styles.metricsGrid}>
          {metricCards.map((card) => (
            <View
              key={card.key}
              style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name={card.icon as any} size={18} color={card.iconColor} />
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{card.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This Week</Text>
          <View style={styles.weekBars}>
            {weeklyBars.map((bar) => {
              const height = 16 + (bar.value / maxWeekValue) * 72;
              return (
                <View key={bar.key} style={styles.barWrap}>
                  <Text style={[styles.barValue, { color: colors.textSecondary }]}>{bar.value}</Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height,
                          backgroundColor: bar.value > 0 ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{bar.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Last 4 Weeks</Text>
          <View style={styles.heatmapGrid}>
            {heatmap.map((cell) => {
              const intensity =
                cell.value >= 3
                  ? colors.primary
                  : cell.value === 2
                    ? '#7FD4C2'
                    : cell.value === 1
                      ? '#B7E9DF'
                      : colors.surfaceSecondary;
              return (
                <View
                  key={cell.key}
                  style={[styles.heatCell, { backgroundColor: intensity }]}
                />
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MoodCorrelation />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
  },
  title: {
    ...Typography.h1,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.lg,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  metricValue: {
    ...Typography.h1,
    marginTop: 8,
  },
  metricLabel: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  weekBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barWrap: {
    alignItems: 'center',
    width: 38,
  },
  barValue: {
    ...Typography.caption,
    marginBottom: 6,
  },
  barTrack: {
    width: 32,
    height: 96,
    borderRadius: BorderRadius.md,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  barFill: {
    width: 32,
    borderRadius: BorderRadius.md,
  },
  barLabel: {
    ...Typography.caption,
    marginTop: 6,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  heatCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
});
