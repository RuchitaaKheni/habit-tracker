/**
 * Web fallback for rewarded ads.
 * AdMob native SDK is unavailable on web.
 */
export async function loadRewardedAd(): Promise<void> {
  return;
}

export async function showRewardedAd(): Promise<boolean> {
  return false;
}

export function isRewardedAdReady(): boolean {
  return false;
}
