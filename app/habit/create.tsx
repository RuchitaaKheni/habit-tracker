import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColors } from '../../src/hooks/useColors';
import { useHaptics } from '../../src/hooks/useHaptics';
import { Typography, Spacing, BorderRadius, HabitColors, HabitIcons } from '../../src/constants/theme';
import { useHabitStore } from '../../src/store/habitStore';
import { Button } from '../../src/components/ui/Button';
import { Habit, FrequencyType } from '../../src/types/habit';
import { habitTemplates } from '../../src/constants/templates';
import { getDayShort } from '../../src/utils/date';
import { getHabitFrequencyLabel } from '../../src/utils/habit';
import { useShallow } from 'zustand/react/shallow';

export default function CreateHabitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { addHabit, habits, profile } = useHabitStore(
    useShallow((state) => ({
      addHabit: state.addHabit,
      habits: state.habits,
      profile: state.profile,
    }))
  );

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
  const [showTemplates, setShowTemplates] = useState(true);

  const activeCount = habits.filter((h) => h.status === 'active').length;
  const maxHabits = profile?.maxHabits || 3;
  const canAdd = activeCount < maxHabits;

  const frequencyLabel = getHabitFrequencyLabel({
    frequency,
    customDays,
    flexibleTarget: flexTarget,
  });
  const lawChecks = [
    {
      id: 'obvious',
      label: 'Make it obvious',
      helper: cue.trim()
        ? `Cue set: "After ${cue.trim()}"`
        : reminderEnabled
          ? 'Reminder enabled'
          : 'Add a cue or reminder to reduce forgetfulness',
      complete: Boolean(cue.trim() || reminderEnabled),
    },
    {
      id: 'attractive',
      label: 'Make it attractive',
      helper: name.trim()
        ? `Identity vote: "${name.trim()}" supports who you want to be`
        : 'Name the behavior clearly so it feels meaningful',
      complete: Boolean(name.trim()),
    },
    {
      id: 'easy',
      label: 'Make it easy',
      helper: `Current friction level: ${frequencyLabel}`,
      complete: frequency !== 'custom' || customDays.length > 0,
    },
    {
      id: 'satisfying',
      label: 'Make it satisfying',
      helper: 'You will get instant progress feedback after each check-in',
      complete: true,
    },
  ] as const;
  const setupScore = lawChecks.filter((l) => l.complete).length;

  const handleSelectTemplate = (templateIndex: number) => {
    const t = habitTemplates[templateIndex];
    haptics.selection();
    setName(t.name);
    setIcon(t.icon);
    setColor(t.color);
    setCue(t.defaultCue);
    setAction(t.defaultAction);
    setShowTemplates(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your habit.');
      return;
    }

    if (!canAdd) {
      Alert.alert(
        'Habit Limit Reached',
        `You can have up to ${maxHabits} active habits. Maintain 60%+ consistency for 2 weeks to unlock more!`
      );
      return;
    }

    if (frequency === 'custom' && customDays.length === 0) {
      Alert.alert('Select Days', 'Please choose at least one day for a custom schedule.');
      return;
    }

    const normalizedName = name.trim().toLowerCase();
    const duplicate = habits.some(
      (habit) => habit.status !== 'archived' && habit.name.trim().toLowerCase() === normalizedName
    );
    if (duplicate) {
      Alert.alert('Habit Exists', 'You already have a habit with this name.');
      return;
    }

    const habit: Habit = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
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
      contextTags: [],
      status: 'active',
      pauseEndDate: null,
      sortOrder: habits.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addHabit(habit);

    haptics.success();
    router.back();
  };

  const toggleDay = (day: number) => {
    haptics.selection();
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Habit</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.tipBanner,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="timer-outline" size={18} color={colors.primary} />
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Two-Minute Rule</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Scale your habit down to 2 minutes first. Master showing up, then grow.
            </Text>
          </View>
        </View>

        {/* Templates */}
        {showTemplates && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Start</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateRow}
            >
              {habitTemplates.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.templateCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleSelectTemplate(i)}
                >
                  <Text style={styles.templateIcon}>{t.icon}</Text>
                  <Text style={[styles.templateName, { color: colors.textPrimary }]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Text style={[styles.customLink, { color: colors.primary }]}>
                Or create a custom habit
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Habit Name</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            placeholder="e.g., Meditate for 10 minutes"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus={!showTemplates}
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

          {/* Custom days */}
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
                    style={[
                      styles.dayChipText,
                      { color: customDays.includes(day) ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {getDayShort(day)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Flexible target */}
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

        {/* Atomic setup coach */}
        <View
          style={[
            styles.fieldGroup,
            styles.coachCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.coachTitle, { color: colors.textPrimary }]}>
            Atomic Setup Coach
          </Text>
          <Text style={[styles.coachSubtitle, { color: colors.textSecondary }]}>
            {setupScore}/4 laws configured for this habit
          </Text>
          {lawChecks.map((law) => (
            <View key={law.id} style={styles.coachRow}>
              <Ionicons
                name={law.complete ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={law.complete ? colors.success : colors.textTertiary}
              />
              <View style={styles.coachTextWrap}>
                <Text style={[styles.coachLabel, { color: colors.textPrimary }]}>
                  {law.label}
                </Text>
                <Text style={[styles.coachHint, { color: colors.textSecondary }]}>
                  {law.helper}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Implementation Intention */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Implementation Intention (Optional)
          </Text>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            "After I ___, I will ___" — This doubles your success rate!
          </Text>
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

        {/* Capacity warning */}
        {!canAdd && (
          <View style={[styles.warningBanner, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              You have {activeCount}/{maxHabits} active habits. Build consistency first!
            </Text>
          </View>
        )}

        {/* Save button */}
        <View style={styles.saveContainer}>
          <Text style={[styles.saveTip, { color: colors.textSecondary }]}>
            Tip: start ridiculously small. You can always increase later.
          </Text>
          <Button
            title="Create Habit"
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!name.trim() || !canAdd}
          />
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
  hint: { ...Typography.caption, marginBottom: Spacing.sm },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  templateRow: { marginBottom: Spacing.md },
  templateCard: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  templateIcon: { fontSize: 28, marginBottom: 4 },
  templateName: { ...Typography.caption, fontWeight: '500', textAlign: 'center' },
  customLink: { ...Typography.bodySmall, fontWeight: '500', textAlign: 'center', marginTop: Spacing.sm },
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
  dayChipText: { ...Typography.caption, fontWeight: '600' },
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  warningText: { ...Typography.bodySmall, flex: 1 },
  saveContainer: { marginTop: Spacing.lg, marginBottom: Spacing['3xl'] },
  tipBanner: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  tipText: {
    ...Typography.caption,
    marginTop: 2,
  },
  saveTip: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  coachCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  coachTitle: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  coachSubtitle: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  coachTextWrap: {
    flex: 1,
  },
  coachLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  coachHint: {
    ...Typography.caption,
    marginTop: 2,
  },
});
