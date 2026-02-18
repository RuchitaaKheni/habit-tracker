import { HabitTemplate } from '../types/habit';

export const habitTemplates: HabitTemplate[] = [
  {
    name: 'Drink Water',
    icon: '💧',
    color: '#0EA5E9',
    category: 'Health',
    defaultCue: 'After I wake up',
    defaultAction: 'I will drink a glass of water',
  },
  {
    name: 'Exercise',
    icon: '🏋️',
    color: '#22C55E',
    category: 'Fitness',
    defaultCue: 'After I finish my morning coffee',
    defaultAction: 'I will exercise for 20 minutes',
  },
  {
    name: 'Read',
    icon: '📖',
    color: '#8B5CF6',
    category: 'Learning',
    defaultCue: 'After I get into bed',
    defaultAction: 'I will read for 15 minutes',
  },
  {
    name: 'Meditate',
    icon: '🧘',
    color: '#14B8A6',
    category: 'Mindfulness',
    defaultCue: 'After I sit down at my desk',
    defaultAction: 'I will meditate for 5 minutes',
  },
  {
    name: 'Journal',
    icon: '✍️',
    color: '#F59E0B',
    category: 'Mindfulness',
    defaultCue: 'After I finish dinner',
    defaultAction: 'I will write in my journal for 10 minutes',
  },
  {
    name: 'Walk',
    icon: '🚶',
    color: '#84CC16',
    category: 'Fitness',
    defaultCue: 'After I eat lunch',
    defaultAction: 'I will walk for 15 minutes',
  },
  {
    name: 'Practice Gratitude',
    icon: '🙏',
    color: '#EC4899',
    category: 'Mindfulness',
    defaultCue: 'After I wake up',
    defaultAction: 'I will write 3 things I am grateful for',
  },
  {
    name: 'No Social Media',
    icon: '📱',
    color: '#EF4444',
    category: 'Digital Wellness',
    defaultCue: 'When I feel the urge to scroll',
    defaultAction: 'I will put my phone in another room for 30 minutes',
  },
  {
    name: 'Healthy Eating',
    icon: '🍎',
    color: '#22C55E',
    category: 'Health',
    defaultCue: 'When I prepare a meal',
    defaultAction: 'I will include at least one serving of vegetables',
  },
  {
    name: 'Sleep by 11 PM',
    icon: '😴',
    color: '#6366F1',
    category: 'Health',
    defaultCue: 'When the clock hits 10:30 PM',
    defaultAction: 'I will start my bedtime routine',
  },
  {
    name: 'Take Vitamins',
    icon: '💊',
    color: '#F97316',
    category: 'Health',
    defaultCue: 'After I eat breakfast',
    defaultAction: 'I will take my daily vitamins',
  },
  {
    name: 'Practice Music',
    icon: '🎵',
    color: '#A855F7',
    category: 'Skills',
    defaultCue: 'After I finish my work for the day',
    defaultAction: 'I will practice my instrument for 20 minutes',
  },
];

export const contextTagLabels: Record<string, string> = {
  traveling: '✈️ Traveling',
  sick: '🤒 Sick/Injured',
  special_event: '🎉 Special Event',
  forgot: '💭 Forgot',
  not_motivated: '😔 Not Motivated',
  busy: '⏰ Too Busy',
  custom: '✏️ Other',
};

export const motivationQuizQuestions = [
  {
    question: 'What best describes you?',
    options: [
      { label: 'I want perfect consistency', value: 'perfectionist' as const },
      { label: 'My schedule changes a lot', value: 'flexible' as const },
      { label: 'Show me the data', value: 'analytical' as const },
      { label: 'I need accountability', value: 'social' as const },
    ],
  },
  {
    question: 'When is the best time for your habits?',
    options: [
      { label: 'Morning (6-9 AM)', value: 'morning' },
      { label: 'Midday (11 AM-2 PM)', value: 'midday' },
      { label: 'Evening (5-8 PM)', value: 'evening' },
      { label: 'It varies daily', value: 'varies' },
    ],
  },
  {
    question: 'How many habits do you want to build?',
    options: [
      { label: 'Just 1-2 to start', value: 'few' },
      { label: '3-5 habits', value: 'moderate' },
      { label: '6+ habits', value: 'many' },
      { label: 'Not sure yet', value: 'unsure' },
    ],
  },
];

export const encouragingMessages = [
  "You're building something great!",
  'Progress, not perfection.',
  'Every small step counts.',
  'Consistency beats intensity.',
  "You showed up — that's what matters.",
  'Building one habit at a time.',
  'Small wins lead to big changes.',
  "Trust the process. You've got this.",
];

export const bounceBackMessages = [
  "Welcome back! Let's get back on track today.",
  "Missed a day? No worries — your consistency is what matters.",
  "Life happens. What matters is you're here now.",
  "One missed day barely changes your score. Let's go!",
];
