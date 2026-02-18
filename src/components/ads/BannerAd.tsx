import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Spacing } from '../../constants/theme';

const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
    default: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
  }),
};

/**
 * BannerAd component - displays a banner ad at the bottom of screens.
 *
 * Uses Google AdMob test IDs during development.
 * In production, provide AdMob IDs via EXPO_PUBLIC_ADMOB_* env vars.
 *
 * Note: react-native-google-mobile-ads requires a development build (not Expo Go).
 * In Expo Go, this will render a placeholder.
 */
export function BannerAdComponent() {
  // Ads are not supported on web
  if (Platform.OS === 'web') {
    return <View style={styles.placeholder} />;
  }

  // In development/Expo Go, show a placeholder
  // In production builds, this will use actual AdMob
  try {
    const {
      BannerAd: GoogleBanner,
      BannerAdSize,
      TestIds,
    } = require('react-native-google-mobile-ads');
    const adUnitId = __DEV__ ? TestIds.BANNER : AD_UNIT_IDS.banner;

    if (!adUnitId) {
      return <View style={styles.placeholder} />;
    }

    return (
      <View style={styles.container}>
        <GoogleBanner
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(error: any) => {
            if (__DEV__) {
              console.warn('Banner ad failed to load:', error);
            }
          }}
        />
      </View>
    );
  } catch {
    // Fallback for Expo Go - render nothing
    return <View style={styles.placeholder} />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  placeholder: {
    height: 0, // No space taken in Expo Go
  },
});
