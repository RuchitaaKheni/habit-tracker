import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        {actionLabel && onAction && (
          <Button title={actionLabel} onPress={onAction} variant="primary" size="md" style={styles.button} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['5xl'],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    minWidth: 170,
  },
});
