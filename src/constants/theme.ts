export const Colors = {
  light: {
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    primaryLight: '#E0F2FE',
    secondary: '#8B5CF6',
    secondaryLight: '#EDE9FE',
    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    neutralMiss: '#94A3B8',
    celebration: '#FFD700',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    shadow: 'rgba(0, 0, 0, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarInactive: '#94A3B8',
  },
  dark: {
    primary: '#38BDF8',
    primaryDark: '#0EA5E9',
    primaryLight: '#0C4A6E',
    secondary: '#A78BFA',
    secondaryLight: '#312E81',
    success: '#4ADE80',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    neutralMiss: '#64748B',
    celebration: '#FFD700',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1E293B',
    tabBarInactive: '#64748B',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
} as const;

export const HabitColors: string[] = [
  '#0EA5E9', '#8B5CF6', '#22C55E', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#06B6D4', '#A855F7',
];

export const HabitIcons = [
  '💧', '🏋️', '📖', '🧘', '✍️', '🎵', '🏃', '💊',
  '🍎', '😴', '🧹', '📱', '🎨', '🌱', '🧠', '💰',
  '🙏', '☕', '🚶', '🎯', '📝', '🍳', '🚿', '😊',
] as const;
