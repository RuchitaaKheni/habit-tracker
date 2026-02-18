import { Habit, HabitCompletion, WeeklyInsight } from '../types/habit';
import { getWeekRange, getDaysInRange, isHabitDueOnDate, getDayName, formatDate } from './date';
import { subDays, getDay } from 'date-fns';
import { encouragingMessages } from '../constants/templates';

export function generateWeeklyInsight(
  habits: Habit[],
  completions: HabitCompletion[],
  weekStartDay: number = 1
): WeeklyInsight {
  const activeHabits = habits.filter((h) => h.status === 'active');
  const { start, end } = getWeekRange(weekStartDay);
  const days = getDaysInRange(start, end);

  const completionMap = new Map<string, HabitCompletion[]>();
  completions.forEach((c) => {
    const existing = completionMap.get(c.date) || [];
    existing.push(c);
    completionMap.set(c.date, existing);
  });

  // Calculate overall consistency this week
  let totalDue = 0;
  let totalCompleted = 0;
  const dayStats = new Map<number, { due: number; completed: number }>();

  for (const day of days) {
    const dayOfWeek = getDay(new Date(day + 'T12:00:00'));
    const stats = dayStats.get(dayOfWeek) || { due: 0, completed: 0 };

    for (const habit of activeHabits) {
      if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;
      totalDue++;
      stats.due++;

      const dayCompletions = completionMap.get(day) || [];
      const habitCompletion = dayCompletions.find((c) => c.habitId === habit.id);
      if (habitCompletion?.status === 'completed') {
        totalCompleted++;
        stats.completed++;
      }
    }

    dayStats.set(dayOfWeek, stats);
  }

  const overallConsistency = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;

  // Calculate previous week for comparison
  const prevStart = formatDate(subDays(new Date(start + 'T12:00:00'), 7));
  const prevEnd = formatDate(subDays(new Date(end + 'T12:00:00'), 7));
  const prevDays = getDaysInRange(prevStart, prevEnd);
  let prevDue = 0;
  let prevCompleted = 0;

  for (const day of prevDays) {
    for (const habit of activeHabits) {
      if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;
      prevDue++;
      const dayCompletions = completionMap.get(day) || [];
      if (dayCompletions.find((c) => c.habitId === habit.id && c.status === 'completed')) {
        prevCompleted++;
      }
    }
  }
  const previousConsistency = prevDue > 0 ? Math.round((prevCompleted / prevDue) * 100) : 0;

  // Find best and worst days
  let bestDay = 0;
  let bestDayPercentage = 0;
  let worstDay = 0;
  let worstDayPercentage = 100;

  dayStats.forEach((stats, day) => {
    const pct = stats.due > 0 ? Math.round((stats.completed / stats.due) * 100) : 0;
    if (pct > bestDayPercentage || (pct === bestDayPercentage && stats.due > 0)) {
      bestDay = day;
      bestDayPercentage = pct;
    }
    if (pct < worstDayPercentage && stats.due > 0) {
      worstDay = day;
      worstDayPercentage = pct;
    }
  });

  // Per-habit strength
  const habitStrengths = activeHabits.map((habit) => {
    let due = 0;
    let completed = 0;
    for (const day of days) {
      if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;
      due++;
      const dayCompletions = completionMap.get(day) || [];
      if (dayCompletions.find((c) => c.habitId === habit.id && c.status === 'completed')) {
        completed++;
      }
    }
    return {
      habitId: habit.id,
      name: habit.name,
      percentage: due > 0 ? Math.round((completed / due) * 100) : 0,
    };
  });

  // Generate insight messages
  const insights: string[] = [];

  if (overallConsistency > previousConsistency) {
    insights.push(
      `Your consistency improved from ${previousConsistency}% to ${overallConsistency}% this week!`
    );
  } else if (overallConsistency < previousConsistency && previousConsistency > 0) {
    insights.push(
      `Your consistency dipped from ${previousConsistency}% to ${overallConsistency}%. ${encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]}`
    );
  }

  if (bestDayPercentage > 0) {
    insights.push(`${getDayName(bestDay)} is your strongest day at ${bestDayPercentage}% completion.`);
  }

  const strongHabits = habitStrengths.filter((h) => h.percentage >= 80);
  if (strongHabits.length > 0) {
    insights.push(
      `${strongHabits[0].name} is your strongest habit this week at ${strongHabits[0].percentage}%.`
    );
  }

  const weakHabits = habitStrengths.filter((h) => h.percentage < 50 && h.percentage > 0);
  if (weakHabits.length > 0) {
    insights.push(`${weakHabits[0].name} could use some attention — try a smaller version of it.`);
  }

  if (insights.length === 0) {
    insights.push('Start tracking your habits to see personalized insights here!');
  }

  return {
    weekStart: start,
    weekEnd: end,
    overallConsistency,
    previousConsistency,
    bestDay: getDayName(bestDay),
    bestDayPercentage,
    worstDay: getDayName(worstDay),
    worstDayPercentage,
    habitStrengths,
    totalCompletions: totalCompleted,
    insights,
  };
}
