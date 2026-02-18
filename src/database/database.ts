import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CREATE_TABLES_SQL } from './schema';
import { Habit, HabitCompletion, DailyMood, UserProfile, ContextTag } from '../types/habit';

type SQLiteBindValue = string | number | null;

type DatabaseClient = {
  runAsync: (query: string, ...params: SQLiteBindValue[]) => Promise<unknown>;
  getAllAsync: <T>(query: string, ...params: SQLiteBindValue[]) => Promise<T[]>;
  getFirstAsync: <T>(query: string, ...params: SQLiteBindValue[]) => Promise<T | null>;
  execAsync: (query: string) => Promise<void>;
};

interface HabitRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: Habit['frequency'];
  custom_days: string | null;
  flexible_target: number | null;
  implementation_cue: string;
  implementation_action: string;
  reminder_time: string | null;
  reminder_enabled: number;
  context_tags: string;
  status: Habit['status'];
  pause_end_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CompletionRow {
  id: string;
  habit_id: string;
  date: string;
  status: HabitCompletion['status'];
  context_tag: string | null;
  context_note: string | null;
  completed_at: string | null;
  created_at: string;
}

interface MoodRow {
  id: string;
  date: string;
  rating: DailyMood['rating'];
  note: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  name: string;
  motivation_type: UserProfile['motivationType'];
  onboarding_completed: number;
  max_habits: number;
  created_at: string;
  week_start_day: number;
  notification_enabled: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface MetaRow {
  value: string;
}

const CURRENT_SCHEMA_VERSION = 2;
const WEB_STORAGE_KEY = 'habitflow.web-storage.v1';

// Conditionally import SQLite only on native platforms
let SQLite: { openDatabaseAsync: (name: string) => Promise<DatabaseClient> } | null = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite') as { openDatabaseAsync: (name: string) => Promise<DatabaseClient> };
}

let db: DatabaseClient | null = null;

// Web-compatible storage
let webStorageLoaded = false;
let webStorage: {
  habits: Habit[];
  completions: HabitCompletion[];
  moods: DailyMood[];
  profile: UserProfile | null;
} = {
  habits: [],
  completions: [],
  moods: [],
  profile: null,
};

const webMockDatabase: DatabaseClient = {
  runAsync: async () => undefined,
  getAllAsync: async <T>() => [] as T[],
  getFirstAsync: async <T>() => null as T | null,
  execAsync: async () => undefined,
};

async function ensureWebStorageLoaded(): Promise<void> {
  if (Platform.OS !== 'web' || webStorageLoaded) return;

  try {
    const serialized = await AsyncStorage.getItem(WEB_STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized) as Partial<typeof webStorage>;
      webStorage = {
        habits: Array.isArray(parsed.habits) ? parsed.habits : [],
        completions: Array.isArray(parsed.completions) ? parsed.completions : [],
        moods: Array.isArray(parsed.moods) ? parsed.moods : [],
        profile: parsed.profile ?? null,
      };
    }
  } catch (error) {
    console.warn('Failed to load web storage, using empty defaults:', error);
  } finally {
    webStorageLoaded = true;
  }
}

async function persistWebStorage(): Promise<void> {
  if (Platform.OS !== 'web') return;

  try {
    await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(webStorage));
  } catch (error) {
    console.warn('Failed to persist web storage:', error);
  }
}

async function getSchemaVersion(database: DatabaseClient): Promise<number> {
  const row = await database.getFirstAsync<MetaRow>(
    "SELECT value FROM app_meta WHERE key = 'schema_version'"
  );
  if (!row) return 0;

  const parsed = Number.parseInt(row.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function setSchemaVersion(database: DatabaseClient, version: number): Promise<void> {
  await database.runAsync(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('schema_version', ?)",
    version.toString()
  );
}

async function tableHasColumn(
  database: DatabaseClient,
  tableName: 'habits' | 'habit_completions' | 'daily_moods' | 'user_profile',
  columnName: string
): Promise<boolean> {
  const rows = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  return rows.some((row) => row.name === columnName);
}

async function ensureColumn(
  database: DatabaseClient,
  tableName: 'habits' | 'habit_completions' | 'daily_moods' | 'user_profile',
  columnName: string,
  definition: string
): Promise<void> {
  if (await tableHasColumn(database, tableName, columnName)) return;
  await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

async function runMigrations(database: DatabaseClient): Promise<void> {
  let schemaVersion = await getSchemaVersion(database);

  // v1 baseline: existing tables created by CREATE_TABLES_SQL.
  if (schemaVersion < 1) {
    schemaVersion = 1;
    await setSchemaVersion(database, schemaVersion);
  }

  // v2: forward-compatible profile/habit/completion columns for older installs.
  if (schemaVersion < 2) {
    await ensureColumn(database, 'user_profile', 'week_start_day', 'INTEGER NOT NULL DEFAULT 1');
    await ensureColumn(database, 'user_profile', 'notification_enabled', 'INTEGER NOT NULL DEFAULT 1');
    await ensureColumn(database, 'user_profile', 'quiet_hours_start', 'TEXT');
    await ensureColumn(database, 'user_profile', 'quiet_hours_end', 'TEXT');

    await ensureColumn(database, 'habits', 'status', "TEXT NOT NULL DEFAULT 'active'");
    await ensureColumn(database, 'habits', 'pause_end_date', 'TEXT');

    await ensureColumn(database, 'habit_completions', 'context_tag', 'TEXT');
    await ensureColumn(database, 'habit_completions', 'context_note', 'TEXT');

    schemaVersion = 2;
    await setSchemaVersion(database, schemaVersion);
  }

  if (schemaVersion < CURRENT_SCHEMA_VERSION) {
    await setSchemaVersion(database, CURRENT_SCHEMA_VERSION);
  }
}

export async function getDatabase(): Promise<DatabaseClient> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webMockDatabase;
  }

  if (!SQLite) {
    throw new Error('SQLite is not available on this platform');
  }

  if (db) return db;

  db = await SQLite.openDatabaseAsync('habitflow.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_TABLES_SQL);
  await runMigrations(db);

  return db;
}

function safeParseJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function mapRowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency,
    customDays: row.custom_days ? safeParseJsonArray<number>(row.custom_days, []) : undefined,
    flexibleTarget: row.flexible_target ?? undefined,
    implementationCue: row.implementation_cue,
    implementationAction: row.implementation_action,
    reminderTime: row.reminder_time,
    reminderEnabled: Boolean(row.reminder_enabled),
    contextTags: safeParseJsonArray<string>(row.context_tags, []),
    status: row.status,
    pauseEndDate: row.pause_end_date,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCompletion(row: CompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    status: row.status,
    contextTag: row.context_tag as ContextTag | null,
    contextNote: row.context_note,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

// ─── Habits ───────────────────────────────────────────────

export async function insertHabit(habit: Habit): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    webStorage.habits.push(habit);
    await persistWebStorage();
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO habits (id, name, icon, color, frequency, custom_days, flexible_target,
      implementation_cue, implementation_action, reminder_time, reminder_enabled,
      context_tags, status, pause_end_date, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    habit.id,
    habit.name,
    habit.icon,
    habit.color,
    habit.frequency,
    habit.customDays ? JSON.stringify(habit.customDays) : null,
    habit.flexibleTarget ?? null,
    habit.implementationCue,
    habit.implementationAction,
    habit.reminderTime,
    habit.reminderEnabled ? 1 : 0,
    JSON.stringify(habit.contextTags),
    habit.status,
    habit.pauseEndDate,
    habit.sortOrder,
    habit.createdAt,
    habit.updatedAt
  );
}

export async function updateHabit(habit: Habit): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    const index = webStorage.habits.findIndex((item) => item.id === habit.id);
    if (index >= 0) {
      webStorage.habits[index] = habit;
      await persistWebStorage();
    }
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `UPDATE habits SET name=?, icon=?, color=?, frequency=?, custom_days=?, flexible_target=?,
      implementation_cue=?, implementation_action=?, reminder_time=?, reminder_enabled=?,
      context_tags=?, status=?, pause_end_date=?, sort_order=?, updated_at=?
     WHERE id=?`,
    habit.name,
    habit.icon,
    habit.color,
    habit.frequency,
    habit.customDays ? JSON.stringify(habit.customDays) : null,
    habit.flexibleTarget ?? null,
    habit.implementationCue,
    habit.implementationAction,
    habit.reminderTime,
    habit.reminderEnabled ? 1 : 0,
    JSON.stringify(habit.contextTags),
    habit.status,
    habit.pauseEndDate,
    habit.sortOrder,
    habit.updatedAt,
    habit.id
  );
}

export async function deleteHabit(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    webStorage.habits = webStorage.habits.filter((habit) => habit.id !== id);
    webStorage.completions = webStorage.completions.filter((completion) => completion.habitId !== id);
    await persistWebStorage();
    return;
  }

  const database = await getDatabase();
  await database.runAsync('DELETE FROM habits WHERE id = ?', id);
}

export async function getAllHabits(): Promise<Habit[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return [...webStorage.habits].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY sort_order ASC');
  return rows.map(mapRowToHabit);
}

export async function getActiveHabits(): Promise<Habit[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.habits
      .filter((habit) => habit.status === 'active' || habit.status === 'paused')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<HabitRow>(
    "SELECT * FROM habits WHERE status IN ('active', 'paused') ORDER BY sort_order ASC"
  );
  return rows.map(mapRowToHabit);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.habits.find((habit) => habit.id === id) || null;
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
  return row ? mapRowToHabit(row) : null;
}

// ─── Completions ──────────────────────────────────────────

export async function upsertCompletion(completion: HabitCompletion): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    const index = webStorage.completions.findIndex(
      (item) => item.habitId === completion.habitId && item.date === completion.date
    );

    if (index >= 0) {
      webStorage.completions[index] = {
        ...completion,
        id: webStorage.completions[index].id,
        createdAt: webStorage.completions[index].createdAt,
      };
    } else {
      webStorage.completions.push(completion);
    }

    await persistWebStorage();
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO habit_completions (id, habit_id, date, status, context_tag, context_note, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    completion.id,
    completion.habitId,
    completion.date,
    completion.status,
    completion.contextTag,
    completion.contextNote,
    completion.completedAt,
    completion.createdAt
  );
}

export async function getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.completions.filter((completion) => completion.date === date);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<CompletionRow>(
    'SELECT * FROM habit_completions WHERE date = ?',
    date
  );
  return rows.map(mapRowToCompletion);
}

export async function getCompletionsForHabit(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.completions
      .filter(
        (completion) =>
          completion.habitId === habitId && completion.date >= startDate && completion.date <= endDate
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<CompletionRow>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date >= ? AND date <= ? ORDER BY date DESC',
    habitId,
    startDate,
    endDate
  );
  return rows.map(mapRowToCompletion);
}

export async function getCompletionForHabitOnDate(
  habitId: string,
  date: string
): Promise<HabitCompletion | null> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.completions.find((completion) => completion.habitId === habitId && completion.date === date) || null;
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<CompletionRow>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );
  return row ? mapRowToCompletion(row) : null;
}

export async function deleteCompletion(habitId: string, date: string): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    webStorage.completions = webStorage.completions.filter(
      (completion) => !(completion.habitId === habitId && completion.date === date)
    );
    await persistWebStorage();
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );
}

export async function getAllCompletionsInRange(
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.completions
      .filter((completion) => completion.date >= startDate && completion.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<CompletionRow>(
    'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY date DESC',
    startDate,
    endDate
  );
  return rows.map(mapRowToCompletion);
}

// ─── Mood ─────────────────────────────────────────────────

export async function upsertMood(mood: DailyMood): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    const index = webStorage.moods.findIndex((item) => item.date === mood.date);
    if (index >= 0) {
      webStorage.moods[index] = mood;
    } else {
      webStorage.moods.push(mood);
    }
    await persistWebStorage();
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO daily_moods (id, date, rating, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    mood.id,
    mood.date,
    mood.rating,
    mood.note,
    mood.createdAt
  );
}

export async function getMoodsInRange(startDate: string, endDate: string): Promise<DailyMood[]> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.moods
      .filter((mood) => mood.date >= startDate && mood.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<MoodRow>(
    'SELECT * FROM daily_moods WHERE date >= ? AND date <= ? ORDER BY date DESC',
    startDate,
    endDate
  );

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    rating: row.rating,
    note: row.note,
    createdAt: row.created_at,
  }));
}

export async function getMoodForDate(date: string): Promise<DailyMood | null> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return webStorage.moods.find((mood) => mood.date === date) || null;
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<MoodRow>('SELECT * FROM daily_moods WHERE date = ?', date);

  return row
    ? {
        id: row.id,
        date: row.date,
        rating: row.rating,
        note: row.note,
        createdAt: row.created_at,
      }
    : null;
}

// ─── User Profile ─────────────────────────────────────────

export async function getOrCreateProfile(): Promise<UserProfile> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();

    if (!webStorage.profile) {
      webStorage.profile = {
        id: generateId(),
        name: '',
        motivationType: 'flexible',
        onboardingCompleted: false,
        maxHabits: 3,
        createdAt: new Date().toISOString(),
        weekStartDay: 1,
        notificationEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      };
      await persistWebStorage();
    }

    return webStorage.profile;
  }

  const database = await getDatabase();
  let row = await database.getFirstAsync<ProfileRow>('SELECT * FROM user_profile LIMIT 1');

  if (!row) {
    const id = generateId();
    await database.runAsync(
      `INSERT INTO user_profile (id, name, motivation_type, onboarding_completed, max_habits)
       VALUES (?, '', 'flexible', 0, 3)`,
      id
    );
    row = await database.getFirstAsync<ProfileRow>('SELECT * FROM user_profile WHERE id = ?', id);
  }

  if (!row) {
    throw new Error('Failed to initialize user profile');
  }

  return {
    id: row.id,
    name: row.name,
    motivationType: row.motivation_type,
    onboardingCompleted: Boolean(row.onboarding_completed),
    maxHabits: row.max_habits,
    createdAt: row.created_at,
    weekStartDay: row.week_start_day,
    notificationEnabled: Boolean(row.notification_enabled),
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

export async function updateProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    if (webStorage.profile) {
      webStorage.profile = { ...webStorage.profile, ...profile };
      await persistWebStorage();
    }
    return;
  }

  const database = await getDatabase();
  const fields: string[] = [];
  const values: SQLiteBindValue[] = [];

  if (profile.name !== undefined) {
    fields.push('name = ?');
    values.push(profile.name);
  }
  if (profile.motivationType !== undefined) {
    fields.push('motivation_type = ?');
    values.push(profile.motivationType);
  }
  if (profile.onboardingCompleted !== undefined) {
    fields.push('onboarding_completed = ?');
    values.push(profile.onboardingCompleted ? 1 : 0);
  }
  if (profile.maxHabits !== undefined) {
    fields.push('max_habits = ?');
    values.push(profile.maxHabits);
  }
  if (profile.weekStartDay !== undefined) {
    fields.push('week_start_day = ?');
    values.push(profile.weekStartDay);
  }
  if (profile.notificationEnabled !== undefined) {
    fields.push('notification_enabled = ?');
    values.push(profile.notificationEnabled ? 1 : 0);
  }
  if (profile.quietHoursStart !== undefined) {
    fields.push('quiet_hours_start = ?');
    values.push(profile.quietHoursStart);
  }
  if (profile.quietHoursEnd !== undefined) {
    fields.push('quiet_hours_end = ?');
    values.push(profile.quietHoursEnd);
  }

  if (fields.length === 0) return;

  values.push(profile.id);
  await database.runAsync(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

// ─── Export ───────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    return JSON.stringify(
      {
        habits: webStorage.habits,
        completions: webStorage.completions,
        moods: webStorage.moods,
        profile: webStorage.profile,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  const database = await getDatabase();
  const habits = await database.getAllAsync<HabitRow>('SELECT * FROM habits');
  const completions = await database.getAllAsync<CompletionRow>('SELECT * FROM habit_completions');
  const moods = await database.getAllAsync<MoodRow>('SELECT * FROM daily_moods');
  const profile = await database.getFirstAsync<ProfileRow>('SELECT * FROM user_profile LIMIT 1');

  return JSON.stringify(
    {
      habits,
      completions,
      moods,
      profile,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

// ─── Utilities ────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function clearAllData(): Promise<void> {
  if (Platform.OS === 'web') {
    await ensureWebStorageLoaded();
    webStorage = {
      habits: [],
      completions: [],
      moods: [],
      profile: null,
    };
    await AsyncStorage.removeItem(WEB_STORAGE_KEY);
    return;
  }

  const database = await getDatabase();
  await database.execAsync(
    'DELETE FROM habit_completions; DELETE FROM habits; DELETE FROM daily_moods; DELETE FROM user_profile;'
  );
}
