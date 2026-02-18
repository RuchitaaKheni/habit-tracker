# HabitFlow - Build Habits That Stick

> The habit tracker that finally gets it — built for real humans. Progress over perfection.

HabitFlow replaces guilt-based streak tracking with **Flex Streaks™** — a compassionate,
context-aware system that celebrates consistency over perfection. Built with behavioral
psychology research at its core.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Type check
npm run lint
```

## Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Framework** | React Native + Expo SDK 54 | Cross-platform, rapid development, OTA updates |
| **Language** | TypeScript | Type safety, better DX, fewer runtime bugs |
| **Navigation** | Expo Router v6 | File-based routing, deep linking support |
| **State** | Zustand | Lightweight (1.1KB), no boilerplate, great perf |
| **Database** | expo-sqlite (SQLite) | Local-first, offline capable, fast queries |
| **Storage** | AsyncStorage | Simple key-value for preferences/settings |
| **Animations** | react-native-reanimated | 60fps native animations, gesture support |
| **Ads** | Google AdMob (react-native-google-mobile-ads) | Industry standard, high fill rates |
| **Analytics** | Firebase Analytics | Free, comprehensive, Google ecosystem |
| **Notifications** | expo-notifications | Cross-platform push notifications |
| **Haptics** | expo-haptics | Native haptic feedback |
| **Icons** | @expo/vector-icons (Ionicons) | 6000+ icons, tree-shakeable |
| **Date** | date-fns | Modular, tree-shakeable, immutable |
| **Charts** | react-native-svg | Custom lightweight charts without heavy libs |
| **CI/CD** | EAS Build + Submit | Expo's native build service |

## Architecture

```
HabitFlow/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (init, onboarding, theme)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Today (home dashboard)
│   │   ├── insights.tsx          # Insights & analytics
│   │   ├── habits.tsx            # Manage all habits
│   │   └── settings.tsx          # App settings
│   └── habit/                    # Habit screens (stack)
│       ├── [id].tsx              # Habit detail
│       ├── create.tsx            # Create new habit
│       └── edit.tsx              # Edit habit
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── SkeletonLoader.tsx
│   │   ├── habits/               # Habit-specific components
│   │   │   ├── HabitCard.tsx
│   │   │   ├── FlexStreakDisplay.tsx
│   │   │   ├── HabitCalendar.tsx
│   │   │   ├── ContextTagSheet.tsx
│   │   │   ├── PauseSheet.tsx
│   │   │   └── MoodTracker.tsx
│   │   ├── insights/             # Insight components
│   │   │   ├── InsightCard.tsx
│   │   │   └── MoodCorrelation.tsx
│   │   ├── ads/                  # Ad components
│   │   │   ├── BannerAd.tsx
│   │   │   ├── InterstitialAd.tsx
│   │   │   └── RewardedAd.tsx
│   │   └── onboarding/
│   │       └── OnboardingScreen.tsx
│   ├── store/                    # Zustand state management
│   │   ├── habitStore.ts
│   │   ├── themeStore.ts
│   │   └── adStore.ts
│   ├── database/                 # SQLite database layer
│   │   ├── schema.ts
│   │   └── database.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useColors.ts
│   │   └── useHaptics.ts
│   ├── utils/                    # Pure utility functions
│   │   ├── date.ts
│   │   ├── streaks.ts
│   │   └── insights.ts
│   ├── services/                 # External service integrations
│   │   ├── notifications.ts
│   │   └── aiCoach.ts
│   ├── constants/                # App constants
│   │   ├── theme.ts
│   │   └── templates.ts
│   └── types/                    # TypeScript types
│       └── habit.ts
├── __tests__/                    # Test files
│   ├── utils/
│   ├── store/
│   └── components/
├── assets/                       # Static assets
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json
└── package.json
```

### State Management Architecture

```
Zustand Stores
├── habitStore     → Habits, completions, profile (backed by SQLite)
├── themeStore     → Light/dark/system theme (backed by AsyncStorage)
└── adStore        → Ad counters, interstitial timing (backed by AsyncStorage)
```

### Data Flow

```
User Action → Zustand Store → SQLite Database
                    ↓
              React Components (via hooks)
                    ↓
              UI Re-render (React Native)
```

## Key Features

### Flex Streaks™
Instead of consecutive-day streaks that punish a single miss, Flex Streaks show
percentage-based consistency over 7, 30, and 90-day rolling windows.
Missing one day only drops your 30-day score by ~3.3%.

### Smart Context System
When logging a skip, users tag the reason (traveling, sick, etc.).
The app adjusts its messaging and excludes paused days from streak calculations.

### Implementation Intentions
Based on BJ Fogg's research: "After I [existing habit], I will [new habit]"
doubles follow-through rates.

### Gradual Onboarding
Users start with max 3 habits. After 2 weeks of 60%+ consistency,
more slots unlock. This prevents the common pattern of starting with
15 habits and abandoning everything.

## Ad Monetization Strategy

| Ad Type | Placement | Frequency | UX Impact |
|---------|-----------|-----------|-----------|
| **Banner** | Bottom of Today, Insights, Habit Detail | Always visible | Low — below the fold |
| **Interstitial** | After every 5 habit completions | Max every 3 minutes | Medium — between actions |
| **Rewarded** | "Unlock full report" on Insights | User-initiated | None — opt-in |

### Ad Policy Compliance
- Uses test IDs during development
- Non-personalized ads by default (GDPR)
- No ads during onboarding or first session
- Minimum 3-minute gap between interstitials
- Rewarded ads are purely optional

## Deployment

### Prerequisites
1. [Expo Account](https://expo.dev) + EAS CLI installed
2. [Google AdMob Account](https://admob.google.com) with app registered
3. [Firebase Project](https://console.firebase.google.com) for analytics
4. Apple Developer Account (iOS) / Google Play Console (Android)

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Replace AdMob test IDs with production IDs
3. Download Firebase config files:
   - `google-services.json` → project root (Android)
   - `GoogleService-Info.plist` → project root (iOS)
4. Update `app.json` with your actual AdMob App IDs

### Versioning Strategy
- **Major**: Breaking changes, major redesigns
- **Minor**: New features, significant enhancements
- **Patch**: Bug fixes, minor improvements
- Auto-incremented by EAS for store submissions

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npx jest --coverage

# Run specific test file
npx jest __tests__/utils/date.test.ts
```

### Test Strategy
- **Unit Tests**: Utility functions (date, streaks, insights)
- **Store Tests**: Business logic in Zustand stores
- **Component Tests**: Key UI components (future with React Native Testing Library)
- **E2E Tests**: Critical flows (future with Detox)

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Metro bundler stuck | `npx expo start --clear` |
| SQLite errors | Delete app data and reinstall |
| Ads not loading | Check AdMob IDs, ensure dev build (not Expo Go) |
| Notifications not working | Check device permissions, use physical device |
| Build fails | Run `npx expo-doctor` to check compatibility |
| TypeScript errors | Run `npm run lint` to see all issues |

## License

MIT License. See LICENSE file.
