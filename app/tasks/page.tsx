'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Loader2, Circle, CheckCircle2, ChevronDown, ChevronRight, BellRing, Info } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TaskDetailSheet, { Task } from '@/components/tasks/TaskDetailSheet';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // ids currently animating out after completion
  const [completingIds, setCompletingIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await fetch('/api/tasks').then(r => r.json());
      if (Array.isArray(data)) setTasks(data as Task[]);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const topLevel = tasks.filter(t => !t.parent_id);
  const pending   = topLevel.filter(t => !t.is_completed);
  const completed = topLevel.filter(t => t.is_completed);
  const subtasksOf = (id: number) => tasks.filter(t => t.parent_id === id);

  const formatDue = (t: Task): { label: string; overdue: boolean } | null => {
    if (!t.due_date) return null;
    const overdue = !t.is_completed && isPast(parseISO(t.due_date + 'T23:59:59'));
    let label = '';
    try {
      if (isToday(parseISO(t.due_date)))         label = 'Today';
      else if (isTomorrow(parseISO(t.due_date))) label = 'Tomorrow';
      else                                        label = format(parseISO(t.due_date), 'MMM d');
    } catch { label = t.due_date; }
    if (t.due_time) {
      try {
        const [h, m] = t.due_time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        label += ` at ${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
      } catch { /**/ }
    }
    return { label, overdue };
  };

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const task = await res.json();
      setTasks(prev => [...prev, task as Task]);
      setNewTitle('');
      inputRef.current?.focus();
    } catch { toast.error('Failed to add task'); }
    finally { setAdding(false); }
  };

  const handleToggle = async (task: Task) => {
    const completing = !task.is_completed;
    // Optimistic UI — mark immediately
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, is_completed: completing ? 1 : 0 }
      : t
    ));
    // If completing, add to animating set then remove after animation
    if (completing) {
      setCompletingIds(prev => new Set(prev).add(task.id));
      setTimeout(() => {
        setCompletingIds(prev => { const s = new Set(prev); s.delete(task.id); return s; });
      }, 500);
    }
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: completing ? 1 : 0 }),
      });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.error('Failed to update task');
    }
  };

  const handleUpdate = async (id: number, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    // Update selectedTask too
    setSelectedTask(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
    try { await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); }
    catch { toast.error('Failed to delete'); fetchTasks(); }
  };

  const handleAddSubtask = async (parentId: number, title: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, parent_id: parentId }),
      });
      const sub = await res.json();
      setTasks(prev => [...prev, sub as Task]);
    } catch { toast.error('Failed to add subtask'); }
  };

  // ── TASK ROW ───────────────────────────────────────────────────────────────
  const TaskRow = ({ task, isSubtask = false }: { task: Task; isSubtask?: boolean }) => {
    const subs = subtasksOf(task.id);
    const due = formatDue(task);
    const completing = completingIds.has(task.id);

    return (
      <div
        className={cn(
          'transition-all duration-500',
          completing && 'opacity-0 scale-95'
        )}
      >
        <div className={cn(
          'flex items-center gap-3 py-2.5 pr-3 bg-white dark:bg-gray-900',
          isSubtask ? 'pl-11' : 'pl-4'
        )}>
          {/* Completion circle */}
          <button
            onClick={() => handleToggle(task)}
            className="shrink-0 transition-transform active:scale-90"
            aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.is_completed
              ? <CheckCircle2 className={cn('h-6 w-6 transition-colors', isSubtask ? 'text-teal-400' : 'text-teal-500')} />
              : <Circle className={cn('h-6 w-6 text-gray-300 hover:text-teal-400 transition-colors', isSubtask && 'h-5 w-5')} />
            }
          </button>

          {/* Title + due */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm leading-snug',
              task.is_completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-800 dark:text-gray-200'
            )}>
              {task.title}
            </p>
            {due && (
              <p className={cn(
                'text-xs mt-0.5 flex items-center gap-1',
                due.overdue ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'
              )}>
                {due.overdue && '⚠ '}{due.label}
              </p>
            )}
            {subs.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {subs.filter(s => s.is_completed).length}/{subs.length} subtasks
              </p>
            )}
          </div>

          {/* Info button — opens detail sheet */}
          {!isSubtask && (
            <button
              onClick={() => setSelectedTask(task)}
              className="shrink-0 p-1.5 text-gray-300 hover:text-teal-500 transition-colors"
              aria-label="View details"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Subtasks */}
        {subs.length > 0 && subs.map(sub => (
          <div key={sub.id}>
            <TaskRow task={sub} isSubtask />
            <div className="h-px bg-gray-100 dark:bg-gray-800 ml-[52px]" />
          </div>
        ))}

        {!isSubtask && <div className="h-px bg-gray-100 dark:bg-gray-800 ml-[52px]" />}
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BellRing className="h-6 w-6 text-teal-600" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reminders</h1>
        {pending.length > 0 && (
          <span className="ml-auto text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold px-2 py-0.5 rounded-full">
            {pending.length}
          </span>
        )}
      </div>

      {/* Quick add */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-4 py-3">
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }}
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Plus className="h-3.5 w-3.5 text-white" />}
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="New reminder…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:text-white"
        />
        {newTitle.trim() && (
          <button
            onClick={() => { setNewTitle(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length === 0 && completed.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Circle className="h-14 w-14 mx-auto text-gray-200" />
              <p className="text-sm text-gray-400">No reminders yet. Add one above!</p>
            </div>
          ) : (
            <>
              {/* Pending tasks */}
              {pending.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {pending.map(task => <TaskRow key={task.id} task={task} />)}
                </div>
              )}

              {/* Completed section */}
              {completed.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setShowCompleted(v => !v)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Completed ({completed.length})
                  </button>
                  {showCompleted && completed.map(task => <TaskRow key={task.id} task={task} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detail sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          subtasks={subtasksOf(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={id => { handleDelete(id); setSelectedTask(null); }}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggle}
          onDeleteSubtask={id => { handleDelete(id); }}
        />
      )}
    </div>
  );
}
