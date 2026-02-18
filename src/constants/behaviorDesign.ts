export interface LawOfBehaviorChange {
  id: 'obvious' | 'attractive' | 'easy' | 'satisfying';
  title: string;
  subtitle: string;
  question: string;
  appSupport: string[];
}

export interface HabitBenefit {
  title: string;
  description: string;
}

export interface PsychologyPrinciple {
  title: string;
  summary: string;
}

export const lawsOfBehaviorChange: LawOfBehaviorChange[] = [
  {
    id: 'obvious',
    title: '1st Law: Make It Obvious',
    subtitle: 'Design a clear cue so your brain sees the habit automatically.',
    question: 'What will trigger this behavior?',
    appSupport: [
      'Implementation intention fields (After I..., I will...)',
      'Reminder scheduling',
      'Clear frequency and due-day labels',
    ],
  },
  {
    id: 'attractive',
    title: '2nd Law: Make It Attractive',
    subtitle: 'Connect habits to identity and positive emotion.',
    question: 'Why does this habit matter to the person you want to become?',
    appSupport: [
      'Identity-first copy and daily progress framing',
      'Template-based quick starts to reduce friction',
      'Positive reinforcement messages after completion',
    ],
  },
  {
    id: 'easy',
    title: '3rd Law: Make It Easy',
    subtitle: 'Lower activation energy so starting is effortless.',
    question: 'How can you make the first 2 minutes simple?',
    appSupport: [
      'One-tap logging (done/missed/skipped)',
      'Flexible frequency for real schedules',
      'Fast capture from Today and Habit Detail screens',
    ],
  },
  {
    id: 'satisfying',
    title: '4th Law: Make It Satisfying',
    subtitle: 'Immediate evidence of progress keeps behavior repeating.',
    question: 'What instant win will you feel after doing it?',
    appSupport: [
      'Completion states and activity history',
      'Consistency and streak visualizations',
      'Progress rings and supportive feedback',
    ],
  },
];

export const habitBenefits: HabitBenefit[] = [
  {
    title: 'Reduce Decision Fatigue',
    description: 'Automatic routines free mental energy for higher-value work.',
  },
  {
    title: 'Build Identity Confidence',
    description: 'Repeated actions become evidence for who you are becoming.',
  },
  {
    title: 'Compounding Gains',
    description: 'Small daily improvements accumulate into major long-term results.',
  },
  {
    title: 'Better Stress Resilience',
    description: 'Stable routines protect focus and mood during chaotic periods.',
  },
];

export const psychologyPrinciples: PsychologyPrinciple[] = [
  {
    title: 'Cue -> Craving -> Response -> Reward',
    summary:
      'Habits run as loops. Design strong cues, simple responses, and immediate rewards.',
  },
  {
    title: 'Environment Beats Willpower',
    summary:
      'Behavior is easier when cues are visible and friction is removed from good choices.',
  },
  {
    title: 'Identity-Based Habits',
    summary:
      'Focus on becoming the type of person who does the behavior, not chasing short-term outcomes.',
  },
  {
    title: 'Never Miss Twice',
    summary:
      'Slips are normal. Recovery speed matters more than perfection.',
  },
];

export const habitFlowPrinciples = [
  'Progress over perfection with flexible consistency scoring',
  'Compassionate skips/pauses to reduce shame loops',
  'Frictionless daily tracking with explicit status controls',
  'Actionable feedback via streak and recent activity data',
];
