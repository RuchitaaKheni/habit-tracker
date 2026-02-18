import { Colors, ThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/themeStore';

export function useColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? Colors.dark : Colors.light;
}
