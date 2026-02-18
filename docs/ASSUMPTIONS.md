# HabitFlow - Assumptions & Decisions

## Assumptions Made

### 1. Monetization: Ads Instead of Freemium
- PRD suggests freemium model; user requires **ad-based monetization**
- Decision: Free app with all core features, monetized through Google AdMob
- Ad types: Banner ads (bottom of screens), interstitial (between actions), rewarded (unlock insights)

### 2. Backend Architecture: Local-First
- PRD suggests Node.js/GraphQL backend, but for MVP pragmatism:
- Decision: **Fully local-first** app using SQLite for on-device storage
- No backend server required for Phase 1
- Cloud sync via Firebase in Phase 2+ (optional, not blocking)
- Rationale: Faster to market, better offline support, lower hosting costs, privacy-first

### 3. AI/ML Features: Deferred
- PRD mentions TensorFlow/PyTorch and OpenAI API
- Decision: Phase 1 uses **rule-based pattern recognition** (no ML)
- AI coaching assistant deferred to Phase 3
- Predictive insights use statistical heuristics, not ML models

### 4. Platform: React Native with Expo
- PRD suggests React Native - confirmed
- Using Expo SDK 52 managed workflow for faster development
- Native widgets (iOS/Android) deferred to Phase 2

### 5. Authentication: Not Required for MVP
- Local-only storage means no auth needed initially
- Firebase Auth added in Phase 2 for cloud sync
- Biometric lock (optional) for privacy

### 6. Accountability Partners: Phase 2
- Social features require backend infrastructure
- Deferred to Phase 2 with Firebase Realtime Database

### 7. Wearable Integration: Phase 2
- Apple Health/Google Fit integration requires native modules
- Deferred to Phase 2

### 8. Location-Based Features: Phase 3
- Location-based reminders and auto-detection are complex
- Deferred to Phase 3

### 9. Target Platforms
- Android 8.0+ (API 26+)
- iOS 15.0+
- Both portrait orientation primarily

### 10. App Name
- "HabitFlow" - clean, modern, implies smooth habit building
