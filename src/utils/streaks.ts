import { Habit, HabitCompletion, FlexStreak } from '../types/habit';
import { getDateRange, getDaysInRange, isHabitDueOnDate, isHabitPausedOnDate, formatDate } from './date';
import { subDays } from 'date-fns';

export function calculateFlexStreak(
  habit: Habit,
  completions: HabitCompletion[]
): FlexStreak {
  const completionMap = new Map<string, HabitCompletion>();
  completions.forEach((c) => completionMap.set(c.date, c));

  const days7 = calculateConsistency(habit, completionMap, 7);
  const days30 = calculateConsistency(habit, completionMap, 30);
  const days90 = calculateConsistency(habit, completionMap, 90);
  const { current, best } = calculateStreaks(habit, completionMap);
  const totalCompletions = completions.filter((c) => c.status === 'completed').length;

  // Determine trend by comparing last 7 days to previous 7 days
  const prev7 = calculateConsistencyForRange(habit, completionMap, 14, 8);
  let trend: 'up' | 'stable' | 'down' = 'stable';
  if (days7 - prev7 > 5) trend = 'up';
  else if (prev7 - days7 > 5) trend = 'down';

  return {
    days7,
    days30,
    days90,
    currentStreak: current,
    bestStreak: best,
    totalCompletions,
    trend,
  };
}

function calculateConsistency(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  days: number
): number {
  const { start, end } = getDateRange(days);
  const allDays = getDaysInRange(start, end);

  let dueDays = 0;
  let completedDays = 0;

  for (const day of allDays) {
    if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;

    const completion = completionMap.get(day);
    if (isHabitPausedOnDate(habit, day) || completion?.status === 'paused') continue;

    dueDays++;
    if (completion?.status === 'completed') {
      completedDays++;
    }
  }

  if (dueDays === 0) return 0;
  return Math.round((completedDays / dueDays) * 100);
}

function calculateConsistencyForRange(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>,
  daysAgo: number,
  daysEnd: number
): number {
  const today = new Date();
  const start = formatDate(subDays(today, daysAgo - 1));
  const end = formatDate(subDays(today, daysEnd));
  const allDays = getDaysInRange(start, end);

  let dueDays = 0;
  let completedDays = 0;

  for (const day of allDays) {
    if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;
    const completion = completionMap.get(day);
    if (isHabitPausedOnDate(habit, day) || completion?.status === 'paused') continue;
    dueDays++;
    if (completion?.status === 'completed') completedDays++;
  }

  if (dueDays === 0) return 0;
  return Math.round((completedDays / dueDays) * 100);
}

function calculateStreaks(
  habit: Habit,
  completionMap: Map<string, HabitCompletion>
): { current: number; best: number } {
  let current = 0;
  let best = 0;
  let streak = 0;
  let foundFirstMiss = false;

  // Walk backward from today
  for (let i = 0; i < 365; i++) {
    const date = formatDate(subDays(new Date(), i));

    if (!isHabitDueOnDate(habit.frequency, habit.customDays, date)) continue;

    const completion = completionMap.get(date);
    if (isHabitPausedOnDate(habit, date) || completion?.status === 'paused') continue;

    if (completion?.status === 'completed') {
      streak++;
      if (!foundFirstMiss) current = streak;
    } else {
      if (!foundFirstMiss) foundFirstMiss = true;
      if (streak > best) best = streak;
      streak = 0;
    }
  }

  if (streak > best) best = streak;
  if (current > best) best = current;

  return { current, best };
}

export function getHabitStrengthLabel(percentage: number): string {
  if (percentage >= 90) return 'Outstanding';
  if (percentage >= 75) return 'Strong';
  if (percentage >= 60) return 'Building';
  if (percentage >= 40) return 'Developing';
  if (percentage >= 20) return 'Starting';
  return 'New';
}

export function getHabitStrengthColor(percentage: number): string {
  if (percentage >= 75) return '#22C55E';
  if (percentage >= 50) return '#0EA5E9';
  if (percentage >= 25) return '#F59E0B';
  return '#94A3B8';
}

export function getTrendEmoji(trend: 'up' | 'stable' | 'down'): string {
  switch (trend) {
    case 'up': return '📈';
    case 'stable': return '➡️';
    case 'down': return '📉';
  }
}
