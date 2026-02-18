import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors } from '../../src/hooks/useColors';
import { useHaptics } from '../../src/hooks/useHaptics';
import { Typography, Spacing, BorderRadius, HabitColors, HabitIcons } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { Button } from '../../src/components/ui/Button';
import { FrequencyType } from '../../src/types/habit';
import { getDayShort } from '../../src/utils/date';

export default function EditHabitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, updateHabit, deleteHabit } = useHabitStore();

  const habit = habits.find((h) => h.id === id);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(HabitColors[0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [flexTarget, setFlexTarget] = useState(3);
  const [cue, setCue] = useState('');
  const [action, setAction] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 8, 0));
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setFrequency(habit.frequency);
      setCustomDays(habit.customDays || [1, 2, 3, 4, 5]);
      setFlexTarget(habit.flexibleTarget || 3);
      setCue(habit.implementationCue);
      setAction(habit.implementationAction);
      setReminderEnabled(habit.reminderEnabled);
      if (habit.reminderTime) {
        const [h, m] = habit.reminderTime.split(':').map(Number);
        setReminderTime(new Date(2000, 0, 1, h, m));
      }
    }
  }, [habit]);

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 100 }}>
          Habit not found
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your habit.');
      return;
    }

    if (frequency === 'custom' && customDays.length === 0) {
      Alert.alert('Select Days', 'Please choose at least one day for a custom schedule.');
      return;
    }

    const normalizedName = name.trim().toLowerCase();
    const duplicate = habits.some(
      (item) =>
        item.id !== habit.id &&
        item.status !== 'archived' &&
        item.name.trim().toLowerCase() === normalizedName
    );
    if (duplicate) {
      Alert.alert('Habit Exists', 'Another habit already uses this name.');
      return;
    }

    const updated = {
      ...habit,
      name: name.trim(),
      icon,
      color,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      flexibleTarget: frequency === 'flexible' ? flexTarget : undefined,
      implementationCue: cue.trim(),
      implementationAction: action.trim(),
      reminderTime: reminderEnabled
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : null,
      reminderEnabled,
      updatedAt: new Date().toISOString(),
    };

    await updateHabit(updated);

    haptics.success();
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  const toggleDay = (day: number) => {
    haptics.selection();
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Habit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Habit Name</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Icon picker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.iconRow}>
              {HabitIcons.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: icon === ic ? color + '20' : colors.surface,
                      borderColor: icon === ic ? color : colors.border,
                    },
                  ]}
                  onPress={() => { haptics.selection(); setIcon(ic); }}
                >
                  <Text style={styles.iconText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Color picker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {HabitColors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onPress={() => { haptics.selection(); setColor(c); }}
              >
                {color === c && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Frequency</Text>
          <View style={styles.freqRow}>
            {(
              [
                { label: 'Daily', value: 'daily' },
                { label: 'Weekdays', value: 'weekdays' },
                { label: 'Custom', value: 'custom' },
                { label: 'Flexible', value: 'flexible' },
              ] as const
            ).map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.freqOption,
                  {
                    backgroundColor: frequency === f.value ? colors.primary : colors.surface,
                    borderColor: frequency === f.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { haptics.selection(); setFrequency(f.value); }}
              >
                <Text
                  style={[
                    styles.freqText,
                    { color: frequency === f.value ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {frequency === 'custom' && (
            <View style={styles.daysRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: customDays.includes(day) ? colors.primary : colors.surface,
                      borderColor: customDays.includes(day) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={{
                      ...Typography.caption,
                      fontWeight: '600',
                      color: customDays.includes(day) ? '#FFFFFF' : colors.textPrimary,
                    }}
                  >
                    {getDayShort(day)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {frequency === 'flexible' && (
            <View style={styles.flexRow}>
              <Text style={[styles.flexLabel, { color: colors.textSecondary }]}>
                Times per week:
              </Text>
              <View style={styles.flexCounter}>
                <TouchableOpacity
                  onPress={() => setFlexTarget(Math.max(1, flexTarget - 1))}
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{flexTarget}</Text>
                <TouchableOpacity
                  onPress={() => setFlexTarget(Math.min(7, flexTarget + 1))}
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                >
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Implementation Intention */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Implementation Intention</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            placeholder="After I..."
            placeholderTextColor={colors.textTertiary}
            value={cue}
            onChangeText={setCue}
            maxLength={100}
          />
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border, marginTop: Spacing.sm },
            ]}
            placeholder="I will..."
            placeholderTextColor={colors.textTertiary}
            value={action}
            onChangeText={setAction}
            maxLength={100}
          />
        </View>

        {/* Reminder */}
        <View style={styles.fieldGroup}>
          <View style={styles.reminderRow}>
            <View>
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                Reminder
              </Text>
              {reminderEnabled && (
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <Text style={[styles.timeText, { color: colors.primary }]}>
                    {reminderTime.getHours().toString().padStart(2, '0')}:
                    {reminderTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {showTimePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display="spinner"
              onChange={(_, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setReminderTime(date);
              }}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Save Changes" onPress={handleSave} variant="primary" size="lg" fullWidth />
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={[styles.deleteText, { color: colors.error }]}>Delete Habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeBtn: { padding: Spacing.sm },
  headerTitle: { ...Typography.h3 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  fieldGroup: { marginBottom: Spacing['2xl'] },
  label: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.sm },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  iconRow: { flexDirection: 'row', gap: Spacing.sm },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  freqOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  freqText: { ...Typography.bodySmall, fontWeight: '600' },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  flexLabel: { ...Typography.body },
  flexCounter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: { ...Typography.h3, minWidth: 24, textAlign: 'center' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { ...Typography.h3, marginTop: 4 },
  actions: { marginTop: Spacing.xl, marginBottom: Spacing['3xl'] },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  deleteText: { ...Typography.body, fontWeight: '600' },
});
