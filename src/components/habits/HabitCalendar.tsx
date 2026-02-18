import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';
import { HabitCompletion } from '../../types/habit';
import { getDaysInRange, formatDate } from '../../utils/date';
import { subDays, getDay } from 'date-fns';

interface HabitCalendarProps {
  completions: HabitCompletion[];
  days?: number;
  color?: string;
}

export function HabitCalendar({ completions, days = 35, color }: HabitCalendarProps) {
  const colors = useColors();
  const accentColor = color || colors.primary;
  const today = new Date();
  const startDate = formatDate(subDays(today, days - 1));
  const endDate = formatDate(today);
  const allDays = getDaysInRange(startDate, endDate);

  const completionMap = new Map<string, HabitCompletion>();
  completions.forEach((c) => completionMap.set(c.date, c));

  // Group by weeks
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  // Pad start to align with Sunday
  const firstDayOfWeek = getDay(new Date(allDays[0] + 'T12:00:00'));
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push('');
  }

  for (const day of allDays) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push('');
    weeks.push(currentWeek);
  }

  const getCellColor = (day: string): string => {
    if (!day) return 'transparent';
    const completion = completionMap.get(day);
    if (!completion) return colors.surfaceSecondary;
    switch (completion.status) {
      case 'completed':
        return accentColor;
      case 'skipped':
        return colors.neutralMiss;
      case 'paused':
        return colors.warningLight;
      default:
        return colors.surfaceSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dayLabels}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
          <Text key={i} style={[styles.dayLabel, { color: colors.textTertiary }]}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <View
              key={dayIndex}
              style={[
                styles.cell,
                { backgroundColor: getCellColor(day) },
                day === endDate && styles.todayCell,
                day === endDate && { borderColor: accentColor },
              ]}
            />
          ))}
        </View>
      ))}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.neutralMiss }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warningLight }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Paused</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.surfaceSecondary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  dayLabel: {
    ...Typography.caption,
    width: 28,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  cell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  todayCell: {
    borderWidth: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  legendText: {
    ...Typography.caption,
  },
});
