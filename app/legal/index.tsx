import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';
import { BorderRadius, Spacing, Typography } from '../../src/constants/theme';

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Spacing['3xl'],
        }}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy & Terms</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Privacy Summary</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            HabitFlow stores habits, check-ins, mood notes, and settings on your device. You can
            export your data any time from Settings.
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Notifications are optional and can be disabled at any time. Ad requests are configured
            as non-personalized by default.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Terms Snapshot</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            This app is a self-improvement tool and does not provide medical or mental-health
            treatment advice.
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            You are responsible for how you use reminders, goals, and analytics. Always use safe,
            realistic targets for your routines.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>User Controls</Text>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• Export data from Settings</Text>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• Reset all data from Settings</Text>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• Turn notifications on or off</Text>
          <Text style={[styles.bullet, { color: colors.textSecondary }]}>• Archive or delete habits any time</Text>
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
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  bullet: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
});
