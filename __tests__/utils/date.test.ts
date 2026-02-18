import {
  formatDate,
  getToday,
  getDateRange,
  getDaysInRange,
  isHabitDueOnDate,
  getGreeting,
  getDayName,
  getDayShort,
  isHabitPausedOnDate,
  isPauseExpired,
} from '../../src/utils/date';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2026, 1, 12); // Feb 12, 2026
      expect(formatDate(date)).toBe('2026-02-12');
    });

    it('pads single-digit months and days', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      expect(formatDate(date)).toBe('2026-01-05');
    });
  });

  describe('getToday', () => {
    it('returns today as YYYY-MM-DD string', () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDateRange', () => {
    it('returns start and end dates for given number of days', () => {
      const range = getDateRange(7);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.end).toBe(getToday());
    });
  });

  describe('getDaysInRange', () => {
    it('returns array of date strings between start and end', () => {
      const days = getDaysInRange('2026-02-01', '2026-02-07');
      expect(days).toHaveLength(7);
      expect(days[0]).toBe('2026-02-01');
      expect(days[6]).toBe('2026-02-07');
    });
  });

  describe('isHabitDueOnDate', () => {
    it('daily habits are due every day', () => {
      expect(isHabitDueOnDate('daily', undefined, '2026-02-12')).toBe(true);
      expect(isHabitDueOnDate('daily', undefined, '2026-02-15')).toBe(true);
    });

    it('weekday habits are due Mon-Fri', () => {
      // Feb 12, 2026 is Thursday
      expect(isHabitDueOnDate('weekdays', undefined, '2026-02-12')).toBe(true);
      // Feb 14, 2026 is Saturday
      expect(isHabitDueOnDate('weekdays', undefined, '2026-02-14')).toBe(false);
      // Feb 15, 2026 is Sunday
      expect(isHabitDueOnDate('weekdays', undefined, '2026-02-15')).toBe(false);
    });

    it('custom habits check custom days array', () => {
      // Mon=1, Wed=3, Fri=5
      const customDays = [1, 3, 5];
      // Feb 12, 2026 is Thursday (4) - not due
      expect(isHabitDueOnDate('custom', customDays, '2026-02-12')).toBe(false);
      // Feb 13, 2026 is Friday (5) - due
      expect(isHabitDueOnDate('custom', customDays, '2026-02-13')).toBe(true);
    });

    it('flexible habits are always due', () => {
      expect(isHabitDueOnDate('flexible', undefined, '2026-02-12')).toBe(true);
    });
  });

  describe('getDayName', () => {
    it('returns full day name for number', () => {
      expect(getDayName(0)).toBe('Sunday');
      expect(getDayName(1)).toBe('Monday');
      expect(getDayName(6)).toBe('Saturday');
    });
  });

  describe('getDayShort', () => {
    it('returns abbreviated day name', () => {
      expect(getDayShort(0)).toBe('Sun');
      expect(getDayShort(3)).toBe('Wed');
    });
  });

  describe('getGreeting', () => {
    it('returns a string greeting', () => {
      const greeting = getGreeting();
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
    });
  });

  describe('pause window helpers', () => {
    it('treats selected date within pause window as paused', () => {
      const paused = isHabitPausedOnDate(
        { status: 'paused', pauseEndDate: '2026-02-20' },
        '2026-02-19'
      );
      expect(paused).toBe(true);
    });

    it('treats selected date after pause window as not paused', () => {
      const paused = isHabitPausedOnDate(
        { status: 'paused', pauseEndDate: '2026-02-20' },
        '2026-02-21'
      );
      expect(paused).toBe(false);
    });

    it('detects expired pause end dates', () => {
      expect(isPauseExpired('2020-01-01')).toBe(true);
    });
  });
});
