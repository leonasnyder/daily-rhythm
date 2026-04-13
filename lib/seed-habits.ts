export interface HabitSeed {
  name: string;
  category: string;
  color: string;
  frequency: 'daily' | 'weekly';
}

export const STARTER_HABITS: HabitSeed[] = [
  // ── Faith & Spiritual Growth ─────────────────────────────────────
  { name: 'Morning Prayer',           category: 'Faith',          color: '#7C3AED', frequency: 'daily'  },
  { name: 'Bible / Scripture Reading', category: 'Faith',         color: '#7C3AED', frequency: 'daily'  },
  { name: 'Devotional or Quiet Time', category: 'Faith',          color: '#7C3AED', frequency: 'daily'  },
  { name: 'Gratitude Journal',        category: 'Faith',          color: '#7C3AED', frequency: 'daily'  },
  { name: 'Evening Prayer',           category: 'Faith',          color: '#7C3AED', frequency: 'daily'  },
  { name: 'Attend Church Service',    category: 'Faith',          color: '#7C3AED', frequency: 'weekly' },
  { name: 'Memorize a Bible Verse',   category: 'Faith',          color: '#7C3AED', frequency: 'weekly' },

  // ── Health & Wellness ────────────────────────────────────────────
  { name: 'Drink 8 Glasses of Water', category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Exercise / Workout',       category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Walk 10,000 Steps',        category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Take Vitamins / Meds',     category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Eat a Healthy Meal',       category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'No Sugar / Junk Food',     category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Stretch or Yoga',          category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Get 7–8 Hours of Sleep',   category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'No Alcohol',               category: 'Health',         color: '#0891B2', frequency: 'daily'  },
  { name: 'Weigh In',                 category: 'Health',         color: '#0891B2', frequency: 'weekly' },

  // ── Mental & Emotional Wellness ──────────────────────────────────
  { name: 'Meditate / Breathwork',    category: 'Mental Wellness', color: '#059669', frequency: 'daily'  },
  { name: 'No Social Media Before Noon', category: 'Mental Wellness', color: '#059669', frequency: 'daily' },
  { name: 'Journal',                  category: 'Mental Wellness', color: '#059669', frequency: 'daily'  },
  { name: 'Read for 20 Minutes',      category: 'Mental Wellness', color: '#059669', frequency: 'daily'  },
  { name: 'Screen-Free Wind Down',    category: 'Mental Wellness', color: '#059669', frequency: 'daily'  },
  { name: 'Practice Deep Breathing',  category: 'Mental Wellness', color: '#059669', frequency: 'daily'  },

  // ── Personal Growth ──────────────────────────────────────────────
  { name: 'Read a Book',              category: 'Personal Growth', color: '#D97706', frequency: 'daily'  },
  { name: 'Learn Something New',      category: 'Personal Growth', color: '#D97706', frequency: 'daily'  },
  { name: 'Work on a Side Project',   category: 'Personal Growth', color: '#D97706', frequency: 'daily'  },
  { name: 'Review Goals',             category: 'Personal Growth', color: '#D97706', frequency: 'weekly' },
  { name: 'Listen to a Podcast',      category: 'Personal Growth', color: '#D97706', frequency: 'daily'  },
  { name: 'Complete an Online Course Lesson', category: 'Personal Growth', color: '#D97706', frequency: 'daily' },

  // ── Relationships ────────────────────────────────────────────────
  { name: 'Quality Time with Spouse / Partner', category: 'Relationships', color: '#DB2777', frequency: 'daily' },
  { name: 'Play with Kids',           category: 'Relationships',  color: '#DB2777', frequency: 'daily'  },
  { name: 'Call or Text a Friend',    category: 'Relationships',  color: '#DB2777', frequency: 'weekly' },
  { name: 'Family Dinner Together',   category: 'Relationships',  color: '#DB2777', frequency: 'daily'  },
  { name: 'Encourage Someone',        category: 'Relationships',  color: '#DB2777', frequency: 'daily'  },
  { name: 'Date Night',               category: 'Relationships',  color: '#DB2777', frequency: 'weekly' },

  // ── Home & Organization ──────────────────────────────────────────
  { name: 'Make the Bed',             category: 'Home',           color: '#65A30D', frequency: 'daily'  },
  { name: 'Tidy Living Areas',        category: 'Home',           color: '#65A30D', frequency: 'daily'  },
  { name: 'Do the Dishes',            category: 'Home',           color: '#65A30D', frequency: 'daily'  },
  { name: 'One Load of Laundry',      category: 'Home',           color: '#65A30D', frequency: 'daily'  },
  { name: 'Declutter One Area',       category: 'Home',           color: '#65A30D', frequency: 'weekly' },

  // ── Finance ──────────────────────────────────────────────────────
  { name: 'Track Spending',           category: 'Finance',        color: '#0F766E', frequency: 'daily'  },
  { name: 'No Unnecessary Purchases', category: 'Finance',        color: '#0F766E', frequency: 'daily'  },
  { name: 'Review Budget',            category: 'Finance',        color: '#0F766E', frequency: 'weekly' },
  { name: 'Transfer to Savings',      category: 'Finance',        color: '#0F766E', frequency: 'weekly' },

  // ── Productivity ─────────────────────────────────────────────────
  { name: 'Complete Top 3 Tasks',     category: 'Productivity',   color: '#4F46E5', frequency: 'daily'  },
  { name: 'Plan Tomorrow the Night Before', category: 'Productivity', color: '#4F46E5', frequency: 'daily' },
  { name: 'Inbox Zero',               category: 'Productivity',   color: '#4F46E5', frequency: 'daily'  },
  { name: 'Focused Work Block (No Distractions)', category: 'Productivity', color: '#4F46E5', frequency: 'daily' },
  { name: 'Weekly Review',            category: 'Productivity',   color: '#4F46E5', frequency: 'weekly' },

  // ── Rest & Recovery ──────────────────────────────────────────────
  { name: 'In Bed by 10pm',           category: 'Rest',           color: '#6B7280', frequency: 'daily'  },
  { name: 'Nap or Rest Break',        category: 'Rest',           color: '#6B7280', frequency: 'daily'  },
  { name: 'Tech-Free Hour',           category: 'Rest',           color: '#6B7280', frequency: 'daily'  },
  { name: 'Spend Time Outdoors',      category: 'Rest',           color: '#6B7280', frequency: 'daily'  },
];
