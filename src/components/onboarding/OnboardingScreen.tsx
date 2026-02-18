import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius, Shadows, HabitColors } from '../../constants/theme';
import { Button } from '../ui/Button';
import { motivationQuizQuestions, habitTemplates } from '../../constants/templates';
import { useHabitStore } from '../../store/habitStore';
import { Habit, MotivationType } from '../../types/habit';
import { requestNotificationPermissions, setupNotificationCategories } from '../../services/notifications';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [step, setStep] = useState(0);
  const { addHabit, updateProfile, habits } = useHabitStore();

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customHabitName, setCustomHabitName] = useState('');

  const handleNext = useCallback(() => {
    haptics.light();
    setStep((s) => s + 1);
  }, []);

  const handleQuizAnswer = useCallback((value: string, questionIndex: number) => {
    haptics.selection();
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = value;
    setQuizAnswers(newAnswers);

    // Auto-advance after a short delay
    setTimeout(() => {
      if (questionIndex < motivationQuizQuestions.length - 1) {
        setStep((s) => s + 1);
      } else {
        setStep(motivationQuizQuestions.length + 1); // Go to habit creation
      }
    }, 300);
  }, [quizAnswers]);

  const handleCreateHabit = useCallback(async () => {
    const template = selectedTemplate !== null ? habitTemplates[selectedTemplate] : null;
    const habitName = template ? template.name : customHabitName.trim();

    if (!habitName) return;
    const duplicate = habits.some(
      (habit) =>
        habit.status !== 'archived' &&
        habit.name.trim().toLowerCase() === habitName.trim().toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Habit Exists', 'You already created that habit. Choose another one.');
      return;
    }

    const habit: Habit = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      name: habitName,
      icon: template?.icon || '🎯',
      color: template?.color || HabitColors[0],
      frequency: 'daily',
      implementationCue: template?.defaultCue || '',
      implementationAction: template?.defaultAction || '',
      reminderTime: null,
      reminderEnabled: false,
      contextTags: [],
      status: 'active',
      pauseEndDate: null,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addHabit(habit);

    // Update profile with motivation type
    const motivationType = (quizAnswers[0] || 'flexible') as MotivationType;
    await updateProfile({
      motivationType,
      onboardingCompleted: true,
    });

    // Request notification permissions
    await requestNotificationPermissions();
    await setupNotificationCategories();

    handleNext();
  }, [selectedTemplate, customHabitName, quizAnswers, updateProfile, habits, addHabit, handleNext]);

  const renderStep = () => {
    // Welcome screen
    if (step === 0) {
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.welcomeEmoji}>🌱</Text>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>
            Build habits that stick
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Without the guilt. Progress over perfection.
          </Text>
          <View style={styles.featureList}>
            {[
              ['📊', 'Flex Streaks that forgive missed days'],
              ['🧠', 'Smart context — we understand life happens'],
              ['✨', 'Insights that help you understand yourself'],
            ].map(([icon, text], i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{text}</Text>
              </View>
            ))}
          </View>
          <Button title="Get Started" onPress={handleNext} variant="primary" size="lg" fullWidth />
        </Animated.View>
      );
    }

    // Quiz questions
    const quizIndex = step - 1;
    if (quizIndex < motivationQuizQuestions.length) {
      const question = motivationQuizQuestions[quizIndex];
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>
            Question {quizIndex + 1} of {motivationQuizQuestions.length}
          </Text>
          <Text style={[styles.h2, { color: colors.textPrimary }]}>{question.question}</Text>
          <View style={styles.optionsList}>
            {question.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionCard,
                  Shadows.sm,
                  {
                    backgroundColor:
                      quizAnswers[quizIndex] === option.value
                        ? colors.primaryLight
                        : colors.surface,
                    borderColor:
                      quizAnswers[quizIndex] === option.value
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => handleQuizAnswer(option.value, quizIndex)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        quizAnswers[quizIndex] === option.value
                          ? colors.primary
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      );
    }

    // Create first habit
    if (step === motivationQuizQuestions.length + 1) {
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>Almost there!</Text>
          <Text style={[styles.h2, { color: colors.textPrimary }]}>
            Pick your first habit
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Start small. You can add more later.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templateScroll}
          >
            {habitTemplates.slice(0, 8).map((template, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor:
                      selectedTemplate === i ? template.color + '20' : colors.surface,
                    borderColor: selectedTemplate === i ? template.color : colors.border,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setSelectedTemplate(i);
                  setCustomHabitName('');
                }}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text
                  style={[
                    styles.templateName,
                    {
                      color: selectedTemplate === i ? template.color : colors.textPrimary,
                    },
                  ]}
                >
                  {template.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.orDivider}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>
          <TextInput
            style={[
              styles.customInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceSecondary,
                borderColor: customHabitName ? colors.primary : colors.border,
              },
            ]}
            placeholder="Type a custom habit..."
            placeholderTextColor={colors.textTertiary}
            value={customHabitName}
            onChangeText={(text) => {
              setCustomHabitName(text);
              if (text) setSelectedTemplate(null);
            }}
            maxLength={50}
          />
          <Button
            title="Create Habit"
            onPress={handleCreateHabit}
            variant="primary"
            size="lg"
            fullWidth
            disabled={selectedTemplate === null && !customHabitName.trim()}
          />
        </Animated.View>
      );
    }

    // Celebration / Done
    return (
      <Animated.View entering={FadeInRight} style={styles.stepContainer}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <Text style={[styles.h1, { color: colors.textPrimary }]}>You're all set!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your first habit is ready. Let's make today count.
        </Text>
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Pro tip</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Start with just this one habit. After 2 weeks of 60%+ consistency, you'll unlock the ability to add more.
          </Text>
        </View>
        <Button
          title="Go to Dashboard"
          onPress={onComplete}
          variant="primary"
          size="lg"
          fullWidth
        />
      </Animated.View>
    );
  };

  // Progress dots
  const totalSteps = motivationQuizQuestions.length + 3; // welcome + quiz + create + done

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.progressDots}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
      {step > 0 && step < totalSteps - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            if (step < motivationQuizQuestions.length + 1) {
              setStep(motivationQuizQuestions.length + 1);
            }
          }}
        >
          <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing['5xl'],
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  stepContainer: {
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: Spacing['2xl'],
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: Spacing['2xl'],
  },
  h1: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  h2: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  stepLabel: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  bodyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  featureList: {
    width: '100%',
    marginBottom: Spacing['3xl'],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    flex: 1,
  },
  optionsList: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionCard: {
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.body,
    fontWeight: '500',
  },
  templateScroll: {
    marginBottom: Spacing.lg,
    maxHeight: 120,
  },
  templateCard: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  templateName: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: Spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
  },
  customInput: {
    ...Typography.body,
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },
  tipCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  tipTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  tipText: {
    ...Typography.bodySmall,
  },
});
