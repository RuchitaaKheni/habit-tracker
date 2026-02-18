export type FrequencyType = 'daily' | 'weekdays' | 'custom' | 'flexible';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type CompletionStatus = 'completed' | 'missed' | 'skipped' | 'paused';
export type ContextTag =
  | 'traveling'
  | 'sick'
  | 'special_event'
  | 'forgot'
  | 'not_motivated'
  | 'busy'
  | 'custom';
export type MotivationType = 'perfectionist' | 'flexible' | 'analytical' | 'social';
export type MoodRating = 1 | 2 | 3 | 4 | 5;

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: FrequencyType;
  customDays?: number[]; // 0=Sun, 1=Mon...6=Sat
  flexibleTarget?: number; // X times per week
  implementationCue: string; // "After I ___"
  implementationAction: string; // "I will ___"
  reminderTime: string | null; // HH:mm format
  reminderEnabled: boolean;
  contextTags: string[]; // home, work, gym, etc.
  status: HabitStatus;
  pauseEndDate: string | null; // ISO date
  sortOrder: number;
  createdAt: string; // ISO datetime
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: CompletionStatus;
  contextTag: ContextTag | null;
  contextNote: string | null;
  completedAt: string | null; // ISO datetime
  createdAt: string;
}

export interface DailyMood {
  id: string;
  date: string; // YYYY-MM-DD
  rating: MoodRating;
  note: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  motivationType: MotivationType;
  onboardingCompleted: boolean;
  maxHabits: number; // starts at 3, increases over time
  createdAt: string;
  weekStartDay: number; // 0=Sun, 1=Mon
  notificationEnabled: boolean;
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null; // HH:mm
}

export interface FlexStreak {
  days7: number; // percentage 0-100
  days30: number;
  days90: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  trend: 'up' | 'stable' | 'down';
}

export interface WeeklyInsight {
  weekStart: string;
  weekEnd: string;
  overallConsistency: number;
  previousConsistency: number;
  bestDay: string;
  bestDayPercentage: number;
  worstDay: string;
  worstDayPercentage: number;
  habitStrengths: { habitId: string; name: string; percentage: number }[];
  totalCompletions: number;
  insights: string[];
}

export interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  category: string;
  defaultCue: string;
  defaultAction: string;
}
