'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import DatePicker from '@/components/shared/DatePicker';
import HabitManager from '@/components/tracker/HabitManager';
import { Button } from '@/components/ui/button';
import { Settings2, Loader2, CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER = [
  'Faith',
  'Health',
  'Relationships',
  'Personal Growth',
  'Home',
  'Finance',
  'Rest',
  'General',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Faith': 'text-purple-600 dark:text-purple-400',
  'Health': 'text-green-600 dark:text-green-400',
  'Relationships': 'text-pink-600 dark:text-pink-400',
  'Personal Growth': 'text-blue-600 dark:text-blue-400',
  'Home': 'text-yellow-600 dark:text-yellow-400',
  'Finance': 'text-emerald-600 dark:text-emerald-400',
  'Rest': 'text-indigo-600 dark:text-indigo-400',
  'General': 'text-gray-600 dark:text-gray-400',
};

const CATEGORY_BG: Record<string, string> = {
  'Faith': 'bg-purple-50 dark:bg-purple-950',
  'Health': 'bg-green-50 dark:bg-green-950',
  'Relationships': 'bg-pink-50 dark:bg-pink-950',
  'Personal Growth': 'bg-blue-50 dark:bg-blue-950',
  'Home': 'bg-yellow-50 dark:bg-yellow-950',
  'Finance': 'bg-emerald-50 dark:bg-emerald-950',
  'Rest': 'bg-indigo-50 dark:bg-indigo-950',
  'General': 'bg-gray-50 dark:bg-gray-900',
};

interface Habit {
  id: number;
  name: string;
  category: string;
  color: string;
  frequency: string;
  is_active: number;
  sort_order: number;
}

interface Completion {
  id: number;
  habit_id: number;
  completed_date: string;
}

export default function HabitTrackerPage() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [managerOpen, setManagerOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (Array.isArray(data)) setHabits(data.filter((h: Habit) => h.is_active));
    } catch {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompletions = useCallback(async () => {
    try {
      const res = await fetch(`/api/habit-completions?date=${date}`);
      const data = await res.json();
      if (Array.isArray(data)) setCompletions(data);
    } catch {
      // silently fail
    }
  }, [date]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);
  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  const isCompleted = (habitId: number) =>
    completions.some(c => c.habit_id === habitId);

  const toggleHabit = async (habitId: number) => {
    const completed = !isCompleted(habitId);
    setToggling(prev => new Set(prev).add(habitId));

    // Optimistic update
    if (completed) {
      setCompletions(prev => [...prev, { id: Date.now(), habit_id: habitId, completed_date: date }]);
    } else {
      setCompletions(prev => prev.filter(c => c.habit_id !== habitId));
    }

    try {
      await fetch('/api/habit-completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date, completed }),
      });
    } catch {
      // Revert on error
      fetchCompletions();
      toast.error('Failed to update habit');
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(habitId); return s; });
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const s = new Set(prev);
      if (s.has(category)) s.delete(category);
      else s.add(category);
      return s;
    });
  };

  // Group habits by category
  const grouped = habits.reduce<Record<string, Habit[]>>((acc, h) => {
    const cat = h.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(h);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const totalHabits = habits.length;
  const completedCount = habits.filter(h => isCompleted(h.id)).length;
  const pct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <div id="habit-tracker-page" className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <DatePicker date={date} onChange={setDate} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setManagerOpen(true)}
          className="min-h-[44px]"
        >
          <Settings2 className="h-4 w-4 mr-1.5" /> Manage Habits
        </Button>
      </div>

      {/* Progress bar */}
      {totalHabits > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Today&apos;s Progress
              </span>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {completedCount} / {totalHabits}
              <span className="text-xs font-normal text-gray-400 ml-1">({pct}%)</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-400 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No habits yet</p>
          <p className="text-sm mt-1">Click &quot;Manage Habits&quot; to add your first habit</p>
          <Button
            variant="default"
            size="sm"
            className="mt-4"
            onClick={() => setManagerOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Your First Habit
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map(category => {
            const categoryHabits = grouped[category];
            const catCompleted = categoryHabits.filter(h => isCompleted(h.id)).length;
            const isCollapsed = collapsedCategories.has(category);
            const colorClass = CATEGORY_COLORS[category] ?? 'text-gray-600';
            const bgClass = CATEGORY_BG[category] ?? 'bg-gray-50';

            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                    bgClass
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed
                      ? <ChevronRight className={cn('h-4 w-4', colorClass)} />
                      : <ChevronDown className={cn('h-4 w-4', colorClass)} />
                    }
                    <span className={cn('text-sm font-semibold', colorClass)}>
                      {category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {catCompleted}/{categoryHabits.length}
                    </span>
                  </div>
                  {catCompleted === categoryHabits.length && categoryHabits.length > 0 && (
                    <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> All done!
                    </span>
                  )}
                </button>

                {/* Habit list */}
                {!isCollapsed && (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {categoryHabits.map(habit => {
                      const done = isCompleted(habit.id);
                      const isToggling = toggling.has(habit.id);
                      return (
                        <li key={habit.id}>
                          <button
                            onClick={() => toggleHabit(habit.id)}
                            disabled={isToggling}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors min-h-[52px]',
                              'hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700',
                              done && 'opacity-60'
                            )}
                          >
                            {/* Circle / check icon */}
                            <div className="flex-shrink-0">
                              {done
                                ? <CheckCircle2 className="h-6 w-6 text-green-500" />
                                : <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                              }
                            </div>
                            <span className={cn(
                              'text-sm font-medium flex-1',
                              done
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-gray-800 dark:text-gray-100'
                            )}>
                              {habit.name}
                            </span>
                            {isToggling && (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-300 flex-shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <HabitManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onChanged={fetchHabits}
      />
    </div>
  );
}
