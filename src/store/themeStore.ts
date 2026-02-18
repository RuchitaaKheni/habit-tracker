import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark';
  }
  return mode === 'dark';
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  isDark: resolveIsDark('system'),

  setMode: (mode) => {
    set({ mode, isDark: resolveIsDark(mode) });
    AsyncStorage.setItem('theme_mode', mode);
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme_mode');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      set({ mode: saved as ThemeMode, isDark: resolveIsDark(saved as ThemeMode) });
    }
  },
}));
