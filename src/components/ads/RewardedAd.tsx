import { Platform } from 'react-native';
import { useAdStore } from '../../store/adStore';

const REWARDED_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
  default: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
});

let rewardedAd: any = null;
let rewardedLoaded = false;
let rewardedLoading = false;
let rewardedLoadUnsubscribers: Array<() => void> = [];

function cleanupRewardedLoadListeners() {
  rewardedLoadUnsubscribers.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // no-op
    }
  });
  rewardedLoadUnsubscribers = [];
}

/**
 * Load a rewarded ad. The user watches voluntarily to unlock extra insights.
 */
export async function loadRewardedAd(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (rewardedLoading) return;

  try {
    const { RewardedAd, TestIds, AdEventType } = require('react-native-google-mobile-ads');
    const adUnitId = __DEV__ ? TestIds.REWARDED : REWARDED_ID;
    if (!adUnitId) {
      rewardedLoaded = false;
      rewardedLoading = false;
      return;
    }

    rewardedLoading = true;
    rewardedLoaded = false;
    cleanupRewardedLoadListeners();

    rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    await new Promise<void>((resolve) => {
      const onLoaded = rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
        rewardedLoaded = true;
        rewardedLoading = false;
        resolve();
      });

      const onError = rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
        rewardedLoaded = false;
        rewardedLoading = false;
        resolve();
      });

      rewardedLoadUnsubscribers = [onLoaded, onError];
      rewardedAd.load();
    });
  } catch {
    rewardedLoaded = false;
    rewardedLoading = false;
    if (__DEV__) {
      console.warn('Rewarded ads not available (Expo Go)');
    }
  }
}

/**
 * Show a rewarded ad. Returns true if the user earned the reward.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { RewardedAdEventType, AdEventType } = require('react-native-google-mobile-ads');

    if (!rewardedLoaded || !rewardedAd) {
      await loadRewardedAd();
      if (!rewardedLoaded || !rewardedAd) return false;
    }

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const localUnsubscribers: Array<() => void> = [];

      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        localUnsubscribers.forEach((unsubscribe) => {
          try {
            unsubscribe();
          } catch {
            // no-op
          }
        });
        rewardedLoaded = false;
        void loadRewardedAd();
        resolve(result);
      };

      localUnsubscribers.push(
        rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          useAdStore.getState().recordRewardedAd();
          finish(true);
        })
      );

      localUnsubscribers.push(
        rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          finish(false);
        })
      );

      localUnsubscribers.push(
        rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
          finish(false);
        })
      );

      rewardedAd.show();
    });
  } catch {
    if (__DEV__) {
      console.warn('Failed to show rewarded ad');
    }
    return false;
  }
}

export function isRewardedAdReady(): boolean {
  return rewardedLoaded;
}
