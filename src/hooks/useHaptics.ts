import { Platform } from 'react-native';

// Conditionally import haptics only on native platforms
let Haptics: any = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

export function useHaptics() {
  const light = () => {
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const medium = () => {
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const success = () => {
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const selection = () => {
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.selectionAsync();
    }
  };

  return { light, medium, success, selection };
}
