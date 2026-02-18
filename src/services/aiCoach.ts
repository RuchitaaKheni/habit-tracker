/**
 * AI Coaching Assistant - Phase 3
 *
 * This module provides rule-based coaching suggestions based on user patterns.
 * In a future iteration, this could integrate with OpenAI API or a custom ML model.
 *
 * For MVP, it uses heuristic rules derived from behavioral psychology research.
 */

import { Habit, HabitCompletion, FlexStreak } from '../types/habit';
import { getHabitStrengthLabel } from '../utils/streaks';

export interface CoachingTip {
  id: string;
  title: string;
  message: string;
  icon: string;
  category: 'motivation' | 'strategy' | 'insight' | 'celebration';
  priority: number; // 1 = highest
}

export function generateCoachingTips(
  habits: Habit[],
  streaks: Map<string, FlexStreak>,
  totalDaysTracked: number
): CoachingTip[] {
  const tips: CoachingTip[] = [];
  const activeHabits = habits.filter((h) => h.status === 'active');

  // New user encouragement
  if (totalDaysTracked < 7) {
    tips.push({
      id: 'new-user',
      title: 'Great start!',
      message: `You've been tracking for ${totalDaysTracked} days. Research shows it takes about 66 days to form a habit. You're on your way!`,
      icon: '🌱',
      category: 'motivation',
      priority: 1,
    });
  }

  // Check for struggling habits
  for (const habit of activeHabits) {
    const streak = streaks.get(habit.id);
    if (!streak) continue;

    // Celebrate strong habits
    if (streak.days30 >= 80) {
      tips.push({
        id: `strong-${habit.id}`,
        title: `${habit.name} is becoming automatic!`,
        message: `With ${streak.days30}% consistency over 30 days, this habit is well on its way to becoming second nature.`,
        icon: '💪',
        category: 'celebration',
        priority: 2,
      });
    }

    // Advice for declining habits
    if (streak.trend === 'down' && streak.days7 < 50) {
      tips.push({
        id: `declining-${habit.id}`,
        title: `${habit.name} needs attention`,
        message: `Your consistency has been dropping. Try making it smaller — even a 2-minute version counts. What's the tiniest version you could do?`,
        icon: '🔍',
        category: 'strategy',
        priority: 1,
      });
    }

    // Missing implementation intention
    if (!habit.implementationCue || !habit.implementationAction) {
      tips.push({
        id: `intention-${habit.id}`,
        title: 'Double your success rate',
        message: `Add an implementation intention to "${habit.name}". Research shows "After I [cue], I will [habit]" planning doubles follow-through rates.`,
        icon: '🧠',
        category: 'strategy',
        priority: 3,
      });
    }

    // Streak milestone approaching
    if (streak.currentStreak > 0 && streak.currentStreak % 7 === 6) {
      tips.push({
        id: `milestone-${habit.id}`,
        title: 'Almost at a milestone!',
        message: `You're one day away from a ${streak.currentStreak + 1}-day streak for ${habit.name}. Don't break the chain!`,
        icon: '🔥',
        category: 'motivation',
        priority: 1,
      });
    }
  }

  // Too many habits warning
  if (activeHabits.length > 5) {
    const weakHabits = activeHabits.filter((h) => {
      const s = streaks.get(h.id);
      return s && s.days30 < 40;
    });

    if (weakHabits.length > 2) {
      tips.push({
        id: 'too-many',
        title: 'Focus for better results',
        message: `You have ${activeHabits.length} active habits but ${weakHabits.length} are below 40% consistency. Consider pausing some to strengthen others. Quality beats quantity!`,
        icon: '🎯',
        category: 'strategy',
        priority: 1,
      });
    }
  }

  // General tips based on tracking duration
  if (totalDaysTracked >= 21 && totalDaysTracked < 30) {
    tips.push({
      id: 'three-weeks',
      title: '3 weeks in!',
      message: `You've been going for ${totalDaysTracked} days. The popular "21 day" myth aside, you're building real neural pathways. The real magic happens around day 66.`,
      icon: '📊',
      category: 'insight',
      priority: 3,
    });
  }

  if (totalDaysTracked >= 66) {
    tips.push({
      id: 'sixty-six-days',
      title: 'Automaticity milestone!',
      message: `Research by Phillippa Lally shows 66 days is the average time for habit automaticity. You've crossed that threshold! Your habits are becoming who you are.`,
      icon: '🏆',
      category: 'celebration',
      priority: 1,
    });
  }

  // Sort by priority
  tips.sort((a, b) => a.priority - b.priority);

  return tips.slice(0, 5); // Max 5 tips at a time
}

/**
 * Habit experiment suggestions for A/B testing approaches.
 * Phase 3 feature.
 */
export interface HabitExperiment {
  id: string;
  habitId: string;
  title: string;
  description: string;
  durationDays: number;
  variant: 'A' | 'B';
}

export function suggestExperiment(habit: Habit, streak: FlexStreak): HabitExperiment | null {
  if (streak.days30 < 30 || streak.days30 > 80) return null;

  // Suggest time-of-day experiment for struggling habits
  return {
    id: `exp-${habit.id}-${Date.now()}`,
    habitId: habit.id,
    title: 'Morning vs Evening',
    description: `Try doing "${habit.name}" at a different time of day for 2 weeks and see if your consistency changes.`,
    durationDays: 14,
    variant: 'A',
  };
}
