'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, GripVertical, Loader2, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Faith',
  'Health',
  'Relationships',
  'Personal Growth',
  'Home',
  'Finance',
  'Rest',
  'General',
];

interface Habit {
  id: number;
  name: string;
  category: string;
  color: string;
  frequency: string;
  is_active: number;
  sort_order: number;
}

interface HabitManagerProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function HabitManager({ open, onClose, onChanged }: HabitManagerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (Array.isArray(data)) setHabits(data);
    } catch {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchHabits();
  }, [open, fetchHabits]);

  const addHabit = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), category: newCategory }),
      });
      if (!res.ok) throw new Error();
      const habit = await res.json();
      setHabits(prev => [...prev, habit]);
      setNewName('');
      onChanged();
      toast.success('Habit added');
    } catch {
      toast.error('Failed to add habit');
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), category: editCategory }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setHabits(prev => prev.map(h => h.id === id ? updated : h));
      setEditingId(null);
      onChanged();
    } catch {
      toast.error('Failed to update habit');
    }
  };

  const toggleActive = async (habit: Habit) => {
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: habit.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setHabits(prev => prev.map(h => h.id === habit.id ? updated : h));
      onChanged();
    } catch {
      toast.error('Failed to update habit');
    }
  };

  const deleteHabit = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setHabits(prev => prev.filter(h => h.id !== id));
      onChanged();
      toast.success('Habit removed');
    } catch {
      toast.error('Failed to delete habit');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditCategory(habit.category);
  };

  if (!open) return null;

  const displayedCategories = ['All', ...CATEGORIES];
  const filtered = filterCategory === 'All'
    ? habits
    : habits.filter(h => h.category === filterCategory);

  const activeHabits = filtered.filter(h => h.is_active);
  const inactiveHabits = filtered.filter(h => !h.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Habits</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Add new habit */}
        <div className="px-5 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 mb-2">ADD NEW HABIT</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
              placeholder="Habit name..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 min-h-[44px]"
            />
            <Button
              onClick={addHabit}
              disabled={adding || !newName.trim()}
              size="sm"
              className="min-h-[44px]"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white min-h-[44px]"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="px-5 py-3 border-b dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {displayedCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  filterCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Habit list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Active habits */}
              {activeHabits.length > 0 && (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activeHabits.map(habit => (
                    <li key={habit.id} className="px-5 py-3">
                      {editingId === habit.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(habit.id)}
                            className="flex-1 px-3 py-2 rounded-lg border border-blue-400 bg-white dark:bg-gray-700 text-sm min-h-[44px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm min-h-[44px]"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <Button size="sm" onClick={() => saveEdit(habit.id)} className="min-h-[44px]">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="min-h-[44px]">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{habit.name}</p>
                            <p className="text-xs text-gray-400">{habit.category}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(habit)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              aria-label="Edit habit"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                            <button
                              onClick={() => toggleActive(habit)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[40px] min-h-[40px] flex items-center justify-center text-xs text-gray-400"
                              aria-label="Pause habit"
                              title="Pause (hide from daily tracker)"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => deleteHabit(habit.id)}
                              disabled={deletingId === habit.id}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              aria-label="Delete habit"
                            >
                              {deletingId === habit.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                                : <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              }
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Paused habits */}
              {inactiveHabits.length > 0 && (
                <div>
                  <p className="px-5 py-2 text-xs font-medium text-gray-400 uppercase bg-gray-50 dark:bg-gray-800">
                    Paused Habits
                  </p>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {inactiveHabits.map(habit => (
                      <li key={habit.id} className="px-5 py-3 opacity-50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{habit.name}</p>
                            <p className="text-xs text-gray-400">{habit.category}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleActive(habit)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[40px] min-h-[40px] flex items-center justify-center text-xs text-blue-500"
                              aria-label="Resume habit"
                            >
                              Resume
                            </button>
                            <button
                              onClick={() => deleteHabit(habit.id)}
                              disabled={deletingId === habit.id}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              aria-label="Delete habit"
                            >
                              {deletingId === habit.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                                : <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              }
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeHabits.length === 0 && inactiveHabits.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No habits yet. Add one above!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
