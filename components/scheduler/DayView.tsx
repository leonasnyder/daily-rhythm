'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext, DragEndEvent, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Printer, Loader2, RefreshCw, AlertTriangle, Undo2, Lock, Pencil, Trash2, Check, Bell, CalendarCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ActivityCard from './ActivityCard';
import type { EntrySubActivity } from './ActivityCard';
import EditEntryModal from './EditEntryModal';
import AddActivityModal from './AddActivityModal';
import PrintDayView from './PrintDayView';
import ScheduleAssistant from './ScheduleAssistant';
import { Button } from '@/components/ui/button';
import { formatTime, cn } from '@/lib/utils';
import { ExportDayDocButton } from '@/components/shared/ExportButtons';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface DueTask {
  id: number;
  title: string;
  is_completed: number;
  due_date: string;
  due_time: string | null;
  parent_id: number | null;
}

interface CalEvent {
  uid: string;
  summary: string;
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
  location?: string;
}

interface ScheduleEntry {
  id: number;
  activity_id: number;
  time_slot: string;
  duration_minutes: number;
  notes: string | null;
  is_completed: number;
  activity_name: string;
  category: string | null;
  color: string;
  entry_sub_activities: EntrySubActivity[];
}

interface DayViewProps {
  date: string;
  refreshKey?: number;
  onReset?: () => void;
}

const SLOT_INTERVAL_MIN = 15;
const SLOT_HEIGHT_PX = 24; // minimum px per 15-minute slot row

function parseHour(timeStr: string | undefined, fallback: number): number {
  if (!timeStr) return fallback;
  const [h] = timeStr.split(':').map(Number);
  return isNaN(h) ? fallback : h;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToSlot(totalMinutes: number): string {
  const snapped = Math.round(totalMinutes / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// These are computed dynamically inside the component from user settings


function DroppableSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`w-full h-full ${isOver ? 'bg-red-50 dark:bg-red-950/20 rounded' : ''}`}>
      {children}
    </div>
  );
}

// Module-level settings cache — survives re-renders and date changes
let _settingsCache: { start: string; end: string } | null = null;

export default function DayView({ date, refreshKey, onReset }: DayViewProps) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [dueTasks, setDueTasks] = useState<DueTask[]>([]);
  const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleStart, setScheduleStart] = useState('07:00');
  const [scheduleEnd, setScheduleEnd] = useState('22:00');
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [addingToSlot, setAddingToSlot] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resizing, setResizing] = useState<{
    entryId: number; initialY: number; initialDuration: number; currentDuration: number;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<ScheduleEntry[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const MAX_HISTORY = 10;

  // `today` must be client-only. Using `new Date()` directly in the render
  // body produces UTC during SSR and the local timezone on the client, which
  // causes React hydration error #425 (event handlers silently fail to
  // attach, making the whole page "dead"). Until the effect runs, `today`
  // is empty so `isPastDay` is false — editable by default, which is safe.
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, []);
  const isPastDay = today !== '' && date < today;
  const [isEditingPast, setIsEditingPast] = useState(false);
  const isLocked = isPastDay && !isEditingPast;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?date=${date}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchEntries(); }, [fetchEntries, refreshKey]);

  // Due-date reminders — completely independent, never affects schedule loading
  useEffect(() => {
    let cancelled = false;
    fetch('/api/tasks')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return;
        setDueTasks(data.filter((t: DueTask) => t.due_date === date && !t.parent_id));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [date, refreshKey]);

  // Apple Calendar events — independent fetch, never affects schedule loading.
  // Pass the browser's IANA timezone so the server builds the CalDAV
  // time-range filter around the user's actual local day (vs. a wide UTC
  // window that pulls in yesterday-evening and tomorrow-morning events).
  useEffect(() => {
    let cancelled = false;
    setCalEvents([]);
    let tz: string | undefined;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unsupported */ }
    const url = tz
      ? `/api/caldav/sync?date=${date}&tz=${encodeURIComponent(tz)}`
      : `/api/caldav/sync?date=${date}`;
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled && Array.isArray(data)) setCalEvents(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [date, refreshKey]);

  useEffect(() => {
    if (_settingsCache) {
      setScheduleStart(_settingsCache.start);
      setScheduleEnd(_settingsCache.end);
      return;
    }
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => {
        const start = s.schedule_start ?? '07:00';
        const end = s.schedule_end ?? '22:00';
        _settingsCache = { start, end };
        setScheduleStart(start);
        setScheduleEnd(end);
      })
      .catch(() => {});
  }, []);

  const pushHistory = useCallback((snapshot: ScheduleEntry[]) => {
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), [...snapshot]];
    setCanUndo(true);
  }, [MAX_HISTORY]);

  const handleUndo = useCallback(async () => {
    if (historyRef.current.length === 0) return;
    const previousEntries = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    if (historyRef.current.length === 0) setCanUndo(false);

    try {
      const currentEntries = await fetch(`/api/schedule?date=${date}`).then(r => r.json()) as ScheduleEntry[];

      const updates: Promise<Response>[] = [];

      // Restore changed entries
      for (const prev of previousEntries) {
        const curr = currentEntries.find(e => e.id === prev.id);
        if (curr && (curr.time_slot !== prev.time_slot || curr.duration_minutes !== prev.duration_minutes)) {
          updates.push(fetch(`/api/schedule/${prev.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time_slot: prev.time_slot, duration_minutes: prev.duration_minutes }),
          }));
        }
        // Restore removed entries
        if (!curr) {
          updates.push(fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_id: prev.activity_id,
              date,
              time_slot: prev.time_slot,
              duration_minutes: prev.duration_minutes,
              notes: prev.notes,
            }),
          }));
        }
      }

      // Remove entries that were added after the snapshot
      for (const curr of currentEntries) {
        if (!previousEntries.find(e => e.id === curr.id)) {
          updates.push(fetch(`/api/schedule/${curr.id}`, { method: 'DELETE' }));
        }
      }

      await Promise.all(updates);
      await fetchEntries();
      toast.success('Undone');
    } catch {
      toast.error('Failed to undo');
    }
  }, [date, fetchEntries]);

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    pushHistory(entries);
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await fetchEntries();
    } catch {
      toast.error('Failed to update activity');
    }
  }, [fetchEntries, pushHistory, entries]);

  const handleUpdateWithCascade = useCallback(async (id: number, data: Record<string, unknown>) => {
    if (!('time_slot' in data) && !('duration_minutes' in data)) {
      return handleUpdate(id, data);
    }
    pushHistory(entries);
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();

      // Re-fetch to get updated state, then cascade shifts
      const refreshed = await fetch(`/api/schedule?date=${date}`).then(r => r.json());
      if (!Array.isArray(refreshed)) { await fetchEntries(); return; }

      const sorted = [...refreshed].sort((a: ScheduleEntry, b: ScheduleEntry) =>
        timeToMinutes(a.time_slot) - timeToMinutes(b.time_slot)
      );

      const cascadeUpdates: Array<{ id: number; time_slot: string }> = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];
        const currEndMin = timeToMinutes(curr.time_slot) + curr.duration_minutes;
        const nextStartMin = timeToMinutes(next.time_slot);
        if (currEndMin > nextStartMin) {
          const newSlot = minutesToSlot(currEndMin);
          sorted[i + 1] = { ...next, time_slot: newSlot };
          cascadeUpdates.push({ id: next.id, time_slot: newSlot });
        }
      }

      if (cascadeUpdates.length > 0) {
        await Promise.all(cascadeUpdates.map(u =>
          fetch(`/api/schedule/${u.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time_slot: u.time_slot }),
          })
        ));
        toast.success(`Shifted ${cascadeUpdates.length} activit${cascadeUpdates.length === 1 ? 'y' : 'ies'} to avoid overlap`);
      }

      await fetchEntries();
    } catch {
      toast.error('Failed to update activity');
    }
  }, [date, handleUpdate, fetchEntries, pushHistory, entries]);

  const handleResizeStart = useCallback((entryId: number, initialY: number, initialDuration: number) => {
    setResizing({ entryId, initialY, initialDuration, currentDuration: initialDuration });
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: PointerEvent) => {
      const deltaY = e.clientY - resizing.initialY;
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT_PX);
      const newDuration = Math.max(SLOT_INTERVAL_MIN, resizing.initialDuration + deltaSlots * SLOT_INTERVAL_MIN);
      setResizing(prev => prev ? { ...prev, currentDuration: newDuration } : null);
    };
    const onUp = async () => {
      const snap = resizing;
      setResizing(null);
      if (snap.currentDuration !== snap.initialDuration) {
        await handleUpdateWithCascade(snap.entryId, { duration_minutes: snap.currentDuration });
      }
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [resizing, handleUpdateWithCascade]);

  const handleRemove = useCallback(async (id: number) => {
    pushHistory(entries);
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Activity removed from today');
      await fetchEntries();
    } catch {
      toast.error('Failed to remove activity');
    }
  }, [fetchEntries, pushHistory, entries]);

  const handleToggleSubActivity = useCallback(async (entryId: number, entrySubActivityId: number, completed: number) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, entry_sub_activities: e.entry_sub_activities.map(s => s.id === entrySubActivityId ? { ...s, completed } : s) }
        : e
    ));
    try {
      const res = await fetch(`/api/schedule/${entryId}/sub-activities`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_sub_activity_id: entrySubActivityId, completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? { ...e, entry_sub_activities: e.entry_sub_activities.map(s => s.id === entrySubActivityId ? { ...s, completed: completed ? 0 : 1 } : s) }
          : e
      ));
      toast.error('Failed to update sub-activity');
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedEntry = entries.find(e => e.id === active.id);
    if (!draggedEntry) return;

    let targetTimeSlot: string;

    if (typeof over.id === 'string' && over.id.startsWith('slot-')) {
      // Dropped on an empty time slot
      targetTimeSlot = over.id.slice(5);
    } else {
      // Dropped on another activity
      const targetEntry = entries.find(e => e.id === over.id);
      if (!targetEntry) return;
      // If the target activity is above the dragged one, snap to its END time
      // so the dragged card sits immediately after it (e.g. 9-10 → drop on it → land at 10:00)
      const targetEndMin = timeToMinutes(targetEntry.time_slot) + targetEntry.duration_minutes;
      if (timeToMinutes(targetEntry.time_slot) < timeToMinutes(draggedEntry.time_slot)) {
        targetTimeSlot = minutesToSlot(targetEndMin);
      } else {
        targetTimeSlot = targetEntry.time_slot;
      }
    }

    if (targetTimeSlot === draggedEntry.time_slot) return;
    // Optimistic update so the time label changes immediately
    setEntries(prev => prev.map(e => e.id === draggedEntry.id ? { ...e, time_slot: targetTimeSlot } : e));
    await handleUpdateWithCascade(draggedEntry.id, { time_slot: targetTimeSlot });
  }, [entries, handleUpdateWithCascade]);

  const handleResetToDefaults = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(async () => {
    setShowResetConfirm(false);
    try {
      const res = await fetch(`/api/schedule?date=${date}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchEntries();
      toast.success('Day reset to defaults');
      onReset?.();
    } catch {
      toast.error('Failed to reset day');
    }
  }, [date, fetchEntries, onReset]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Schedule-${date}`,
  });

  // Compute time range from user settings — use full HH:MM precision, not just hours
  const DAY_START_MIN = timeToMinutes(scheduleStart) || 7 * 60;
  let _rawEndMin = timeToMinutes(scheduleEnd);
  // '00:00' = midnight = end of day; treat as 24:00 (1440 min)
  if (_rawEndMin === 0) _rawEndMin = 24 * 60;
  // If end is at or before start (bad config), default to midnight
  if (_rawEndMin <= DAY_START_MIN) _rawEndMin = 24 * 60;
  const DAY_END_MIN = _rawEndMin;
  const TOTAL_SLOTS = Math.max(4, (DAY_END_MIN - DAY_START_MIN) / SLOT_INTERVAL_MIN);

  // Build timeline segments: one per activity (spanning its slots) or one per empty slot
  type Segment =
    | { type: 'empty'; slotIdx: number }
    | { type: 'activity'; slotIdx: number; spanSlots: number; entry: ScheduleEntry }
    | { type: 'reminder'; slotIdx: number; task: DueTask }
    | { type: 'caldav'; slotIdx: number; event: CalEvent };

  const entryByStartSlot = new Map<number, ScheduleEntry>();
  const hiddenEntries: ScheduleEntry[] = [];
  for (const entry of entries) {
    const startMin = timeToMinutes(entry.time_slot);
    const startSlot = Math.round((startMin - DAY_START_MIN) / SLOT_INTERVAL_MIN);
    if (startSlot >= 0 && startSlot < TOTAL_SLOTS) {
      entryByStartSlot.set(startSlot, entry);
    } else {
      hiddenEntries.push(entry);
    }
  }

  // Map due tasks to their slot index (tasks with a due_time land at that time; no time → day start)
  const remindersBySlot = new Map<number, DueTask[]>();
  const allDayReminders: DueTask[] = [];
  for (const task of dueTasks) {
    if (task.due_time) {
      const taskMin = timeToMinutes(task.due_time);
      const slotIdx = Math.round((taskMin - DAY_START_MIN) / SLOT_INTERVAL_MIN);
      if (slotIdx >= 0 && slotIdx < TOTAL_SLOTS) {
        const existing = remindersBySlot.get(slotIdx) ?? [];
        existing.push(task);
        remindersBySlot.set(slotIdx, existing);
      } else {
        allDayReminders.push(task);
      }
    } else {
      allDayReminders.push(task);
    }
  }

  // Map timed CalDAV events to their slot index
  const calEventsBySlot = new Map<number, CalEvent[]>();
  const allDayCalEvents = calEvents.filter(e => e.isAllDay);
  for (const ev of calEvents) {
    if (!ev.isAllDay && ev.startTime) {
      const evMin = timeToMinutes(ev.startTime);
      const slotIdx = Math.round((evMin - DAY_START_MIN) / SLOT_INTERVAL_MIN);
      if (slotIdx >= 0 && slotIdx < TOTAL_SLOTS) {
        const existing = calEventsBySlot.get(slotIdx) ?? [];
        existing.push(ev);
        calEventsBySlot.set(slotIdx, existing);
      }
    }
  }

  // Detect entries hidden by overlap (covered by a preceding activity's duration)
  const segments: Segment[] = [];
  const coveredSlots = new Set<number>();
  let si = 0;
  while (si < TOTAL_SLOTS) {
    // Insert any reminders at this slot BEFORE the activity/empty slot
    const slotReminders = remindersBySlot.get(si);
    if (slotReminders) {
      for (const task of slotReminders) {
        segments.push({ type: 'reminder', slotIdx: si, task });
      }
    }
    // Insert Apple Calendar events at this slot
    const slotCalEvents = calEventsBySlot.get(si);
    if (slotCalEvents) {
      for (const event of slotCalEvents) {
        segments.push({ type: 'caldav', slotIdx: si, event });
      }
    }
    const entry = entryByStartSlot.get(si);
    if (entry) {
      const spanSlots = Math.max(1, Math.round(entry.duration_minutes / SLOT_INTERVAL_MIN));
      for (let k = 1; k < spanSlots; k++) coveredSlots.add(si + k);
      segments.push({ type: 'activity', slotIdx: si, spanSlots, entry });
      si += spanSlots;
    } else {
      segments.push({ type: 'empty', slotIdx: si });
      si += 1;
    }
  }
  const overlappedEntries = Array.from(entryByStartSlot.values()).filter(e => {
    const slot = Math.round((timeToMinutes(e.time_slot) - DAY_START_MIN) / SLOT_INTERVAL_MIN);
    return coveredSlots.has(slot);
  });

  if (loading) {
    return (
      <div id="day-view-loading" className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div id="day-view">
      <div id="day-view-toolbar" className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {format(parseISO(date), 'EEEE, MMMM d')}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {!isLocked && (
            <>
              <Button id="day-view-undo" variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4 mr-1" /> Undo
              </Button>
              <Button id="day-view-reset" variant="outline" size="sm" onClick={handleResetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reset to Defaults
              </Button>
            </>
          )}
          <Button id="day-view-print" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Day
          </Button>
          <ExportDayDocButton date={date} entries={entries} />
          {!isLocked && (
            <Button id="day-view-add" size="sm" onClick={() => setAddingToSlot('08:00')}>
              <Plus className="h-4 w-4 mr-1" /> Add Activity
            </Button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>This is a past day. The schedule is read-only — use the edit button on any activity to make changes.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/40"
            onClick={() => setIsEditingPast(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit This Day
          </Button>
        </div>
      )}

      {/* All-day Apple Calendar events */}
      {allDayCalEvents.length > 0 && (
        <div className="mb-3 rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20">
            <CalendarCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              All day — {allDayCalEvents.map(e => e.summary).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* All-day reminders (due date set, no specific time) */}
      {allDayReminders.length > 0 && (
        <div className="mb-3 rounded-lg border border-teal-200 dark:border-teal-700 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20">
            <Bell className="h-4 w-4 text-teal-600 flex-shrink-0" />
            <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
              Reminders due today
            </span>
          </div>
          <div className="divide-y divide-teal-100 dark:divide-teal-800">
            {allDayReminders.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800">
                <button
                  onClick={async () => {
                    const next = task.is_completed ? 0 : 1;
                    setDueTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: next } : t));
                    await fetch(`/api/tasks/${task.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_completed: next }),
                    });
                  }}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    task.is_completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-teal-400 hover:border-teal-600'
                  )}
                >
                  {task.is_completed ? <Check className="h-3 w-3" /> : null}
                </button>
                <span className={cn('text-sm flex-1', task.is_completed && 'line-through text-gray-400')}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hiddenEntries.length > 0 || overlappedEntries.length > 0) && (
        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-700 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {hiddenEntries.length + overlappedEntries.length} hidden activit{hiddenEntries.length + overlappedEntries.length === 1 ? 'y' : 'ies'} — delete or move them
            </span>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-amber-800">
            {[...hiddenEntries.map(e => ({ ...e, reason: 'outside visible hours' })),
              ...overlappedEntries.map(e => ({ ...e, reason: 'overlaps another activity' }))
            ].map(e => (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800">
                {/* Complete toggle */}
                <button
                  onClick={() => handleUpdate(e.id, { is_completed: e.is_completed ? 0 : 1 })}
                  className={cn(
                    'w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    e.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                  )}
                  aria-label={e.is_completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {e.is_completed && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                <div className="flex-1 min-w-0">
                  <span className={cn('text-sm font-medium', e.is_completed && 'line-through text-gray-400')}>{e.activity_name}</span>
                  <span className="text-xs text-gray-400 ml-2">{e.time_slot.slice(0, 5)} · {e.reason}</span>
                </div>
                <button
                  onClick={() => handleRemove(e.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  aria-label={`Remove ${e.activity_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div id="day-view-timeline">
            {segments.map(seg => {
              if (seg.type === 'activity') {
                const slotLabels = Array.from({ length: seg.spanSlots }, (_, i) => {
                  const slotMin = DAY_START_MIN + (seg.slotIdx + i) * SLOT_INTERVAL_MIN;
                  const h = Math.floor(slotMin / 60);
                  const m = slotMin % 60;
                  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  return { i, isHour: m === 0, isHalf: m === 30, m, timeStr };
                });

                const displaySlots = resizing?.entryId === seg.entry.id
                  ? Math.max(1, Math.round(resizing.currentDuration / SLOT_INTERVAL_MIN))
                  : seg.spanSlots;
                const slotHeight = displaySlots * SLOT_HEIGHT_PX;

                return (
                  <div
                    key={seg.slotIdx}
                    className="flex items-start"
                  >
                    {/* Time labels at exact pixel positions */}
                    <div className="w-16 flex-shrink-0 relative select-none" style={{ minHeight: `${slotHeight}px` }}>
                      {slotLabels.map(({ i, isHour, isHalf, m, timeStr }) => (
                        <div
                          key={i}
                          className="absolute right-2"
                          style={{ top: `${i * SLOT_HEIGHT_PX + 4}px` }}
                        >
                          {isHour && (
                            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                              {formatTime(timeStr)}
                            </span>
                          )}
                          {isHalf && (
                            <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">:30</span>
                          )}
                          {!isHour && !isHalf && (
                            <span className="text-[10px] font-mono text-gray-200 dark:text-gray-700">
                              :{String(m).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Activity card — grows freely with content, no height clipping */}
                    <div className="flex-1 border-l border-gray-200 dark:border-gray-600 pl-1 pb-0.5">
                      <ActivityCard
                        entry={seg.entry}
                        cardMinHeight={slotHeight}
                        displayDuration={resizing?.entryId === seg.entry.id ? resizing.currentDuration : undefined}
                        readOnly={isLocked}
                        onUpdate={handleUpdate}
                        onRemove={handleRemove}
                        onEdit={setEditingEntry}
                        onToggleSubActivity={handleToggleSubActivity}
                        onResizeStart={isLocked ? undefined : handleResizeStart}
                      />
                    </div>
                  </div>
                );
              }

              // Reminder row (task with due_time on this date)
              if (seg.type === 'reminder') {
                const slotMin = DAY_START_MIN + seg.slotIdx * SLOT_INTERVAL_MIN;
                const h = Math.floor(slotMin / 60);
                const m = slotMin % 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                return (
                  <div key={`reminder-${seg.task.id}`} className="flex items-center" style={{ minHeight: `${SLOT_HEIGHT_PX}px` }}>
                    <div className="w-16 flex-shrink-0 text-right pr-2 select-none">
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                        {formatTime(timeStr)}
                      </span>
                    </div>
                    <div className="flex-1 border-l border-teal-200 dark:border-teal-700 pl-1 pb-0.5">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700">
                        <button
                          onClick={async () => {
                            const next = seg.task.is_completed ? 0 : 1;
                            setDueTasks(prev => prev.map(t => t.id === seg.task.id ? { ...t, is_completed: next } : t));
                            await fetch(`/api/tasks/${seg.task.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ is_completed: next }),
                            });
                          }}
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            seg.task.is_completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-teal-400 hover:border-teal-600'
                          )}
                        >
                          {seg.task.is_completed ? <Check className="h-2.5 w-2.5" /> : null}
                        </button>
                        <Bell className="h-3 w-3 text-teal-500 flex-shrink-0" />
                        <span className={cn('text-xs font-medium text-teal-800 dark:text-teal-300 flex-1', seg.task.is_completed && 'line-through opacity-50')}>
                          {seg.task.title}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Apple Calendar event row
              if (seg.type === 'caldav') {
                const slotMin = DAY_START_MIN + seg.slotIdx * SLOT_INTERVAL_MIN;
                const h = Math.floor(slotMin / 60);
                const m = slotMin % 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                return (
                  <div key={`caldav-${seg.event.uid}`} className="flex items-center" style={{ minHeight: `${SLOT_HEIGHT_PX}px` }}>
                    <div className="w-16 flex-shrink-0 text-right pr-2 select-none">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatTime(timeStr)}
                      </span>
                    </div>
                    <div className="flex-1 border-l border-blue-200 dark:border-blue-700 pl-1 pb-0.5">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                        <CalendarCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300 flex-1 truncate">
                          {seg.event.summary}
                          {seg.event.endTime ? ` – ${formatTime(seg.event.endTime)}` : ''}
                        </span>
                        {seg.event.location && (
                          <span className="text-xs text-gray-400 truncate max-w-[80px]" title={seg.event.location}>
                            📍 {seg.event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Empty slot
              const slotMin = DAY_START_MIN + seg.slotIdx * SLOT_INTERVAL_MIN;
              const h = Math.floor(slotMin / 60);
              const m = slotMin % 60;
              const isHour = m === 0;
              const isHalf = m === 30;
              const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

              return (
                <div
                  key={seg.slotIdx}
                  className="flex gap-0"
                  style={{ minHeight: `${SLOT_HEIGHT_PX}px` }}
                >
                  <div className="w-16 flex-shrink-0 text-right pr-2 pt-1 select-none">
                    {isHour && (
                      <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                        {formatTime(timeStr)}
                      </span>
                    )}
                    {isHalf && (
                      <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">:30</span>
                    )}
                    {!isHour && !isHalf && (
                      <span className="text-[10px] font-mono text-gray-200 dark:text-gray-700">
                        :{String(m).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex-1 border-l pl-1 pb-0.5 ${
                      isHour
                        ? 'border-gray-200 dark:border-gray-600'
                        : isHalf
                        ? 'border-gray-100 dark:border-gray-700'
                        : 'border-gray-50 dark:border-gray-800'
                    }`}
                  >
                    <DroppableSlot id={`slot-${timeStr}`}>
                      <button
                        id={`add-to-slot-${timeStr.replace(':', '-')}`}
                        onClick={() => setAddingToSlot(timeStr)}
                        className="w-full h-full min-h-[22px] border border-dashed border-transparent hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors flex items-center justify-center gap-1 text-xs text-transparent hover:text-red-500"
                        aria-label={`Add activity at ${formatTime(timeStr)}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </DroppableSlot>
                  </div>
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {entries.length === 0 && !loading && (
        <div id="day-view-empty" className="text-center py-8 text-gray-400">
          <p className="text-sm">No activities scheduled. Activities will auto-populate from your defaults.</p>
        </div>
      )}

      {/* Hidden print target */}
      <div className="hidden print:block">
        <PrintDayView ref={printRef} date={date} entries={entries} />
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={async (data) => {
            const { updateFuture, ...patchData } = data as { updateFuture?: boolean } & Record<string, unknown>;
            if (updateFuture && editingEntry.activity_id) {
              // Update today's entry first
              await handleUpdateWithCascade(editingEntry.id, patchData);
              // Then bulk-update all future entries for this activity
              await fetch('/api/schedule/update-future', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  activity_id: editingEntry.activity_id,
                  from_date: date,
                  time_slot: 'time_slot' in patchData ? patchData.time_slot : undefined,
                  duration_minutes: 'duration_minutes' in patchData ? patchData.duration_minutes : undefined,
                }),
              });
              toast.success('Updated today and all future occurrences');
            } else {
              await handleUpdateWithCascade(editingEntry.id, patchData);
              toast.success('Activity updated');
            }
            setEditingEntry(null);
          }}
        />
      )}

      {addingToSlot !== null && (
        <AddActivityModal
          date={date}
          defaultSlot={addingToSlot}
          onClose={() => setAddingToSlot(null)}
          onAdded={async () => {
            await fetchEntries();
            setAddingToSlot(null);
            toast.success('Activity added');
          }}
        />
      )}

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Defaults?</DialogTitle>
            <DialogDescription>
              This will erase all activities currently on the schedule for this day and replace them with your default activities. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReset}>Yes, Reset Day</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Schedule Assistant — floating button + panel */}
      {!isLocked && (
        <ScheduleAssistant
          date={date}
          entries={entries}
          onScheduleChanged={fetchEntries}
        />
      )}
    </div>
  );
}
