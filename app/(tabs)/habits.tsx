import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '../../src/hooks/useColors';
import { useHaptics } from '../../src/hooks/useHaptics';
import { Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { BannerAdComponent } from '../../src/components/ads/BannerAd';
import { Habit } from '../../src/types/habit';
import { getHabitFrequencyLabel } from '../../src/utils/habit';

type FilterTab = 'all' | 'active' | 'paused' | 'archived';

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { habits, resumeHabit, archiveHabit, unarchiveHabit, deleteHabit } = useHabitStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const allHabits = habits;
  const filteredHabits = activeFilter === 'all'
    ? allHabits
    : allHabits.filter((h) => h.status === activeFilter);

  const filters: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Paused', value: 'paused' },
    { label: 'Archived', value: 'archived' },
  ];

  const handleHabitAction = (habit: Habit) => {
    const actions: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: 'View Details', onPress: () => router.push(`/habit/${habit.id}`) },
      { text: 'Edit', onPress: () => router.push({ pathname: '/habit/edit', params: { id: habit.id } }) },
    ];

    if (habit.status === 'paused') {
      actions.push({ text: 'Resume', onPress: () => resumeHabit(habit.id) });
    }
    if (habit.status === 'active') {
      actions.push({ text: 'Archive', onPress: () => archiveHabit(habit.id) });
    }
    if (habit.status === 'archived') {
      actions.push({ text: 'Unarchive', onPress: () => unarchiveHabit(habit.id) });
    }
    actions.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Delete Habit',
          `Are you sure you want to delete "${habit.name}"? This cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteHabit(habit.id),
            },
          ]
        );
      },
    });
    actions.push({ text: 'Cancel', style: 'cancel', onPress: () => {} });

    Alert.alert(habit.name, 'Choose an action', actions);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paused':
        return { label: 'Paused', color: colors.warning, bg: colors.warningLight };
      case 'archived':
        return { label: 'Archived', color: colors.neutralMiss, bg: colors.surfaceSecondary };
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>My Habits</Text>

        <View
          style={[
            styles.psychologyBanner,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="school-outline" size={16} color={colors.primary} />
          <Text style={[styles.psychologyText, { color: colors.textSecondary }]}>
            Identity first: every completion is a vote for the person you want to become.
          </Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === filter.value ? colors.primary : colors.surfaceSecondary,
                },
              ]}
              onPress={() => {
                haptics.selection();
                setActiveFilter(filter.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: activeFilter === filter.value ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Habit list */}
        {filteredHabits.length === 0 ? (
          <EmptyState
            icon="📋"
            title={activeFilter === 'all' ? 'No habits yet' : `No ${activeFilter} habits`}
            message={
              activeFilter === 'all'
                ? 'Create your first habit to get started.'
                : `You don't have any ${activeFilter} habits.`
            }
            actionLabel={activeFilter === 'all' ? 'Create Habit' : undefined}
            onAction={activeFilter === 'all' ? () => router.push('/habit/create') : undefined}
          />
        ) : (
          filteredHabits.map((habit, index) => {
            const badge = getStatusBadge(habit.status);
            return (
              <Animated.View key={habit.id} entering={FadeInDown.delay(index * 60)}>
                <TouchableOpacity
                  style={[
                    styles.habitRow,
                    Shadows.sm,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/habit/${habit.id}`)}
                  onLongPress={() => handleHabitAction(habit)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitName,
                        { color: colors.textPrimary },
                        habit.status === 'paused' && { opacity: 0.6 },
                      ]}
                      numberOfLines={1}
                    >
                      {habit.name}
                    </Text>
                    <Text style={[styles.habitFreq, { color: colors.textSecondary }]}>
                      {getHabitFrequencyLabel(habit)}
                    </Text>
                  </View>
                  {badge && (
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}

        <BannerAdComponent />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadows.lg, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/habit/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    ...Typography.h1,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  psychologyBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  psychologyText: {
    ...Typography.caption,
    flex: 1,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  colorDot: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    ...Typography.body,
    fontWeight: '500',
  },
  habitFreq: {
    ...Typography.caption,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
