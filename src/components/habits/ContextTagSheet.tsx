import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { ContextTag } from '../../types/habit';
import { contextTagLabels } from '../../constants/templates';

interface ContextTagSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (tag: ContextTag, note?: string) => void;
  onPausePress?: () => void;
  habitName: string;
}

export function ContextTagSheet({
  visible,
  onClose,
  onSelect,
  onPausePress,
  habitName,
}: ContextTagSheetProps) {
  const colors = useColors();
  const haptics = useHaptics();
  const [selectedTag, setSelectedTag] = useState<ContextTag | null>(null);
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    if (!visible) {
      setSelectedTag(null);
      setCustomNote('');
    }
  }, [visible]);

  const handleClose = () => {
    setSelectedTag(null);
    setCustomNote('');
    onClose();
  };

  const handleSelect = (tag: ContextTag) => {
    haptics.selection();
    setSelectedTag(tag);
  };

  const handleConfirm = () => {
    if (selectedTag) {
      onSelect(selectedTag, selectedTag === 'custom' ? customNote : undefined);
      setSelectedTag(null);
      setCustomNote('');
      onClose();
    }
  };

  const tags = Object.entries(contextTagLabels) as [ContextTag, string][];

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={`Why are you skipping "${habitName}"?`}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This helps us understand your patterns — no judgment!
      </Text>
      <View style={styles.tagsContainer}>
        {tags.map(([tag, label]) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              {
                backgroundColor: selectedTag === tag ? colors.primaryLight : colors.surfaceSecondary,
                borderColor: selectedTag === tag ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleSelect(tag)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedTag === tag }}
          >
            <Text
              style={[
                styles.tagText,
                { color: selectedTag === tag ? colors.primary : colors.textPrimary },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedTag === 'custom' && (
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Add a note (optional)"
          placeholderTextColor={colors.textTertiary}
          value={customNote}
          onChangeText={setCustomNote}
          maxLength={200}
        />
      )}
      <View style={styles.actions}>
        <Button
          title="Skip with context"
          onPress={handleConfirm}
          variant="primary"
          fullWidth
          disabled={!selectedTag}
        />
        {onPausePress && (
          <Button
            title="Pause instead"
            onPress={onPausePress}
            variant="outline"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        )}
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  tagText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actions: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
});
