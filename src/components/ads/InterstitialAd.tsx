import { Platform } from 'react-native';
import { useAdStore } from '../../store/adStore';

const INTERSTITIAL_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID,
  default: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID,
});

let interstitialLoaded = false;
let interstitialLoading = false;
let interstitialAd: any = null;
let interstitialUnsubscribers: Array<() => void> = [];

function cleanupInterstitialListeners() {
  interstitialUnsubscribers.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // no-op
    }
  });
  interstitialUnsubscribers = [];
}

/**
 * Load an interstitial ad. Call this proactively so the ad is ready when needed.
 */
export async function loadInterstitial(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (interstitialLoading) return;

  try {
    const { InterstitialAd, TestIds, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : INTERSTITIAL_ID;
    if (!adUnitId) {
      interstitialLoading = false;
      interstitialLoaded = false;
      return;
    }

    interstitialLoading = true;
    interstitialLoaded = false;
    cleanupInterstitialListeners();

    interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    await new Promise<void>((resolve) => {
      const onLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded = true;
        interstitialLoading = false;
        resolve();
      });

      const onError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        if (__DEV__) {
          console.warn('Interstitial failed to load:', error);
        }
        interstitialLoaded = false;
        interstitialLoading = false;
        resolve();
      });

      const onClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialLoaded = false;
        interstitialLoading = false;
        // Pre-load next interstitial.
        void loadInterstitial();
      });

      interstitialUnsubscribers = [onLoaded, onError, onClosed];
      interstitialAd.load();
    });
  } catch {
    interstitialLoading = false;
    interstitialLoaded = false;
    if (__DEV__) {
      console.warn('Interstitial ads not available (Expo Go)');
    }
  }
}

/**
 * Show an interstitial ad if conditions are met.
 * Conditions: Counter reached threshold AND minimum time gap passed.
 */
export async function maybeShowInterstitial(): Promise<void> {
  if (Platform.OS === 'web') return;

  const adStore = useAdStore.getState();
  adStore.incrementInterstitialCounter();

  if (!adStore.shouldShowInterstitial()) return;

  try {
    if (!interstitialLoaded || !interstitialAd) {
      await loadInterstitial();
    }

    if (interstitialLoaded && interstitialAd) {
      interstitialAd.show();
      adStore.resetInterstitialCounter();
    }
  } catch {
    if (__DEV__) {
      console.warn('Failed to show interstitial');
    }
  }
}
