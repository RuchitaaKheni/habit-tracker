import { create } from 'zustand';
import {
  Habit,
  HabitCompletion,
  CompletionStatus,
  ContextTag,
  UserProfile,
  FlexStreak,
} from '../types/habit';
import * as db from '../database/database';
import {
  getToday,
  getDateRange,
  getDaysInRange,
  isHabitDueOnDate,
  isHabitPausedOnDate,
  isPauseExpired,
} from '../utils/date';
import { calculateFlexStreak } from '../utils/streaks';
import { cancelHabitReminder, scheduleHabitReminder } from '../services/notifications';

interface HabitState {
  habits: Habit[];
  todayCompletions: Map<string, HabitCompletion>;
  profile: UserProfile | null;
  isLoading: boolean;
  selectedDate: string;

  // Actions
  initialize: () => Promise<void>;
  loadHabits: () => Promise<void>;
  loadTodayCompletions: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string) => Promise<void>;
  setCompletionStatus: (
    habitId: string,
    status: CompletionStatus,
    options?: { tag?: ContextTag; note?: string }
  ) => Promise<void>;
  clearCompletionForSelectedDate: (habitId: string) => Promise<void>;
  skipHabit: (habitId: string, tag: ContextTag, note?: string) => Promise<void>;
  pauseHabit: (habitId: string, endDate: string) => Promise<void>;
  resumeHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  getFlexStreak: (habitId: string) => Promise<FlexStreak>;
  getCompletionsForHabit: (habitId: string, days: number) => Promise<HabitCompletion[]>;
}

function areCompletionsEqual(a: HabitCompletion, b: HabitCompletion): boolean {
  return (
    a.id === b.id &&
    a.habitId === b.habitId &&
    a.date === b.date &&
    a.status === b.status &&
    a.contextTag === b.contextTag &&
    a.contextNote === b.contextNote &&
    a.completedAt === b.completedAt &&
    a.createdAt === b.createdAt
  );
}

function areCompletionMapsEqual(
  current: Map<string, HabitCompletion>,
  next: Map<string, HabitCompletion>
): boolean {
  if (current.size !== next.size) return false;

  for (const [habitId, completion] of next) {
    const existing = current.get(habitId);
    if (!existing || !areCompletionsEqual(existing, completion)) {
      return false;
    }
  }

  return true;
}

export const useHabitStore = create<HabitState>((set, get) => {
  const refreshHabits = async (): Promise<Habit[]> => {
    const habits = await db.getAllHabits();
    set({ habits });
    return habits;
  };

  const setCompletionForSelectedDate = (completion: HabitCompletion): void => {
    const { selectedDate, todayCompletions } = get();
    if (completion.date !== selectedDate) return;

    const existing = todayCompletions.get(completion.habitId);
    if (existing && areCompletionsEqual(existing, completion)) return;

    const nextCompletions = new Map(todayCompletions);
    nextCompletions.set(completion.habitId, completion);
    set({ todayCompletions: nextCompletions });
  };

  const removeCompletionForSelectedDate = (habitId: string, date: string): void => {
    const { selectedDate, todayCompletions } = get();
    if (selectedDate !== date || !todayCompletions.has(habitId)) return;

    const nextCompletions = new Map(todayCompletions);
    nextCompletions.delete(habitId);
    set({ todayCompletions: nextCompletions });
  };

  const shouldScheduleNotifications = (): boolean => {
    return get().profile?.notificationEnabled ?? true;
  };

  const syncHabitReminder = async (habit: Habit): Promise<void> => {
    if (!shouldScheduleNotifications()) {
      await cancelHabitReminder(habit.id);
      return;
    }

    if (habit.reminderEnabled && habit.reminderTime && habit.status === 'active') {
      await scheduleHabitReminder(habit);
      return;
    }

    await cancelHabitReminder(habit.id);
  };

  const canTrackHabitOnDate = (habit: Habit, date: string): boolean => {
    if (habit.status === 'archived') return false;
    if (!isHabitDueOnDate(habit.frequency, habit.customDays, date)) return false;
    if (isHabitPausedOnDate(habit, date)) return false;
    return true;
  };

  const maybeUnlockHabitSlot = async (): Promise<void> => {
    const { profile, habits } = get();
    if (!profile || profile.maxHabits !== 3) return;

    const activeHabits = habits.filter((habit) => habit.status === 'active');
    if (activeHabits.length === 0) return;

    const { start, end } = getDateRange(14);
    const days = getDaysInRange(start, end);
    const completions = await db.getAllCompletionsInRange(start, end);

    const completionMap = new Map<string, HabitCompletion>();
    completions.forEach((completion) => {
      completionMap.set(`${completion.habitId}::${completion.date}`, completion);
    });

    let dueCount = 0;
    let completedCount = 0;

    for (const day of days) {
      for (const habit of activeHabits) {
        if (!isHabitDueOnDate(habit.frequency, habit.customDays, day)) continue;
        if (isHabitPausedOnDate(habit, day)) continue;

        dueCount++;
        const completion = completionMap.get(`${habit.id}::${day}`);
        if (completion?.status === 'completed') {
          completedCount++;
        }
      }
    }

    if (dueCount === 0) return;

    const consistency = (completedCount / dueCount) * 100;
    if (consistency < 60) return;

    const updatedProfile: UserProfile = { ...profile, maxHabits: 4 };
    await db.updateProfile(updatedProfile);
    set({ profile: updatedProfile });
  };

  return {
    habits: [],
    todayCompletions: new Map(),
    profile: null,
    isLoading: true,
    selectedDate: getToday(),

    initialize: async () => {
      set({ isLoading: true });
      try {
        const profile = await db.getOrCreateProfile();
        set({ profile });
        const habits = await db.getAllHabits();

        // Resume habits with expired pause windows.
        const now = new Date().toISOString();
        const habitsToResume = habits.filter(
          (habit) => habit.status === 'paused' && isPauseExpired(habit.pauseEndDate)
        );

        for (const habit of habitsToResume) {
          const resumedHabit: Habit = {
            ...habit,
            status: 'active',
            pauseEndDate: null,
            updatedAt: now,
          };
          await db.updateHabit(resumedHabit);
          await syncHabitReminder(resumedHabit);
        }

        const finalHabits = habitsToResume.length > 0 ? await db.getAllHabits() : habits;
        const todayCompletions = await db.getCompletionsForDate(getToday());
        const completionMap = new Map<string, HabitCompletion>();
        todayCompletions.forEach((completion) => completionMap.set(completion.habitId, completion));

        set({
          habits: finalHabits,
          todayCompletions: completionMap,
          profile,
          selectedDate: getToday(),
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to initialize:', error);
        set({ isLoading: false });
      }
    },

    loadHabits: async () => {
      await refreshHabits();
    },

    loadTodayCompletions: async () => {
      const date = get().selectedDate;
      const completions = await db.getCompletionsForDate(date);
      if (get().selectedDate !== date) {
        return;
      }

      const completionMap = new Map<string, HabitCompletion>();
      completions.forEach((completion) => completionMap.set(completion.habitId, completion));
      const todayCompletions = get().todayCompletions;
      if (!areCompletionMapsEqual(todayCompletions, completionMap)) {
        set({ todayCompletions: completionMap });
      }
    },

    addHabit: async (habit) => {
      await db.insertHabit(habit);
      await syncHabitReminder(habit);
      await refreshHabits();
    },

    updateHabit: async (habit) => {
      await db.updateHabit(habit);
      await syncHabitReminder(habit);
      await refreshHabits();
    },

    deleteHabit: async (id) => {
      const selectedDate = get().selectedDate;
      await cancelHabitReminder(id);
      await db.deleteHabit(id);
      await refreshHabits();
      removeCompletionForSelectedDate(id, selectedDate);
    },

    toggleCompletion: async (habitId) => {
      const { selectedDate, todayCompletions } = get();
      const existing = todayCompletions.get(habitId);

      if (existing?.status === 'completed') {
        await db.deleteCompletion(habitId, selectedDate);
        removeCompletionForSelectedDate(habitId, selectedDate);
        return;
      }

      await get().setCompletionStatus(habitId, 'completed');
    },

    setCompletionStatus: async (habitId, status, options) => {
      const { selectedDate, todayCompletions, habits } = get();
      const habit = habits.find((item) => item.id === habitId);
      if (!habit || !canTrackHabitOnDate(habit, selectedDate)) return;

      const existing = todayCompletions.get(habitId);
      const now = new Date().toISOString();
      const nextNote =
        options?.note !== undefined
          ? options.note.trim()
            ? options.note.trim()
            : null
          : existing?.contextNote ?? null;

      const completion: HabitCompletion = {
        id: existing?.id || generateId(),
        habitId,
        date: selectedDate,
        status,
        contextTag: status === 'skipped' ? options?.tag ?? existing?.contextTag ?? null : null,
        contextNote: nextNote,
        completedAt: status === 'completed' ? now : null,
        createdAt: existing?.createdAt || now,
      };

      await db.upsertCompletion(completion);
      setCompletionForSelectedDate(completion);

      if (status === 'completed') {
        await maybeUnlockHabitSlot();
      }
    },

    clearCompletionForSelectedDate: async (habitId) => {
      const { selectedDate } = get();
      await db.deleteCompletion(habitId, selectedDate);
      removeCompletionForSelectedDate(habitId, selectedDate);
    },

    skipHabit: async (habitId, tag, note) => {
      await get().setCompletionStatus(habitId, 'skipped', { tag, note });
    },

    pauseHabit: async (habitId, endDate) => {
      const habit = get().habits.find((item) => item.id === habitId);
      if (!habit) return;

      const updated: Habit = {
        ...habit,
        status: 'paused',
        pauseEndDate: endDate,
        updatedAt: new Date().toISOString(),
      };

      await db.updateHabit(updated);
      await cancelHabitReminder(habitId);

      // Keep an explicit marker for the currently selected day.
      const { selectedDate } = get();
      const pauseCompletion: HabitCompletion = {
        id: generateId(),
        habitId,
        date: selectedDate,
        status: 'paused',
        contextTag: null,
        contextNote: `Paused until ${endDate}`,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      await db.upsertCompletion(pauseCompletion);

      await refreshHabits();
      setCompletionForSelectedDate(pauseCompletion);
    },

    resumeHabit: async (habitId) => {
      const habit = get().habits.find((item) => item.id === habitId);
      if (!habit) return;

      const updated: Habit = {
        ...habit,
        status: 'active',
        pauseEndDate: null,
        updatedAt: new Date().toISOString(),
      };

      await db.updateHabit(updated);
      await syncHabitReminder(updated);

      await refreshHabits();
    },

    archiveHabit: async (habitId) => {
      const selectedDate = get().selectedDate;
      const habit = get().habits.find((item) => item.id === habitId);
      if (!habit) return;

      const updated: Habit = {
        ...habit,
        status: 'archived',
        pauseEndDate: null,
        updatedAt: new Date().toISOString(),
      };

      await db.updateHabit(updated);
      await cancelHabitReminder(habitId);
      await refreshHabits();
      removeCompletionForSelectedDate(habitId, selectedDate);
    },

    unarchiveHabit: async (habitId) => {
      const habit = get().habits.find((item) => item.id === habitId);
      if (!habit) return;

      const updated: Habit = {
        ...habit,
        status: 'active',
        pauseEndDate: null,
        updatedAt: new Date().toISOString(),
      };

      await db.updateHabit(updated);
      await syncHabitReminder(updated);

      await refreshHabits();
    },

    setSelectedDate: (date) => {
      if (date === get().selectedDate) return;
      set({ selectedDate: date });
      void get().loadTodayCompletions();
    },

    updateProfile: async (updates) => {
      let profile = get().profile;
      if (!profile) {
        profile = await db.getOrCreateProfile();
      }

      const previousNotificationSetting = profile.notificationEnabled;
      const updated: UserProfile = { ...profile, ...updates };
      await db.updateProfile(updated);
      set({ profile: updated });

      if (
        updates.notificationEnabled !== undefined &&
        updates.notificationEnabled !== previousNotificationSetting
      ) {
        for (const habit of get().habits) {
          await syncHabitReminder(habit);
        }
      }
    },

    getFlexStreak: async (habitId) => {
      const habit = get().habits.find((item) => item.id === habitId);
      if (!habit) {
        return {
          days7: 0,
          days30: 0,
          days90: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalCompletions: 0,
          trend: 'stable' as const,
        };
      }

      const { start } = getDateRange(90);
      const completions = await db.getCompletionsForHabit(habitId, start, getToday());
      return calculateFlexStreak(habit, completions);
    },

    getCompletionsForHabit: async (habitId, days) => {
      const { start, end } = getDateRange(days);
      return db.getCompletionsForHabit(habitId, start, end);
    },
  };
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
