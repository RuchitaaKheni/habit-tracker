import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { addDaysToDate, getToday } from '../../utils/date';

interface PauseSheetProps {
  visible: boolean;
  onClose: () => void;
  onPause: (endDate: string) => void;
  habitName: string;
}

const PAUSE_OPTIONS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

export function PauseSheet({ visible, onClose, onPause, habitName }: PauseSheetProps) {
  const colors = useColors();
  const haptics = useHaptics();
  const [selectedDays, setSelectedDays] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedDays(null);
    }
  }, [visible]);

  const handleClose = () => {
    setSelectedDays(null);
    onClose();
  };

  const handleSelect = (days: number) => {
    haptics.selection();
    setSelectedDays(days);
  };

  const handleConfirm = () => {
    if (selectedDays) {
      const endDate = addDaysToDate(getToday(), selectedDays);
      onPause(endDate);
      setSelectedDays(null);
      handleClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={`Pause "${habitName}"`}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Paused days won't count against your Flex Streak. You're still in control!
      </Text>
      <View style={styles.optionsContainer}>
        {PAUSE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.days}
            style={[
              styles.option,
              {
                backgroundColor:
                  selectedDays === option.days ? colors.primaryLight : colors.surfaceSecondary,
                borderColor: selectedDays === option.days ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleSelect(option.days)}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: selectedDays === option.days ? colors.primary : colors.textPrimary,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          title="Pause Habit"
          onPress={handleConfirm}
          variant="primary"
          fullWidth
          disabled={!selectedDays}
        />
        <Button
          title="Cancel"
          onPress={handleClose}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
    justifyContent: 'center',
  },
  option: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minWidth: 100,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.body,
    fontWeight: '600',
  },
  actions: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
});
