import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdState {
  interstitialCounter: number;
  lastInterstitialTime: number;
  sessionInterstitialsShown: number;
  totalAdsShown: number;
  rewardedAdsWatched: number;
  incrementInterstitialCounter: () => void;
  shouldShowInterstitial: () => boolean;
  resetInterstitialCounter: () => void;
  recordRewardedAd: () => void;
  loadAdState: () => Promise<void>;
  saveAdState: () => Promise<void>;
}

// Show interstitial every 5 habit completions, with minimum 3 minutes between
const INTERSTITIAL_INTERVAL = 5;
const MIN_INTERSTITIAL_GAP_MS = 3 * 60 * 1000; // 3 minutes
const MAX_INTERSTITIALS_PER_SESSION = 3;

export const useAdStore = create<AdState>((set, get) => ({
  interstitialCounter: 0,
  lastInterstitialTime: 0,
  sessionInterstitialsShown: 0,
  totalAdsShown: 0,
  rewardedAdsWatched: 0,

  incrementInterstitialCounter: () => {
    set((state) => ({ interstitialCounter: state.interstitialCounter + 1 }));
  },

  shouldShowInterstitial: () => {
    const { interstitialCounter, lastInterstitialTime } = get();
    const now = Date.now();
    return (
      interstitialCounter >= INTERSTITIAL_INTERVAL &&
      now - lastInterstitialTime > MIN_INTERSTITIAL_GAP_MS &&
      get().sessionInterstitialsShown < MAX_INTERSTITIALS_PER_SESSION
    );
  },

  resetInterstitialCounter: () => {
    set((state) => ({
      interstitialCounter: 0,
      lastInterstitialTime: Date.now(),
      sessionInterstitialsShown: state.sessionInterstitialsShown + 1,
      totalAdsShown: state.totalAdsShown + 1,
    }));
    get().saveAdState();
  },

  recordRewardedAd: () => {
    set((state) => ({
      rewardedAdsWatched: state.rewardedAdsWatched + 1,
      totalAdsShown: state.totalAdsShown + 1,
    }));
    get().saveAdState();
  },

  loadAdState: async () => {
    try {
      const data = await AsyncStorage.getItem('ad_state');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          lastInterstitialTime: parsed.lastInterstitialTime || 0,
          totalAdsShown: parsed.totalAdsShown || 0,
          rewardedAdsWatched: parsed.rewardedAdsWatched || 0,
        });
      }
    } catch (e) {
      console.warn('Failed to load ad state:', e);
    }
  },

  saveAdState: async () => {
    try {
      const { totalAdsShown, rewardedAdsWatched, lastInterstitialTime } = get();
      await AsyncStorage.setItem(
        'ad_state',
        JSON.stringify({ totalAdsShown, rewardedAdsWatched, lastInterstitialTime })
      );
    } catch (e) {
      console.warn('Failed to save ad state:', e);
    }
  },
}));
