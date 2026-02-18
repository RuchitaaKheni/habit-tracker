# HabitFlow - UX/UI Design Specification

## Design System

### Theme
- **Light Mode** (default): Clean white backgrounds, soft shadows
- **Dark Mode**: Deep navy (#0F172A), muted accent colors
- Both modes use the same accent palette

### Color Palette
```
Primary:        #0EA5E9 (Sky Blue - calm, trust)
Primary Dark:   #0284C7
Secondary:      #8B5CF6 (Violet - creativity, depth)
Success:        #22C55E (Green - achievement, growth)
Warning:        #F59E0B (Amber - attention, gentle)
Neutral Miss:   #94A3B8 (Slate Gray - non-judgmental)
Celebration:    #FFD700 (Gold - earned rewards)
Background:     #F8FAFC (Light) / #0F172A (Dark)
Surface:        #FFFFFF (Light) / #1E293B (Dark)
Text Primary:   #0F172A (Light) / #F1F5F9 (Dark)
Text Secondary: #64748B (Light) / #94A3B8 (Dark)
```

### Typography
```
Font Family:    Inter (primary), System default fallback
Heading 1:      28px, Bold (700), line-height 36px
Heading 2:      22px, Semibold (600), line-height 28px
Heading 3:      18px, Semibold (600), line-height 24px
Body:           16px, Regular (400), line-height 24px
Body Small:     14px, Regular (400), line-height 20px
Caption:        12px, Medium (500), line-height 16px
```

### Spacing Scale
```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   20px
2xl:  24px
3xl:  32px
4xl:  40px
5xl:  48px
```

### Border Radius
```
sm:   8px
md:   12px
lg:   16px
xl:   20px
full: 9999px
```

### Shadows
```
sm:   0 1px 2px rgba(0,0,0,0.05)
md:   0 4px 6px rgba(0,0,0,0.07)
lg:   0 10px 15px rgba(0,0,0,0.1)
```

---

## Reusable UI Components

1. **HabitCard** - Rounded card with icon, name, streak ring, tap-to-complete
2. **FlexStreakRing** - Circular progress indicator (like Apple Watch rings)
3. **ContextTagPicker** - Horizontal scrollable tag chips
4. **InsightCard** - Gradient-backed card with icon, title, insight text
5. **ProgressBar** - Animated linear progress with percentage
6. **ActionButton** - Primary CTA button with haptic feedback
7. **EmptyState** - Illustration + message + CTA for empty screens
8. **BottomSheet** - Modal bottom sheet for quick actions
9. **Toast** - Non-blocking success/info notifications
10. **StreakBadge** - Achievement badge with animation

---

## Navigation Structure

```
Tab Navigator (Bottom Tabs)
├── Today (Home Dashboard)
│   ├── Habit Detail (Stack)
│   └── Add/Edit Habit (Modal)
├── Insights
│   └── Detailed Report (Stack)
├── Habits (Manage All)
│   ├── Habit Detail (Stack)
│   └── Add/Edit Habit (Modal)
└── Settings
    ├── Notifications
    ├── Theme
    ├── Data Export
    └── About

Onboarding (Stack - shown once)
├── Welcome
├── Personality Quiz
├── Create First Habit
└── Widget Setup Guide
```

---

## Screen-by-Screen UX Breakdown

### 1. Splash Screen
- App logo with subtle pulse animation
- Transition to onboarding (first launch) or home (returning user)

### 2. Onboarding Flow (4 screens, < 2 minutes)

**Screen 2a: Welcome**
- Large friendly illustration (person growing a plant)
- Headline: "Build habits that stick — without the guilt"
- Subtext: "Progress over perfection"
- CTA: "Get Started" button
- Skip option in top-right

**Screen 2b: Motivation Style Quiz**
- "What best describes you?" with 4 cards:
  - "I want perfect consistency" → Perfectionist
  - "My schedule changes a lot" → Flexible
  - "Show me the data" → Analytical
  - "I need accountability" → Social
- Single selection, auto-advances
- 3 more quick questions about goals and preferred times

**Screen 2c: Create First Habit**
- Guided wizard: "What's one small habit you want to build?"
- Preset suggestions: Exercise, Meditate, Read, Drink Water, Journal
- OR custom text input
- Follow-up: "When will you do this?" with time picker
- Implementation intention: "After I ___, I will ___"

**Screen 2d: Setup Complete**
- Confetti animation
- "You're all set! Let's make today count."
- CTA: "Go to Dashboard"
- Note: Widget setup suggestion (dismissible)

### 3. Home Dashboard (Today Tab)

**Layout:**
```
┌──────────────────────────────┐
│ Header: "Good morning, User"  │
│ Date + Motivational quote     │
├──────────────────────────────┤
│ Progress Ring (today's %)     │
│ "4 of 6 habits completed"    │
├──────────────────────────────┤
│ ┌─ Habit Card ─────────────┐ │
│ │ ○ Meditate 10min    ✓    │ │
│ │   7d: 86% | After coffee │ │
│ └──────────────────────────┘ │
│ ┌─ Habit Card ─────────────┐ │
│ │ ○ Exercise 30min         │ │
│ │   7d: 71% | Morning      │ │
│ └──────────────────────────┘ │
│ ... more habits ...          │
├──────────────────────────────┤
│ [+ Add Habit] FAB            │
├──────────────────────────────┤
│ ═══ Banner Ad ═══            │
├──────────────────────────────┤
│ [Today] [Insights] [Habits] [Settings] │
└──────────────────────────────┘
```

**States:**
- **Empty**: Illustration + "Create your first habit" CTA
- **Loading**: Skeleton cards with shimmer
- **All Complete**: Celebration banner with confetti
- **Partial**: Progress ring shows percentage, uncompleted habits highlighted

**Interactions:**
- Tap habit checkbox → haptic feedback + completion animation
- Long-press habit → context menu (edit, pause, skip with reason)
- Swipe left → quick context tag selection
- Pull-to-refresh → updates date if midnight passed

### 4. Habit Detail Screen

**Layout:**
```
┌──────────────────────────────┐
│ ← Back           [Edit] [...] │
├──────────────────────────────┤
│ Icon + Habit Name             │
│ Implementation intention      │
├──────────────────────────────┤
│ Flex Streak Rings             │
│ [7d: 86%] [30d: 73%] [90d: -]│
├──────────────────────────────┤
│ Calendar Heatmap (30 days)    │
│ ● completed  ○ missed  ◐ paused│
├──────────────────────────────┤
│ Current Streak: 5 days        │
│ Best Streak: 12 days          │
│ Total Completions: 47         │
├──────────────────────────────┤
│ Recent Activity               │
│ Today - Completed at 7:23 AM  │
│ Yesterday - Completed         │
│ 2 days ago - Skipped (Travel) │
├──────────────────────────────┤
│ ═══ Banner Ad ═══             │
└──────────────────────────────┘
```

### 5. Add/Edit Habit (Modal Screen)

**Sections:**
1. Habit name (text input with suggestions)
2. Icon picker (emoji grid)
3. Color picker (preset palette)
4. Frequency: Daily / Weekdays / Custom days / Flexible (X per week)
5. Implementation intention: "After I ___, I will ___"
6. Reminder time + notification toggle
7. Context tags (Home, Work, Gym, etc.)
8. Save / Delete buttons

### 6. Insights Tab

**Layout:**
```
┌──────────────────────────────┐
│ This Week's Insights          │
├──────────────────────────────┤
│ ┌─ Insight Card ────────────┐ │
│ │ 📈 Your consistency is up │ │
│ │ 73% → 81% this week      │ │
│ └──────────────────────────┘ │
│ ┌─ Insight Card ────────────┐ │
│ │ 🏆 Best day: Tuesday     │ │
│ │ You complete 92% on Tues  │ │
│ └──────────────────────────┘ │
│ ┌─ Insight Card ────────────┐ │
│ │ ⚡ Habit strength growing │ │
│ │ Meditation: Strong (86%)  │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Overall Stats                 │
│ Total habits: 6               │
│ Avg consistency: 74%          │
│ Total completions: 234        │
├──────────────────────────────┤
│ ═══ Rewarded Ad Button ═══   │
│ "Watch to unlock full report" │
└──────────────────────────────┘
```

### 7. Habits Management Tab

- List of all habits (active + paused)
- Filter: All / Active / Paused / Archived
- Reorder by drag-and-drop
- Each card shows name, streak ring, frequency
- Tap → Habit Detail
- FAB → Add New Habit

### 8. Settings Screen

- **Profile**: Name, avatar, motivation type
- **Appearance**: Light/Dark/System theme
- **Notifications**: Global toggle, quiet hours, reminder style
- **Data**: Export (JSON/CSV), clear data, storage info
- **About**: Version, privacy policy, terms, support email
- **Rate Us**: Link to app store

---

## User Journey Flows

### Flow 1: First-Time User
Splash → Welcome → Quiz → Create Habit → Dashboard → Complete Habit → Celebration

### Flow 2: Daily Check-In (< 30 seconds)
Notification → Open App → See Today's Habits → Tap to Complete → Close

### Flow 3: Missed Day Recovery
Open App → See Missed Habits → Swipe for Context Tag → Select "Traveling" → See Adjusted Streak → Feel OK

### Flow 4: Pause Mode
Habit Detail → "..." Menu → Pause Habit → Select Duration → Confirm → Habit Grayed Out

### Flow 5: Weekly Review
Monday Notification → Open Insights → Review Week → See Patterns → Adjust Habits

---

## Accessibility Best Practices
- Minimum touch targets: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Screen reader labels on all interactive elements
- Reduced motion mode (disable animations)
- Dynamic font scaling support
- Haptic feedback for completions (with toggle to disable)

---

## Error States
- **Network Error**: "Working offline — your data is saved locally"
- **Database Error**: "Something went wrong. Your data is safe." + retry button
- **Notification Permission Denied**: Inline banner explaining benefits
- **Storage Full**: Warning banner with cleanup suggestions

## Loading States
- Skeleton screens with shimmer animation (no spinners)
- Progressive loading: header first, then habit cards

## Empty States
- **No Habits**: Friendly illustration + "Create your first habit" with arrow pointing to FAB
- **No Insights Yet**: "Track for 7 days to see your first insights" with progress bar
- **No Completions Today**: "Ready to make today count?" with habit list
