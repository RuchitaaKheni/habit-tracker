# HabitFlow - Deployment Guide

## Prerequisites

### Accounts Required
1. **Expo Account** — https://expo.dev (free)
2. **Apple Developer Account** — https://developer.apple.com ($99/year)
3. **Google Play Console** — https://play.google.com/console ($25 one-time)
4. **Google AdMob Account** — https://admob.google.com (free)
5. **Firebase Project** — https://console.firebase.google.com (free)

### Tools Required
```bash
npm install -g eas-cli
eas login
```

---

## Step 1: Configure AdMob

1. Create app in Google AdMob Console
2. Create ad units:
   - Banner Ad Unit (for dashboard, insights, habit detail)
   - Interstitial Ad Unit (between habit completions)
   - Rewarded Ad Unit (unlock insights)
3. Get your App IDs:
   - Android App ID: `ca-app-pub-XXXXX~XXXXX`
   - iOS App ID: `ca-app-pub-XXXXX~XXXXX`
4. Update `app.json` → plugins → react-native-google-mobile-ads
5. Update ad unit IDs in:
   - `src/components/ads/BannerAd.tsx`
   - `src/components/ads/InterstitialAd.tsx`
   - `src/components/ads/RewardedAd.tsx`

## Step 2: Configure Firebase

1. Create Firebase project
2. Add Android app → Download `google-services.json` → Place in project root
3. Add iOS app → Download `GoogleService-Info.plist` → Place in project root
4. Enable Analytics in Firebase Console

## Step 3: Configure EAS

```bash
# Initialize EAS project
eas init

# This updates app.json with your project ID
```

Update `eas.json` with:
- Your Apple ID and Team ID (iOS)
- Your Google Play service account key path (Android)

## Step 4: Build for Android

### Development Build
```bash
eas build --platform android --profile development
```

### Preview (APK for testing)
```bash
eas build --platform android --profile preview
```

### Production (AAB for Play Store)
```bash
eas build --platform android --profile production
```

### Submit to Google Play
```bash
# First submission: Upload AAB manually via Play Console
# Subsequent updates:
eas submit --platform android --profile production
```

### Play Store Listing
1. App name: **HabitFlow: Build Habits That Stick**
2. Short description: (see ANALYTICS_GROWTH.md)
3. Full description: (see ANALYTICS_GROWTH.md)
4. Screenshots: 5+ phone screenshots, 1+ tablet screenshot
5. Feature graphic: 1024x500px
6. Content rating: IARC questionnaire (Everyone / 4+)
7. Privacy policy URL: `https://habitflow.app/privacy`
8. Ads declaration: Contains ads (banner, interstitial, rewarded)

### Signing Keys
- EAS manages signing keys automatically
- Download keystore backup from Expo dashboard for safekeeping
- Store in secure location (NOT in git)

## Step 5: Build for iOS

### Development Build
```bash
eas build --platform ios --profile development
```

### Production Build
```bash
eas build --platform ios --profile production
```

### Submit to App Store
```bash
eas submit --platform ios --profile production
```

### App Store Connect Setup
1. Create App Store listing
2. App name: **HabitFlow**
3. Subtitle: **Build Habits That Stick**
4. Keywords: habit tracker, streak, routine, wellness, productivity
5. Screenshots: 6.7" (iPhone 15), 6.5" (iPhone 14), iPad Pro
6. Age rating: 4+
7. Privacy: Data not collected / Data not linked to user
8. In-App Purchases: None
9. Advertising: Yes (AdMob)

## Step 6: CI/CD with GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build & Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile production --non-interactive
```

## Step 7: OTA Updates

For minor bug fixes (no native code changes):
```bash
npx expo publish
```

For updates that change native code:
```bash
eas build --platform all --profile production
eas submit --platform all
```

---

## Post-Deployment Monitoring

### Day 1-3
- Monitor Firebase Crashlytics every few hours
- Check AdMob dashboard for fill rates
- Respond to all app store reviews
- Watch D1 retention in Firebase Analytics

### Week 1
- Review crash-free percentage (target: 99.5%+)
- Check ad revenue per daily active user
- Review user funnel: install → onboard → first completion
- Monitor app store ratings

### Month 1
- D30 retention analysis
- Revenue report
- Feature usage analytics
- Plan Phase 2 priorities based on data

---

## Rollback Plan

If a critical bug is found post-release:

### For JS-only bugs (most common):
```bash
# Publish OTA update immediately
npx expo publish
```

### For native crashes:
1. Revert git commit
2. Rebuild: `eas build --platform all --profile production`
3. Fast-track submission to stores
4. Use phased rollout (Android: 10% → 25% → 50% → 100%)

### Emergency contacts:
- Expo status: https://status.expo.dev
- Firebase status: https://status.firebase.google.com
- AdMob support: Google AdMob Help Center
