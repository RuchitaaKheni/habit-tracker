# HabitFlow - Testing Strategy

## Overview
Testing follows a pyramid approach: many unit tests, fewer integration tests, minimal E2E tests.

## Test Layers

### 1. Unit Tests (Current)
- **Location**: `__tests__/utils/`, `__tests__/store/`
- **Coverage**: Date utilities, streak calculations, insight generation, AI coaching logic
- **Runner**: Jest
- **Target**: 80%+ coverage on utility functions

### 2. Integration Tests (Phase 2)
- **Location**: `__tests__/database/`
- **Coverage**: Database CRUD operations, store + database interaction
- **Approach**: Use in-memory SQLite for fast, isolated tests

### 3. Component Tests (Phase 2)
- **Location**: `__tests__/components/`
- **Coverage**: HabitCard, FlexStreakDisplay, OnboardingScreen
- **Tools**: React Native Testing Library + Jest
- **Focus**: User interactions, accessibility, state changes

### 4. E2E Tests (Phase 3)
- **Tools**: Detox (iOS/Android)
- **Coverage**: Onboarding flow, habit creation, daily check-in, settings
- **Runs**: On CI before release builds

## Edge Cases to Test

### Habit Tracking
- [ ] Creating habit at 11:59 PM (midnight boundary)
- [ ] Timezone changes (user travels)
- [ ] Multiple completions on same day (idempotent)
- [ ] Pausing/resuming habit mid-streak
- [ ] Deleting habit with existing completions

### Flex Streaks
- [ ] Brand new habit (no data)
- [ ] Habit with all days completed
- [ ] Habit with all days missed
- [ ] Habit paused for 2 weeks
- [ ] Weekday-only habits on weekends
- [ ] Custom days with gaps
- [ ] 90-day window with habit created 30 days ago

### Insights
- [ ] Insights with < 7 days of data
- [ ] All habits at 100% consistency
- [ ] All habits at 0% consistency
- [ ] Single habit user
- [ ] User with no active habits

### Onboarding
- [ ] Completing all quiz questions
- [ ] Skipping quiz
- [ ] Creating habit from template
- [ ] Creating custom habit
- [ ] Notification permission denied

### Ads
- [ ] Banner ad fails to load (graceful fallback)
- [ ] Interstitial ad not ready yet
- [ ] Rewarded ad watched but not completed
- [ ] Ad shown during poor connectivity

## Running Tests

```bash
# All tests
npm test

# Specific file
npx jest __tests__/utils/date.test.ts

# With coverage report
npx jest --coverage

# Watch mode
npx jest --watch
```

## CI Integration
Tests run automatically on:
- Pull request creation
- Push to main branch
- Before EAS production builds
