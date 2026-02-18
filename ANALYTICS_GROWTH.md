# HabitFlow - Analytics & Growth Plan

## Analytics Implementation

### Firebase Analytics Events

| Event Name | Parameters | Trigger |
|-----------|-----------|---------|
| `onboarding_start` | - | User opens app first time |
| `onboarding_quiz_complete` | `motivation_type` | Quiz finished |
| `onboarding_habit_created` | `template_name` | First habit created |
| `onboarding_complete` | `duration_seconds` | Reaches dashboard |
| `habit_created` | `name, frequency, has_reminder` | Any habit created |
| `habit_completed` | `habit_id, streak_length` | Checkbox tapped |
| `habit_skipped` | `habit_id, context_tag` | Skip with reason |
| `habit_paused` | `habit_id, duration_days` | Pause activated |
| `habit_deleted` | `habit_id, days_active` | Habit removed |
| `insight_viewed` | `insight_type` | Insights tab opened |
| `rewarded_ad_started` | - | User taps "watch ad" |
| `rewarded_ad_completed` | - | Ad watched fully |
| `theme_changed` | `theme` | Dark/light switched |
| `data_exported` | `format` | JSON export |

### Funnel Tracking

**Activation Funnel:**
1. App Install → App Open (100%)
2. App Open → Onboarding Start (95%)
3. Onboarding Start → First Habit Created (80%)
4. First Habit Created → First Completion (70%)
5. First Completion → Day 7 Return (50%)
6. Day 7 Return → Day 30 Return (35%)

**Daily Engagement Funnel:**
1. App Open → View Today's Habits (100%)
2. View Habits → Complete 1+ Habit (75%)
3. Complete 1+ → Complete All (40%)
4. Complete All → View Insights (20%)

### Retention Cohort Analysis
- D1, D7, D14, D30, D60, D90 retention
- Segmented by: motivation type, number of habits, ad interaction

### Key Metrics Dashboard
- **DAU / WAU / MAU**
- **Avg Habits Per User**
- **Avg Completion Rate**
- **Flex Streak Distribution**
- **Ad Revenue Per User (ARPU)**
- **Rewarded Ad Opt-in Rate**

## Crash Reporting
Firebase Crashlytics integration (Phase 2):
- Automatic crash reports
- Non-fatal error logging for database operations
- ANR detection (Android)
- User breadcrumbs for reproduction

## A/B Testing Plan

### Test 1: Onboarding Length
- **Variant A**: Full quiz (3 questions)
- **Variant B**: Single question + habit creation
- **Metric**: D7 retention

### Test 2: Interstitial Frequency
- **Variant A**: Every 5 completions
- **Variant B**: Every 8 completions
- **Metric**: Revenue vs D30 retention

### Test 3: Flex Streak Ring vs Progress Bar
- **Variant A**: Circular ring (current)
- **Variant B**: Linear progress bar
- **Metric**: Daily completion rate

---

## ASO (App Store Optimization)

### Keywords
Primary: habit tracker, habit building, daily habits, routine tracker
Secondary: streak tracker, self improvement, productivity, wellness
Long-tail: habit tracker without guilt, flex streak, gentle habit app

### App Store Title
**HabitFlow: Build Habits That Stick**

### App Store Subtitle (iOS)
**Progress Over Perfection**

### Short Description (Android)
Build lasting habits without guilt. Flex Streaks™ celebrate consistency, not perfection.

### Full Description

> Tired of habit apps that make you feel guilty? HabitFlow is different.
>
> Built on behavioral psychology research, HabitFlow replaces punishing
> streak counters with Flex Streaks™ — a forgiving consistency system that
> celebrates progress over perfection.
>
> KEY FEATURES:
> - Flex Streaks™ — 7/30/90-day consistency rings
> - Smart Context System — tag why you missed, not just that you missed
> - Implementation Intentions — "After I ___, I will ___" planning
> - Pause Mode — take breaks without losing progress
> - Weekly Insights — discover your patterns and strengths
> - Beautiful, calm design — no aggressive red X's
> - 100% offline — your data stays on your device
>
> START SMALL:
> HabitFlow limits you to 3 habits initially. Build consistency first,
> then unlock more. This science-backed approach actually works.
>
> BUILT FOR REAL HUMANS:
> We know life is messy. Travel happens. Sick days happen. HabitFlow
> understands context and adjusts accordingly.
>
> Download HabitFlow and build habits that actually stick.

### Screenshot Strategy (5 screens)
1. Dashboard with progress ring and habit cards
2. Flex Streak rings (7/30/90 day view)
3. Context tag selection ("Why did you skip?")
4. Weekly insights with habit strengths
5. Onboarding "Build habits without guilt"

---

## User Acquisition Plan

### Organic (Phase 1-2)
1. **Content Marketing**: Blog posts on habit science, SEO-optimized
2. **Reddit**: r/getdisciplined, r/habits, r/productivity (genuine value)
3. **Product Hunt Launch**: Coordinate for maximum visibility
4. **App Store Optimization**: Keywords, screenshots, ratings prompt

### Paid (Phase 3)
1. **Apple Search Ads**: Target competitor keywords
2. **Google UAC**: Universal App Campaigns
3. **Instagram/TikTok**: Short-form video content ("How I built habits")
4. **Podcast Sponsorships**: Wellness and productivity podcasts

### Referral
- "Invite a friend" feature (Phase 2)
- Shared accountability links
- Word of mouth (target: 40% organic growth)

### Influencer Partnership
- Micro-influencers (10K-100K followers) in wellness space
- Free premium access for authentic reviews
- Target: 5 partnerships per month

---

## Release Checklist

### Pre-Launch
- [ ] All critical tests passing
- [ ] Performance profiling (60fps, <3s cold start)
- [ ] AdMob production IDs configured
- [ ] Firebase Analytics verified
- [ ] App Store screenshots created
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured
- [ ] Social media accounts created

### Launch Day
- [ ] Submit to App Store (allow 1-3 days for review)
- [ ] Submit to Play Store (allow 1-2 days)
- [ ] Product Hunt submission ready
- [ ] Twitter/X announcement
- [ ] Reddit posts in relevant subreddits
- [ ] Email to beta testers

### Post-Launch
- [ ] Monitor crash reports hourly for first 48h
- [ ] Respond to all App Store reviews
- [ ] Track D1, D3, D7 retention
- [ ] Monitor ad revenue and fill rates
- [ ] Gather user feedback for Phase 2 priorities
