import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { BorderRadius, Spacing } from '../../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.row}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={skeletonStyles.textGroup}>
          <SkeletonLoader width={140} height={18} />
          <SkeletonLoader width={90} height={14} style={{ marginTop: 6 }} />
        </View>
        <SkeletonLoader width={28} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
