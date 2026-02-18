import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { MoodRating, DailyMood } from '../../types/habit';
import { upsertMood, getMoodForDate } from '../../database/database';
import { getToday } from '../../utils/date';

const MOOD_OPTIONS: { rating: MoodRating; emoji: string; label: string }[] = [
  { rating: 1, emoji: '😢', label: 'Awful' },
  { rating: 2, emoji: '😟', label: 'Bad' },
  { rating: 3, emoji: '😐', label: 'Okay' },
  { rating: 4, emoji: '😊', label: 'Good' },
  { rating: 5, emoji: '🤩', label: 'Great' },
];

function normalizeNote(note: string): string | null {
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function MoodTracker() {
  const colors = useColors();
  const haptics = useHaptics();
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [moodId, setMoodId] = useState<string | null>(null);
  const [lastSavedMood, setLastSavedMood] = useState<{
    rating: MoodRating;
    note: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadTodayMood() {
      const mood = await getMoodForDate(getToday());
      if (mood) {
        setSelectedMood(mood.rating);
        setNote(mood.note || '');
        setSaved(true);
        setMoodId(mood.id);
        setLastSavedMood({ rating: mood.rating, note: mood.note });
      }
    }
    loadTodayMood();
  }, []);

  const saveMood = useCallback(
    async (rating: MoodRating, nextNote: string) => {
      const normalizedNote = normalizeNote(nextNote);
      if (
        lastSavedMood &&
        lastSavedMood.rating === rating &&
        lastSavedMood.note === normalizedNote
      ) {
        return;
      }

      const mood: DailyMood = {
        id: moodId ?? generateId(),
        date: getToday(),
        rating,
        note: normalizedNote,
        createdAt: new Date().toISOString(),
      };

      await upsertMood(mood);
      setMoodId(mood.id);
      setLastSavedMood({ rating, note: normalizedNote });
      setSaved(true);
    },
    [lastSavedMood, moodId]
  );

  const handleSelect = useCallback(
    async (rating: MoodRating) => {
      haptics.selection();
      setSelectedMood(rating);
      await saveMood(rating, note);
    },
    [haptics, note, saveMood]
  );

  return (
    <Animated.View entering={FadeInDown.delay(200)}>
      <View style={[styles.container, Shadows.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {saved ? 'Today\'s Mood' : 'How are you feeling?'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          A quick check-in helps you spot patterns with your habits.
        </Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.rating}
              style={[
                styles.moodButton,
                {
                  backgroundColor:
                    selectedMood === option.rating ? colors.primaryLight : 'transparent',
                  borderColor:
                    selectedMood === option.rating ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => handleSelect(option.rating)}
              accessibilityLabel={`Mood: ${option.label}`}
            >
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  {
                    color:
                      selectedMood === option.rating ? colors.primary : colors.textTertiary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedMood && (
          <TextInput
            style={[
              styles.noteInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add a note about your day (optional)..."
            placeholderTextColor={colors.textTertiary}
            value={note}
            onChangeText={setNote}
            onBlur={async () => {
              if (selectedMood) {
                await saveMood(selectedMood, note);
              }
            }}
            maxLength={200}
            multiline
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  moodLabel: {
    ...Typography.caption,
  },
  noteInput: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 40,
  },
});
