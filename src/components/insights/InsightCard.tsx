import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface InsightCardProps {
  icon: string;
  title: string;
  message: string;
  accentColor?: string;
}

export function InsightCard({ icon, title, message, accentColor }: InsightCardProps) {
  const colors = useColors();
  const accent = accentColor || colors.primary;

  return (
    <View
      style={[
        styles.card,
        Shadows.sm,
        { backgroundColor: colors.surface, borderLeftColor: accent },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.body,
    fontWeight: '600',
  },
  message: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
});
