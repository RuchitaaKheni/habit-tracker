import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  type?: 'success' | 'info' | 'warning';
}

export function Toast({ message, visible, onHide, duration = 2500, type = 'success' }: ToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      translateY.value = withDelay(
        duration,
        withTiming(-100, { duration: 300 }, () => {
          runOnJS(onHide)();
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bgColor =
    type === 'success'
      ? colors.success
      : type === 'warning'
        ? colors.warning
        : colors.primary;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: bgColor, top: insets.top + Spacing.sm },
        Shadows.md,
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    zIndex: 1000,
    alignItems: 'center',
  },
  message: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
