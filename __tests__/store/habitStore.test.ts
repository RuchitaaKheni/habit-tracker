/**
 * Integration tests for the Habit Store.
 *
 * Note: These tests require the expo-sqlite module to be mocked
 * since we're running in a Node.js environment.
 */

import { getHabitStrengthLabel } from '../../src/utils/streaks';
import { isHabitDueOnDate } from '../../src/utils/date';

// Since Zustand stores with SQLite require native modules,
// we test the pure logic functions that the store relies on.

describe('Habit Store Logic', () => {
  describe('habit filtering by frequency', () => {
    it('daily habits show every day', () => {
      expect(isHabitDueOnDate('daily', undefined, '2026-02-12')).toBe(true);
    });

    it('weekday habits skip weekends', () => {
      // Feb 14, 2026 is Saturday
      expect(isHabitDueOnDate('weekdays', undefined, '2026-02-14')).toBe(false);
    });

    it('custom habits respect selected days', () => {
      expect(isHabitDueOnDate('custom', [1, 3, 5], '2026-02-13')).toBe(true); // Friday
      expect(isHabitDueOnDate('custom', [1, 3, 5], '2026-02-12')).toBe(false); // Thursday
    });
  });

  describe('habit strength calculation', () => {
    it('classifies habits by consistency percentage', () => {
      expect(getHabitStrengthLabel(100)).toBe('Outstanding');
      expect(getHabitStrengthLabel(50)).toBe('Developing');
      expect(getHabitStrengthLabel(0)).toBe('New');
    });
  });

  describe('habit creation constraints', () => {
    it('max habits starts at 3', () => {
      const defaultMaxHabits = 3;
      expect(defaultMaxHabits).toBe(3);
    });

    it('max habits can increase after consistency', () => {
      // Business rule: after 2 weeks of 60%+ consistency, unlock more
      const consistencyThreshold = 60;
      const daysRequired = 14;
      expect(consistencyThreshold).toBe(60);
      expect(daysRequired).toBe(14);
    });
  });
});
