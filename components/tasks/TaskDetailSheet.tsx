'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface Task {
  id: number;
  title: string;
  notes: string | null;
  is_completed: number;
  completed_at: string | null;
  due_date: string | null;
  due_time: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
}

interface TaskDetailSheetProps {
  task: Task | null;
  subtasks: Task[];
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Task>) => void;
  onDelete: (id: number) => void;
  onAddSubtask: (parentId: number, title: string) => void;
  onToggleSubtask: (task: Task) => void;
  onDeleteSubtask: (id: number) => void;
}

export default function TaskDetailSheet({
  task, subtasks, onClose, onUpdate, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setDueDate(task.due_date ?? '');
      setDueTime(task.due_time ?? '');
      setShowDatePicker(false);
      setShowTimePicker(false);
      setAddingSubtask(false);
      setNewSubtask('');
    }
  }, [task?.id]);

  useEffect(() => {
    if (addingSubtask) setTimeout(() => subtaskInputRef.current?.focus(), 50);
  }, [addingSubtask]);

  if (!task) return null;

  const scheduleSave = (updates: Partial<Task>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(task.id, updates), 800);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleSave({ title: val });
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    scheduleSave({ notes: val });
  };

  const handleDateChange = (val: string) => {
    setDueDate(val);
    onUpdate(task.id, { due_date: val || null });
    if (!val) { setDueTime(''); onUpdate(task.id, { due_date: null, due_time: null }); }
  };

  const handleTimeChange = (val: string) => {
    setDueTime(val);
    onUpdate(task.id, { due_time: val || null });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) { setAddingSubtask(false); return; }
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
    subtaskInputRef.current?.focus();
  };

  const formatDisplayDate = (d: string) => {
    try { return format(parseISO(d), 'EEE, MMM d, yyyy'); } catch { return d; }
  };

  const formatDisplayTime = (t: string) => {
    try {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch { return t; }
  };

  const isOverdue = dueDate && !task.is_completed && dueDate < new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Details</span>
          <div className="flex items-center gap-3">
            <button onClick={() => { onDelete(task.id); onClose(); }} className="text-red-500 hover:text-red-700 p-1">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* Title */}
          <div>
            <textarea
              className="w-full text-xl font-semibold bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-300 leading-snug"
              rows={2}
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Task title"
            />
          </div>

          {/* Notes */}
          <div className="border rounded-xl p-3 bg-gray-50 dark:bg-gray-800">
            <textarea
              className="w-full text-sm bg-transparent resize-none focus:outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 min-h-[60px]"
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Notes"
            />
          </div>

          {/* Due Date */}
          <div className="border rounded-xl overflow-hidden divide-y dark:divide-gray-700 dark:border-gray-700">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setShowDatePicker(v => !v)}
            >
              <Calendar className={`h-5 w-5 ${dueDate ? (isOverdue ? 'text-red-500' : 'text-teal-600') : 'text-gray-400'}`} />
              <span className={`flex-1 text-left text-sm ${dueDate ? (isOverdue ? 'text-red-500 font-medium' : 'text-teal-700 dark:text-teal-400') : 'text-gray-500'}`}>
                {dueDate ? formatDisplayDate(dueDate) : 'Add Due Date'}
              </span>
              {dueDate && (
                <button onClick={e => { e.stopPropagation(); handleDateChange(''); }}
                  className="text-gray-400 hover:text-red-500 p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
            {showDatePicker && (
              <div className="px-4 py-3">
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => { handleDateChange(e.target.value); setShowDatePicker(false); }}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-background"
                />
              </div>
            )}

            {/* Due Time — only show if date is set */}
            {dueDate && (
              <>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowTimePicker(v => !v)}
                >
                  <Clock className={`h-5 w-5 ${dueTime ? 'text-teal-600' : 'text-gray-400'}`} />
                  <span className={`flex-1 text-left text-sm ${dueTime ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500'}`}>
                    {dueTime ? formatDisplayTime(dueTime) : 'Add Time'}
                  </span>
                  {dueTime && (
                    <button onClick={e => { e.stopPropagation(); handleTimeChange(''); }}
                      className="text-gray-400 hover:text-red-500 p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </button>
                {showTimePicker && (
                  <div className="px-4 py-3">
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => { handleTimeChange(e.target.value); setShowTimePicker(false); }}
                      className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-background"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subtasks */}
          <div className="border rounded-xl overflow-hidden divide-y dark:divide-gray-700 dark:border-gray-700">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtasks</span>
            </div>

            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5">
                <button onClick={() => onToggleSubtask(sub)} className="shrink-0">
                  {sub.is_completed
                    ? <CheckCircle2 className="h-5 w-5 text-teal-500" />
                    : <Circle className="h-5 w-5 text-gray-300" />
                  }
                </button>
                <span className={`flex-1 text-sm ${sub.is_completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {sub.title}
                </span>
                <button onClick={() => onDeleteSubtask(sub.id)} className="text-gray-300 hover:text-red-500 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {addingSubtask ? (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Circle className="h-5 w-5 text-gray-200 shrink-0" />
                <input
                  ref={subtaskInputRef}
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSubtask();
                    if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtask(''); }
                  }}
                  onBlur={handleAddSubtask}
                  placeholder="New subtask…"
                  className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-300"
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingSubtask(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> Add Subtask
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
