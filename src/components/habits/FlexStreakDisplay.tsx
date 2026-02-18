import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ProgressRing } from '../ui/ProgressRing';
import { FlexStreak } from '../../types/habit';
import { getHabitStrengthLabel, getHabitStrengthColor, getTrendEmoji } from '../../utils/streaks';

interface FlexStreakDisplayProps {
  streak: FlexStreak;
  color?: string;
}

export function FlexStreakDisplay({ streak, color }: FlexStreakDisplayProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.ringsRow}>
        <View style={styles.ringItem}>
          <ProgressRing
            percentage={streak.days7}
            size={80}
            strokeWidth={6}
            color={color || colors.primary}
            label="7d"
            delay={0}
          />
        </View>
        <View style={styles.ringItem}>
          <ProgressRing
            percentage={streak.days30}
            size={80}
            strokeWidth={6}
            color={color || colors.secondary}
            label="30d"
            delay={150}
          />
        </View>
        <View style={styles.ringItem}>
          <ProgressRing
            percentage={streak.days90}
            size={80}
            strokeWidth={6}
            color={color || colors.success}
            label="90d"
            delay={300}
          />
        </View>
      </View>

      <View style={[styles.statsRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.currentStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.bestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {streak.totalCompletions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {getTrendEmoji(streak.trend)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trend</Text>
        </View>
      </View>

      <View style={[styles.strengthBadge, { backgroundColor: getHabitStrengthColor(streak.days30) + '20' }]}>
        <Text style={[styles.strengthText, { color: getHabitStrengthColor(streak.days30) }]}>
          Habit Strength: {getHabitStrengthLabel(streak.days30)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing['2xl'],
  },
  ringItem: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
  },
  divider: {
    width: 1,
    height: '100%',
  },
  strengthBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  strengthText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
