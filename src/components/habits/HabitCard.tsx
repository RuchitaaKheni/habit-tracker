import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Habit, HabitCompletion } from '../../types/habit';
import { getHabitFrequencyLabel } from '../../utils/habit';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion | undefined;
  consistencyPercent?: number;
  onToggle: (habitId: string) => void;
  onPress: (habitId: string) => void;
  onLongPress: (habitId: string) => void;
}

export function HabitCard({
  habit,
  completion,
  consistencyPercent,
  onToggle,
  onPress,
  onLongPress,
}: HabitCardProps) {
  const colors = useColors();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const isCompleted = completion?.status === 'completed';
  const isSkipped = completion?.status === 'skipped';
  const isMissed = completion?.status === 'missed';
  const isPaused = habit.status === 'paused';
  const frequencyLabel = getHabitFrequencyLabel(habit);

  const handleToggle = useCallback(() => {
    if (isPaused) return;
    haptics.success();
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withSpring(1, { damping: 6 })
    );
    onToggle(habit.id);
  }, [habit.id, isPaused]);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onPress(habit.id);
  }, [habit.id]);

  const handleLongPress = useCallback(() => {
    haptics.medium();
    onLongPress(habit.id);
  }, [habit.id]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cardBgColor = isPaused
    ? colors.surfaceSecondary
    : isCompleted
      ? colors.successLight
      : colors.surface;

  const borderColor = isCompleted
    ? colors.success
    : isSkipped || isMissed
      ? colors.neutralMiss
      : colors.border;

  const subtitleText = isPaused
    ? 'Paused'
    : isCompleted
      ? 'Completed today'
      : isSkipped
        ? 'Skipped today'
        : isMissed
          ? 'Marked missed'
          : `Due: ${frequencyLabel}`;

  const consistencyText = consistencyPercent !== undefined ? `  •  7d ${consistencyPercent}%` : '';

  return (
    <Animated.View style={cardAnimStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={[
          styles.card,
          Shadows.sm,
          {
            backgroundColor: cardBgColor,
            borderColor: borderColor,
            borderWidth: isCompleted ? 1.5 : 1,
            opacity: isPaused ? 0.78 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${isCompleted ? 'completed' : 'not completed'}`}
      >
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: isCompleted ? '#FFFFFF88' : colors.surfaceSecondary },
            ]}
          >
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.habitName,
                { color: colors.textPrimary },
                isCompleted && styles.completedText,
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {`${subtitleText}${consistencyText}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          disabled={isPaused}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
        >
          <Animated.View
            style={[
              styles.checkbox,
              checkAnimStyle,
              {
                backgroundColor: isCompleted ? colors.success : 'transparent',
                borderColor: isCompleted
                  ? colors.success
                  : isSkipped || isMissed
                    ? colors.neutralMiss
                    : colors.border,
              },
            ]}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            {(isSkipped || isMissed) && <Text style={styles.skipMark}>—</Text>}
          </Animated.View>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  habitName: {
    ...Typography.body,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
