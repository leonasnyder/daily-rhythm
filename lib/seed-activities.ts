export interface SeedActivity {
  name: string;
  description: string | null;
  category: string | null;
  color: string;
  is_default: number;
  defaults: { time: string; duration: number; days: string | null }[];
  sub_activities: string[];
}

export const SEED_ACTIVITIES: SeedActivity[] = [

  // ── Morning Routine ──────────────────────────────────────────────
  {
    name: 'Morning Routine',
    description: 'Start the day strong with a consistent morning ritual',
    category: 'Morning',
    color: '#f59e0b',
    is_default: 1,
    defaults: [{ time: '06:30', duration: 45, days: '1,2,3,4,5' }],
    sub_activities: [
      'Wake up', 'Make the bed', 'Brush teeth', 'Shower', 'Get dressed',
      'Morning prayer / devotional', 'Read Bible', 'Gratitude journal',
      'Drink a glass of water', 'Take vitamins', 'Eat breakfast',
    ],
  },
  {
    name: 'Morning Prayer & Devotional',
    description: 'Quiet time with God to start the day',
    category: 'Faith',
    color: '#a855f7',
    is_default: 1,
    defaults: [{ time: '06:00', duration: 20, days: null }],
    sub_activities: ['Read Bible', 'Prayer journal', 'Devotional reading', 'Worship music', 'Gratitude list'],
  },

  // ── Exercise & Fitness ───────────────────────────────────────────
  {
    name: 'Morning Walk',
    description: '30-minute walk to start the day with movement',
    category: 'Health & Fitness',
    color: '#22c55e',
    is_default: 1,
    defaults: [{ time: '07:00', duration: 30, days: '1,2,3,4,5' }],
    sub_activities: [],
  },
  {
    name: 'Gym Workout',
    description: 'Strength training and cardio at the gym',
    category: 'Health & Fitness',
    color: '#8b5cf6',
    is_default: 0,
    defaults: [{ time: '06:00', duration: 60, days: '1,3,5' }],
    sub_activities: [
      'Warm-up stretch', 'Treadmill / cardio', 'Chest press', 'Shoulder press',
      'Lat pulldown', 'Bicep curls', 'Tricep pushdowns', 'Leg press',
      'Core / planks', 'Cool-down stretch',
    ],
  },
  {
    name: 'Yoga / Stretching',
    description: 'Flexibility and mindfulness through yoga',
    category: 'Health & Fitness',
    color: '#06b6d4',
    is_default: 0,
    defaults: [{ time: '07:00', duration: 30, days: null }],
    sub_activities: ['Breathing exercises', 'Sun salutation', 'Warrior poses', 'Child\'s pose', 'Savasana'],
  },
  {
    name: 'Run / Jog',
    description: 'Outdoor run for cardio and mental clarity',
    category: 'Health & Fitness',
    color: '#f97316',
    is_default: 0,
    defaults: [{ time: '06:30', duration: 30, days: '1,3,5' }],
    sub_activities: [],
  },

  // ── Work & Productivity ──────────────────────────────────────────
  {
    name: 'Work / Focus Block',
    description: 'Deep work session — most important tasks first',
    category: 'Work',
    color: '#3b82f6',
    is_default: 1,
    defaults: [{ time: '09:00', duration: 120, days: '1,2,3,4,5' }],
    sub_activities: [
      'Review top 3 priorities', 'Email triage', 'Deep focus task',
      'Meetings', 'Follow-ups', 'Project work',
    ],
  },
  {
    name: 'Morning Planning',
    description: 'Review schedule, set priorities, plan the day',
    category: 'Work',
    color: '#0ea5e9',
    is_default: 1,
    defaults: [{ time: '08:30', duration: 15, days: '1,2,3,4,5' }],
    sub_activities: ['Check calendar', 'Review to-do list', 'Set top 3 priorities', 'Check email'],
  },
  {
    name: 'Lunch Break',
    description: 'Step away from work, eat well, recharge',
    category: 'Meals',
    color: '#84cc16',
    is_default: 1,
    defaults: [{ time: '12:00', duration: 45, days: '1,2,3,4,5' }],
    sub_activities: ['Make lunch', 'Eat away from desk', 'Short walk', 'Rest'],
  },

  // ── Meals ────────────────────────────────────────────────────────
  {
    name: 'Breakfast',
    description: 'Nutritious morning meal to fuel the day',
    category: 'Meals',
    color: '#fbbf24',
    is_default: 0,
    defaults: [{ time: '07:30', duration: 20, days: null }],
    sub_activities: ['Cook eggs', 'Make oatmeal', 'Smoothie', 'Toast', 'Coffee / tea'],
  },
  {
    name: 'Family Dinner',
    description: 'Sit-down dinner together as a family',
    category: 'Family',
    color: '#f97316',
    is_default: 1,
    defaults: [{ time: '18:00', duration: 60, days: null }],
    sub_activities: [
      'Cook dinner', 'Set the table', 'Eat together', 'Family conversation',
      'Clean up dishes', 'Family devotional',
    ],
  },
  {
    name: 'Meal Prep',
    description: 'Prepare meals and snacks for the week ahead',
    category: 'Meals',
    color: '#a3e635',
    is_default: 0,
    defaults: [{ time: '16:00', duration: 90, days: '0' }],
    sub_activities: [
      'Plan the week\'s meals', 'Grocery list', 'Chop vegetables', 'Cook grains',
      'Prepare proteins', 'Pack lunches', 'Store in containers',
    ],
  },

  // ── Household ────────────────────────────────────────────────────
  {
    name: 'Household Tasks',
    description: 'Daily tidying and household chores',
    category: 'Home',
    color: '#4ade80',
    is_default: 1,
    defaults: [{ time: '09:00', duration: 30, days: '1,2,3,4,5' }],
    sub_activities: [
      'Make the bed', 'Wash dishes', 'Wipe counters', 'Vacuum / sweep',
      'Laundry', 'Take out trash', 'Tidy living room',
    ],
  },
  {
    name: 'Yard Work',
    description: 'Outdoor home maintenance and gardening',
    category: 'Home',
    color: '#16a34a',
    is_default: 0,
    defaults: [{ time: '09:00', duration: 60, days: '6' }],
    sub_activities: [
      'Mow the lawn', 'Edge sidewalks', 'Pull weeds', 'Water plants / garden',
      'Sweep porch / patio', 'Trim hedges', 'Rake leaves',
    ],
  },

  // ── Family ───────────────────────────────────────────────────────
  {
    name: 'Family Devotional',
    description: 'Bible reading and prayer together as a family',
    category: 'Faith',
    color: '#c084fc',
    is_default: 1,
    defaults: [{ time: '19:00', duration: 20, days: null }],
    sub_activities: [
      'Bible reading', 'Discuss scripture', 'Family prayer', 'Worship song',
    ],
  },
  {
    name: 'Kids\' Activities',
    description: 'Helping kids with homework, activities, or play',
    category: 'Family',
    color: '#fb923c',
    is_default: 0,
    defaults: [{ time: '15:30', duration: 90, days: '1,2,3,4,5' }],
    sub_activities: [
      'Homework help', 'Drive to activities', 'Reading together',
      'Outdoor play', 'Creative play', 'Snack time',
    ],
  },
  {
    name: 'Date Night',
    description: 'Quality time with your spouse / partner',
    category: 'Family',
    color: '#f43f5e',
    is_default: 0,
    defaults: [{ time: '19:00', duration: 120, days: '5' }],
    sub_activities: [
      'Dinner out', 'Movie', 'Walk together', 'Game night', 'Cook together',
    ],
  },

  // ── Self-Care & Rest ─────────────────────────────────────────────
  {
    name: 'Evening Wind-Down',
    description: 'Relax and prepare the mind and body for restful sleep',
    category: 'Evening',
    color: '#818cf8',
    is_default: 1,
    defaults: [{ time: '21:00', duration: 30, days: null }],
    sub_activities: [
      'Evening prayer', 'Read a book', 'No screens', 'Herbal tea',
      'Skincare routine', 'Set out tomorrow\'s clothes', 'Set alarm',
    ],
  },
  {
    name: 'Self-Care',
    description: 'Rest, recharge, and care for yourself',
    category: 'Health & Fitness',
    color: '#e879f9',
    is_default: 0,
    defaults: [{ time: '14:00', duration: 30, days: null }],
    sub_activities: [
      'Take a bath', 'Nap', 'Massage', 'Journaling', 'Read for pleasure',
      'Listen to music', 'Spend time outdoors',
    ],
  },

  // ── Church & Faith ───────────────────────────────────────────────
  {
    name: 'Church Service',
    description: 'Attend Sunday morning worship service',
    category: 'Faith',
    color: '#7c3aed',
    is_default: 1,
    defaults: [{ time: '09:30', duration: 90, days: '0' }],
    sub_activities: [
      'Get ready', 'Drive to church', 'Worship service', 'Sunday school',
      'Fellowship time', 'Drive home',
    ],
  },
  {
    name: 'Bible Study / Small Group',
    description: 'Weekly group Bible study and fellowship',
    category: 'Faith',
    color: '#9333ea',
    is_default: 0,
    defaults: [{ time: '19:00', duration: 90, days: '3' }],
    sub_activities: [
      'Review study notes', 'Small group discussion', 'Prayer time', 'Fellowship',
    ],
  },

  // ── Personal Growth ──────────────────────────────────────────────
  {
    name: 'Reading',
    description: 'Read a book — personal growth, faith, or enjoyment',
    category: 'Personal Growth',
    color: '#0891b2',
    is_default: 0,
    defaults: [{ time: '21:00', duration: 30, days: null }],
    sub_activities: [],
  },
  {
    name: 'Journaling',
    description: 'Write, reflect, and process thoughts',
    category: 'Personal Growth',
    color: '#d97706',
    is_default: 0,
    defaults: [{ time: '07:00', duration: 15, days: null }],
    sub_activities: [
      'Gratitude list', 'Reflect on yesterday', 'Prayer journal',
      'Goals for today', 'One thing I\'m believing God for',
    ],
  },

  // ── Recreation & Fun ─────────────────────────────────────────────
  {
    name: 'Recreation / Fun',
    description: 'Hobbies, sports, or anything you enjoy',
    category: 'Recreation',
    color: '#0056d6',
    is_default: 0,
    defaults: [{ time: '15:00', duration: 60, days: '6' }],
    sub_activities: [
      'Bike ride', 'Tennis / pickleball', 'Golf', 'Hiking', 'Swimming',
      'Board games', 'Movie', 'Cooking a new recipe', 'Art / crafts',
    ],
  },
  {
    name: 'Family Fun Day',
    description: 'A fun outing or activity as a whole family',
    category: 'Family',
    color: '#f59e0b',
    is_default: 0,
    defaults: [{ time: '10:00', duration: 180, days: '6' }],
    sub_activities: [
      'Park', 'Beach', 'Hiking trail', 'Museum', 'Bowling', 'Picnic',
      'Farmers market', 'Movie theater', 'Backyard cookout',
    ],
  },
];
