import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';
import { BorderRadius, Shadows, Spacing, Typography } from '../../src/constants/theme';
import {
  habitBenefits,
  habitFlowPrinciples,
  lawsOfBehaviorChange,
  psychologyPrinciples,
} from '../../src/constants/behaviorDesign';

export default function HabitKnowledgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Habit Science</Text>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={[
            styles.heroCard,
            Shadows.sm,
            { backgroundColor: colors.primary, borderColor: colors.primaryDark },
          ]}
        >
          <Text style={styles.heroEyebrow}>ATOMIC HABITS BLUEPRINT</Text>
          <Text style={styles.heroTitle}>Change systems, not just goals.</Text>
          <Text style={styles.heroBody}>
            HabitFlow is designed around behavior psychology so daily actions feel clear,
            lightweight, and repeatable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Why Build Habits?
          </Text>
          {habitBenefits.map((benefit) => (
            <View
              key={benefit.title}
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>{benefit.title}</Text>
              <Text style={[styles.infoBody, { color: colors.textSecondary }]}>
                {benefit.description}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            4 Laws of Behavior Change
          </Text>
          {lawsOfBehaviorChange.map((law) => (
            <View
              key={law.id}
              style={[
                styles.lawCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.lawTitle, { color: colors.textPrimary }]}>{law.title}</Text>
              <Text style={[styles.lawSubtitle, { color: colors.textSecondary }]}>
                {law.subtitle}
              </Text>
              <Text style={[styles.lawQuestion, { color: colors.primary }]}>
                {law.question}
              </Text>
              {law.appSupport.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Human Psychology Principles
          </Text>
          {psychologyPrinciples.map((principle) => (
            <View
              key={principle.title}
              style={[
                styles.infoCard,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                {principle.title}
              </Text>
              <Text style={[styles.infoBody, { color: colors.textSecondary }]}>
                {principle.summary}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            How HabitFlow Applies This
          </Text>
          <View
            style={[
              styles.principlesCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {habitFlowPrinciples.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.bulletText, { color: colors.textSecondary, marginLeft: 8 }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  heroEyebrow: {
    ...Typography.caption,
    color: '#E0F2FE',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  heroTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  heroBody: {
    ...Typography.bodySmall,
    color: '#F0F9FF',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoBody: {
    ...Typography.bodySmall,
  },
  lawCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  lawTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  lawSubtitle: {
    ...Typography.bodySmall,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  lawQuestion: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
  },
  bulletText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  principlesCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});
