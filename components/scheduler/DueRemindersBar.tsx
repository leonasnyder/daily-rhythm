'use client';
import { useState, useEffect, useCallback } from 'react';
import { BellRing, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface Task {
  id: number;
  title: string;
  notes: string | null;
  is_completed: number;
  due_date: string | null;
  due_time: string | null;
  parent_id: number | null;
}

interface DueRemindersBarProps {
  date: string; // 'YYYY-MM-DD'
}

export default function DueRemindersBar({ date }: DueRemindersBarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  const fetchDueTasks = useCallback(async () => {
    try {
      const all = await fetch('/api/tasks').then(r => r.json());
      if (!Array.isArray(all)) return;
      // Filter to tasks due on this date (top-level only)
      const due = (all as Task[]).filter(t => t.due_date === date && !t.parent_id);
      setTasks(due);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetchDueTasks(); }, [fetchDueTasks]);

  const handleToggle = async (task: Task) => {
    const completing = !task.is_completed;
    setToggling(prev => new Set(prev).add(task.id));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: completing ? 1 : 0 } : t));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: completing ? 1 : 0 }),
      });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: task.is_completed } : t));
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(task.id); return s; });
    }
  };

  const formatTime = (t: string) => {
    try {
      const [h, m] = t.split(':').map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    } catch { return t; }
  };

  if (loading || tasks.length === 0) return null;

  const pending   = tasks.filter(t => !t.is_completed);
  const completed = tasks.filter(t => t.is_completed);

  return (
    <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-semibold text-teal-800 dark:text-teal-300">
            Reminders Due — {format(parseISO(date), 'MMMM d')}
          </span>
          {pending.length > 0 && (
            <span className="text-xs bg-teal-500 text-white rounded-full px-1.5 py-0.5 font-medium">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            onClick={e => e.stopPropagation()}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
          >
            All reminders <ExternalLink className="h-3 w-3" />
          </Link>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-teal-500" />
            : <ChevronRight className="h-4 w-4 text-teal-500" />
          }
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="divide-y divide-teal-100 dark:divide-teal-800/50 border-t border-teal-200 dark:border-teal-800">
          {tasks.map(task => {
            const isBusy = toggling.has(task.id);
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  task.is_completed ? 'opacity-50' : 'bg-white/60 dark:bg-gray-900/30'
                )}
              >
                <button
                  onClick={() => handleToggle(task)}
                  disabled={isBusy}
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {isBusy
                    ? <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                    : task.is_completed
                      ? <CheckCircle2 className="h-5 w-5 text-teal-500" />
                      : <Circle className="h-5 w-5 text-gray-300 hover:text-teal-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.is_completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-800 dark:text-gray-200'
                  )}>
                    {task.title}
                  </p>
                  {task.due_time && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                      Due at {formatTime(task.due_time)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {completed.length > 0 && pending.length === 0 && (
            <div className="px-4 py-2.5 text-center text-xs text-teal-600 dark:text-teal-400 font-medium">
              ✓ All reminders for today are done!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
