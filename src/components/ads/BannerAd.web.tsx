import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Web fallback for banner ads.
 * AdMob native SDK is unavailable on web, so we render a zero-height placeholder.
 */
export function BannerAdComponent() {
  return <View style={styles.placeholder} />;
}

const styles = StyleSheet.create({
  placeholder: {
    height: 0,
  },
});
