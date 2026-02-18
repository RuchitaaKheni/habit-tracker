import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import Animated, { useAnimatedProps, withTiming, useSharedValue, withDelay } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  delay?: number;
}

export function ProgressRing({
  percentage,
  size = 100,
  strokeWidth = 8,
  color,
  showLabel = true,
  label,
  delay = 0,
}: ProgressRingProps) {
  const colors = useColors();
  const ringColor = color || colors.primary;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(delay, withTiming(percentage / 100, { duration: 800 }));
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Animated.Text style={[styles.percentage, { color: colors.textPrimary }]}>
            {Math.round(percentage)}%
          </Animated.Text>
          {label && (
            <Animated.Text style={[styles.label, { color: colors.textSecondary }]}>
              {label}
            </Animated.Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    ...Typography.h3,
  },
  label: {
    ...Typography.caption,
    marginTop: 2,
  },
});
