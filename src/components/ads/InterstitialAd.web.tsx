/**
 * Web fallback for interstitial ads.
 * AdMob native SDK is unavailable on web.
 */
export async function loadInterstitial(): Promise<void> {
  return;
}

export async function maybeShowInterstitial(): Promise<void> {
  return;
}
