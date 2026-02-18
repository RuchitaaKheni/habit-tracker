import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
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

export function MoodTracker() {
  const colors = useColors();
  const haptics = useHaptics();
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadTodayMood() {
      const mood = await getMoodForDate(getToday());
      if (mood) {
        setSelectedMood(mood.rating);
        setNote(mood.note || '');
        setSaved(true);
      }
    }
    loadTodayMood();
  }, []);

  const handleSelect = useCallback(async (rating: MoodRating) => {
    haptics.selection();
    setSelectedMood(rating);

    const mood: DailyMood = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      date: getToday(),
      rating,
      note: note || null,
      createdAt: new Date().toISOString(),
    };

    await upsertMood(mood);
    setSaved(true);
  }, [note]);

  return (
    <Animated.View entering={FadeInDown.delay(200)}>
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {saved ? 'Today\'s Mood' : 'How are you feeling?'}
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
                await upsertMood({
                  id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
                  date: getToday(),
                  rating: selectedMood,
                  note: note || null,
                  createdAt: new Date().toISOString(),
                });
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
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
