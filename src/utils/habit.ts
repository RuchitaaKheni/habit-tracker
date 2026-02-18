import { format, parseISO } from 'date-fns';
import { Habit, HabitCompletion } from '../types/habit';
import { getDayShort } from './date';

export function getHabitFrequencyLabel(
  habit: Pick<Habit, 'frequency' | 'customDays' | 'flexibleTarget'>
): string {
  switch (habit.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays (Mon-Fri)';
    case 'custom': {
      const days = [...(habit.customDays || [])].sort((a, b) => a - b);
      if (days.length === 0) return 'Custom days';
      return days.map(getDayShort).join(', ');
    }
    case 'flexible':
      return `${habit.flexibleTarget || 3} times per week`;
    default:
      return 'Every day';
  }
}

export function getCompletionStatusLabel(completion?: HabitCompletion): string {
  if (!completion) return 'Not logged yet';

  if (completion.status === 'completed') {
    if (completion.completedAt) {
      return `Completed at ${format(parseISO(completion.completedAt), 'h:mm a')}`;
    }
    return 'Completed';
  }

  if (completion.status === 'missed') return 'Marked as missed';
  if (completion.status === 'skipped') return 'Skipped';
  if (completion.status === 'paused') return 'Paused';
  return 'Not logged yet';
}
