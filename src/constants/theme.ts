export const Colors = {
  light: {
    primary: '#14B8A6',
    primaryDark: '#0F766E',
    primaryLight: '#DFF8F4',
    secondary: '#3B82F6',
    secondaryLight: '#DBEAFE',
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#D97706',
    warningLight: '#FFEDD5',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    neutralMiss: '#94A3B8',
    celebration: '#FFD700',
    background: '#F4F8F8',
    surface: '#FFFFFF',
    surfaceSecondary: '#ECF3F4',
    textPrimary: '#0F1D2A',
    textSecondary: '#5C7085',
    textTertiary: '#8BA0B3',
    border: '#D7E3E6',
    borderLight: '#EAF1F3',
    shadow: 'rgba(15, 23, 42, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FDFEFE',
    tabBarInactive: '#8DA0AF',
  },
  dark: {
    primary: '#2DD4BF',
    primaryDark: '#14B8A6',
    primaryLight: '#11413D',
    secondary: '#60A5FA',
    secondaryLight: '#1E3A5F',
    success: '#4ADE80',
    successLight: '#134E38',
    warning: '#F59E0B',
    warningLight: '#7C4A12',
    error: '#F87171',
    errorLight: '#7A1E2B',
    neutralMiss: '#64748B',
    celebration: '#FFD700',
    background: '#0D1B25',
    surface: '#122331',
    surfaceSecondary: '#1B3244',
    textPrimary: '#EAF3F8',
    textSecondary: '#9CB2C2',
    textTertiary: '#6E879A',
    border: '#244154',
    borderLight: '#1B3244',
    shadow: 'rgba(0, 0, 0, 0.42)',
    overlay: 'rgba(0, 0, 0, 0.68)',
    tabBar: '#122331',
    tabBarInactive: '#6E879A',
  },
} as const;

export type ThemeColors = {
  [K in keyof typeof Colors.light]: string;
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 30, fontWeight: '700' as const, lineHeight: 38 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 19, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 17 },
  button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 22 },
} as const;

export const Shadows = {
  sm: {
    boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)',
  },
  md: {
    boxShadow: '0px 6px 18px rgba(15, 23, 42, 0.1)',
  },
  lg: {
    boxShadow: '0px 12px 28px rgba(15, 23, 42, 0.16)',
  },
} as const;

export const HabitColors: string[] = [
  '#14B8A6', '#0EA5E9', '#22C55E', '#F59E0B',
  '#EF4444', '#10B981', '#0F766E', '#F97316',
  '#2563EB', '#84CC16', '#06B6D4', '#B45309',
];

export const HabitIcons = [
  '💧', '🏋️', '📖', '🧘', '✍️', '🎵', '🏃', '💊',
  '🍎', '😴', '🧹', '📱', '🎨', '🌱', '🧠', '💰',
  '🙏', '☕', '🚶', '🎯', '📝', '🍳', '🚿', '😊',
] as const;
