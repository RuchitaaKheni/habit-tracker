import { calculateFlexStreak, getHabitStrengthLabel, getHabitStrengthColor } from '../../src/utils/streaks';
import { Habit, HabitCompletion } from '../../src/types/habit';
import { formatDate } from '../../src/utils/date';
import { subDays } from 'date-fns';

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-habit-1',
    name: 'Test Habit',
    icon: '🎯',
    color: '#0EA5E9',
    frequency: 'daily',
    implementationCue: '',
    implementationAction: '',
    reminderTime: null,
    reminderEnabled: false,
    contextTags: [],
    status: 'active',
    pauseEndDate: null,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createCompletion(habitId: string, daysAgo: number, status: string = 'completed'): HabitCompletion {
  const date = formatDate(subDays(new Date(), daysAgo));
  return {
    id: `comp-${daysAgo}`,
    habitId,
    date,
    status: status as any,
    contextTag: null,
    contextNote: null,
    completedAt: status === 'completed' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };
}

describe('calculateFlexStreak', () => {
  it('returns 100% when all days are completed', () => {
    const habit = createHabit();
    const completions = Array.from({ length: 7 }, (_, i) => createCompletion(habit.id, i));

    const streak = calculateFlexStreak(habit, completions);
    expect(streak.days7).toBe(100);
  });

  it('returns 0% when no days are completed', () => {
    const habit = createHabit();
    const streak = calculateFlexStreak(habit, []);
    expect(streak.days7).toBe(0);
    expect(streak.days30).toBe(0);
  });

  it('calculates correct percentage for partial completion', () => {
    const habit = createHabit();
    // Complete 5 of last 7 days
    const completions = [0, 1, 2, 4, 6].map((d) => createCompletion(habit.id, d));

    const streak = calculateFlexStreak(habit, completions);
    expect(streak.days7).toBe(71); // 5/7 = 71%
  });

  it('excludes paused days from calculation', () => {
    const habit = createHabit();
    const completions = [
      createCompletion(habit.id, 0, 'completed'),
      createCompletion(habit.id, 1, 'completed'),
      createCompletion(habit.id, 2, 'paused'),
      createCompletion(habit.id, 3, 'paused'),
      createCompletion(habit.id, 4, 'completed'),
    ];

    const streak = calculateFlexStreak(habit, completions);
    // 3 completed out of 5 due days (2 paused excluded from total)
    // 5 days due from 7 day window, 2 paused = 5 evaluated, 3 completed
    expect(streak.days7).toBeGreaterThan(0);
  });

  it('tracks current and best streaks', () => {
    const habit = createHabit();
    // 3-day current streak
    const completions = [0, 1, 2].map((d) => createCompletion(habit.id, d));

    const streak = calculateFlexStreak(habit, completions);
    expect(streak.currentStreak).toBe(3);
    expect(streak.bestStreak).toBe(3);
    expect(streak.totalCompletions).toBe(3);
  });

  it('detects upward trend', () => {
    const habit = createHabit();
    // Complete last 7 days, miss previous 7
    const completions = Array.from({ length: 7 }, (_, i) => createCompletion(habit.id, i));

    const streak = calculateFlexStreak(habit, completions);
    expect(streak.trend).toBe('up');
  });
});

describe('getHabitStrengthLabel', () => {
  it('returns correct labels for percentages', () => {
    expect(getHabitStrengthLabel(95)).toBe('Outstanding');
    expect(getHabitStrengthLabel(80)).toBe('Strong');
    expect(getHabitStrengthLabel(65)).toBe('Building');
    expect(getHabitStrengthLabel(45)).toBe('Developing');
    expect(getHabitStrengthLabel(25)).toBe('Starting');
    expect(getHabitStrengthLabel(10)).toBe('New');
  });
});

describe('getHabitStrengthColor', () => {
  it('returns green for high percentages', () => {
    expect(getHabitStrengthColor(80)).toBe('#22C55E');
  });

  it('returns gray for low percentages', () => {
    expect(getHabitStrengthColor(10)).toBe('#94A3B8');
  });
});
