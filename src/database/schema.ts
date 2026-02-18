export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🎯',
    color TEXT NOT NULL DEFAULT '#0EA5E9',
    frequency TEXT NOT NULL DEFAULT 'daily',
    custom_days TEXT,
    flexible_target INTEGER,
    implementation_cue TEXT NOT NULL DEFAULT '',
    implementation_action TEXT NOT NULL DEFAULT '',
    reminder_time TEXT,
    reminder_enabled INTEGER NOT NULL DEFAULT 0,
    context_tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    pause_end_date TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_completions (
    id TEXT PRIMARY KEY NOT NULL,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    context_tag TEXT,
    context_note TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_habit_date
    ON habit_completions(habit_id, date);

  CREATE INDEX IF NOT EXISTS idx_completions_date
    ON habit_completions(date);

  CREATE TABLE IF NOT EXISTS daily_moods (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    motivation_type TEXT NOT NULL DEFAULT 'flexible',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    max_habits INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    week_start_day INTEGER NOT NULL DEFAULT 1,
    notification_enabled INTEGER NOT NULL DEFAULT 1,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT
  );
`;
