import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useHaptics } from '../../hooks/useHaptics';
import { Typography, BorderRadius, Spacing } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const containerStyle: ViewStyle = {
    ...styles.base,
    ...sizeStyles[size],
    ...(fullWidth && styles.fullWidth),
    ...(variant === 'primary' && { backgroundColor: colors.primary }),
    ...(variant === 'secondary' && { backgroundColor: colors.secondary }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
    ...(disabled && { opacity: 0.5 }),
  };

  const labelStyle: TextStyle = {
    ...Typography.button,
    ...sizeTextStyles[size],
    ...(variant === 'primary' && { color: '#FFFFFF' }),
    ...(variant === 'secondary' && { color: '#FFFFFF' }),
    ...(variant === 'outline' && { color: colors.primary }),
    ...(variant === 'ghost' && { color: colors.primary }),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[labelStyle, icon ? { marginLeft: Spacing.sm } : undefined, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.sm },
  md: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.md },
  lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: BorderRadius.lg },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
};
