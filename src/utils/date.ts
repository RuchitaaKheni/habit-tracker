import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
  parseISO,
  differenceInDays,
  getDay,
  eachDayOfInterval,
  endOfDay,
} from 'date-fns';
import type { Habit } from '../types/habit';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplay(date: Date): string {
  if (isToday(date)) return 'Today';
  const diff = differenceInDays(new Date(), date);
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = subDays(end, days - 1);
  return { start: formatDate(start), end: formatDate(end) };
}

export function getWeekRange(weekStartDay: number = 1): { start: string; end: string } {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  const end = endOfWeek(now, { weekStartsOn: weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  return { start: formatDate(start), end: formatDate(end) };
}

export function getDaysInRange(startDate: string, endDate: string): string[] {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map(formatDate);
}

export function isHabitDueOnDate(
  frequency: string,
  customDays: number[] | undefined,
  date: string
): boolean {
  const dayOfWeek = getDay(parseISO(date));

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'custom':
      return customDays?.includes(dayOfWeek) ?? false;
    case 'flexible':
      return true; // flexible habits are always "available"
    default:
      return true;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

export function getDayShort(dayNumber: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNumber];
}

export function isPastDate(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), new Date()) && !isToday(parseISO(dateStr));
}

export function addDaysToDate(dateStr: string, days: number): string {
  return formatDate(addDays(parseISO(dateStr), days));
}

export function daysBetween(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start));
}

function parseDateInput(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseISO(`${value}T00:00:00`);
  }
  return parseISO(value);
}

export function isHabitPausedOnDate(
  habit: Pick<Habit, 'status' | 'pauseEndDate'>,
  date: string
): boolean {
  if (habit.status !== 'paused' || !habit.pauseEndDate) return false;

  const targetDate = endOfDay(parseDateInput(date));
  const pauseEnd = endOfDay(parseDateInput(habit.pauseEndDate));
  return targetDate <= pauseEnd;
}

export function isPauseExpired(pauseEndDate: string | null): boolean {
  if (!pauseEndDate) return true;
  return endOfDay(parseDateInput(pauseEndDate)) < new Date();
}
