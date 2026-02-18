import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { getMoodsInRange, getAllCompletionsInRange } from '../../database/database';
import { getDateRange, getToday } from '../../utils/date';
import { useHabitStore } from '../../store/habitStore';

interface MoodHabitCorrelation {
  habitName: string;
  avgMoodWithHabit: number;
  avgMoodWithoutHabit: number;
  difference: number;
}

export function MoodCorrelation() {
  const colors = useColors();
  const { habits } = useHabitStore();
  const [correlations, setCorrelations] = useState<MoodHabitCorrelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyze() {
      const { start, end } = getDateRange(30);
      const moods = await getMoodsInRange(start, end);
      const completions = await getAllCompletionsInRange(start, end);

      if (moods.length < 5) {
        setLoading(false);
        return;
      }

      const moodByDate = new Map(moods.map((m) => [m.date, m.rating]));
      const results: MoodHabitCorrelation[] = [];

      for (const habit of habits.filter((h) => h.status === 'active')) {
        const habitCompletions = new Set(
          completions
            .filter((c) => c.habitId === habit.id && c.status === 'completed')
            .map((c) => c.date)
        );

        let withTotal = 0;
        let withCount = 0;
        let withoutTotal = 0;
        let withoutCount = 0;

        for (const [date, rating] of moodByDate) {
          if (habitCompletions.has(date)) {
            withTotal += rating;
            withCount++;
          } else {
            withoutTotal += rating;
            withoutCount++;
          }
        }

        if (withCount > 0 && withoutCount > 0) {
          const avgWith = withTotal / withCount;
          const avgWithout = withoutTotal / withoutCount;
          results.push({
            habitName: habit.name,
            avgMoodWithHabit: Math.round(avgWith * 10) / 10,
            avgMoodWithoutHabit: Math.round(avgWithout * 10) / 10,
            difference: Math.round((avgWith - avgWithout) * 10) / 10,
          });
        }
      }

      results.sort((a, b) => b.difference - a.difference);
      setCorrelations(results.slice(0, 5));
      setLoading(false);
    }

    analyze();
  }, [habits]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Mood-Habit Correlation</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Analyzing your last 30 days...
        </Text>
      </View>
    );
  }

  if (correlations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Mood-Habit Correlation</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track mood and complete habits for a few days to unlock this insight.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Mood-Habit Correlation</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        How your habits affect your mood (last 30 days)
      </Text>
      {correlations.map((corr, i) => (
        <View key={i} style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.habitName, { color: colors.textPrimary }]}>{corr.habitName}</Text>
          <View style={styles.moodValues}>
            <Text style={[styles.moodValue, { color: colors.success }]}>
              {corr.avgMoodWithHabit} with
            </Text>
            <Text style={[styles.separator, { color: colors.textTertiary }]}>vs</Text>
            <Text style={[styles.moodValue, { color: colors.neutralMiss }]}>
              {corr.avgMoodWithoutHabit} without
            </Text>
          </View>
          <View
            style={[
              styles.diffBadge,
              {
                backgroundColor:
                  corr.difference > 0 ? colors.successLight : colors.warningLight,
              },
            ]}
          >
            <Text
              style={[
                styles.diffText,
                { color: corr.difference > 0 ? colors.success : colors.warning },
              ]}
            >
              {corr.difference > 0 ? '+' : ''}{corr.difference}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  habitName: {
    ...Typography.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  moodValues: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  moodValue: {
    ...Typography.caption,
    fontWeight: '600',
  },
  separator: {
    ...Typography.caption,
    marginHorizontal: Spacing.xs,
  },
  diffBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  diffText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
