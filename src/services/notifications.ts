import { Platform } from 'react-native';
import { Habit } from '../types/habit';

// Conditionally import notifications only on native platforms.
let Notifications: any = null;
let Device: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
}

const HABIT_ACTION_CATEGORY = 'habit-action';
let notificationResponseSubscription: { remove: () => void } | null = null;

function toExpoWeekday(day: number): number {
  // App model: 0=Sun...6=Sat, Expo weekday: 1=Sun...7=Sat
  return day === 0 ? 1 : day + 1;
}

function sanitizeCustomDays(days: number[] | undefined): number[] {
  if (!days) return [];

  const validDays = days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return Array.from(new Set(validDays)).sort((a, b) => a - b);
}

function buildHabitReminderTriggers(hours: number, minutes: number, habit: Habit): any[] {
  if (!Notifications) return [];

  if (habit.frequency === 'daily' || habit.frequency === 'flexible') {
    return [
      {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    ];
  }

  if (habit.frequency === 'weekdays') {
    return [1, 2, 3, 4, 5].map((day) => ({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(day),
      hour: hours,
      minute: minutes,
    }));
  }

  if (habit.frequency === 'custom') {
    const customDays = sanitizeCustomDays(habit.customDays);
    if (customDays.length === 0) return [];

    return customDays.map((day) => ({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(day),
      hour: hours,
      minute: minutes,
    }));
  }

  return [];
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Notifications || !Device) return false;

  if (!Device.isDevice) {
    console.warn('Notifications require a physical device');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habit-reminders', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0EA5E9',
      });
    }

    return true;
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    await Notifications.setNotificationCategoryAsync(HABIT_ACTION_CATEGORY, [
      {
        identifier: 'done',
        buttonTitle: '✅ Done',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'skip',
        buttonTitle: '⏭️ Skip',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (error) {
    console.warn('Failed to setup notification categories:', error);
  }
}

export function registerHabitNotificationActions(handlers: {
  onDone: (habitId: string) => Promise<void> | void;
  onSkip: (habitId: string) => Promise<void> | void;
}): () => void {
  if (Platform.OS === 'web' || !Notifications) {
    return () => undefined;
  }

  notificationResponseSubscription?.remove();
  notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      const habitId = response?.notification?.request?.content?.data?.habitId as string | undefined;
      if (!habitId) return;

      const actionId = response.actionIdentifier;
      if (actionId === 'done') {
        void handlers.onDone(habitId);
        return;
      }

      if (actionId === 'skip') {
        void handlers.onSkip(habitId);
      }
    }
  );

  return () => {
    notificationResponseSubscription?.remove();
    notificationResponseSubscription = null;
  };
}

export async function scheduleHabitReminder(habit: Habit): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) return null;
  if (!habit.reminderEnabled || !habit.reminderTime || habit.status !== 'active') return null;

  const [hours, minutes] = habit.reminderTime.split(':').map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  try {
    await cancelHabitReminder(habit.id);

    const triggers = buildHabitReminderTriggers(hours, minutes, habit);
    if (triggers.length === 0) return null;

    let firstIdentifier: string | null = null;

    for (const trigger of triggers) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for: ${habit.icon} ${habit.name}`,
          body: habit.implementationCue
            ? `${habit.implementationCue}, ${habit.implementationAction}`
            : "Don't forget your habit!",
          data: { habitId: habit.id },
          categoryIdentifier: HABIT_ACTION_CATEGORY,
        },
        trigger,
      });

      if (!firstIdentifier) {
        firstIdentifier = identifier;
      }
    }

    return firstIdentifier;
  } catch (error) {
    console.warn(`Failed to schedule reminder for habit ${habit.id}:`, error);
    return null;
  }
}

export async function scheduleAllHabitReminders(habits: Habit[]): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    const remindersToKeep = new Set(
      habits
        .filter((habit) => habit.reminderEnabled && habit.reminderTime && habit.status === 'active')
        .map((habit) => habit.id)
    );

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const habitId = notification.content.data?.habitId;
      if (typeof habitId === 'string' && !remindersToKeep.has(habitId)) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    for (const habit of habits) {
      if (habit.reminderEnabled && habit.reminderTime && habit.status === 'active') {
        await scheduleHabitReminder(habit);
      }
    }
  } catch (error) {
    console.warn('Failed to sync habit reminders:', error);
  }
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.warn(`Failed to cancel reminder for habit ${habitId}:`, error);
  }
}

export async function scheduleEndOfDaySummary(
  completedCount: number,
  totalCount: number
): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Summary',
        body: `You completed ${completedCount}/${totalCount} habits today. ${
          completedCount === totalCount ? 'Perfect day! 🎉' : 'Keep going!'
        }`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  } catch (error) {
    console.warn('Failed to schedule end-of-day summary:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
  }
}
