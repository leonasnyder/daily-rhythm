'use client';
import { useState, useEffect } from 'react';
import { CalendarCheck, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface CalEvent {
  uid: string;
  summary: string;
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
  location?: string;
}

export default function CalDAVPanel({ date }: { date: string }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setEvents([]);
    let cancelled = false;
    fetch(`/api/caldav/sync?date=${date}`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [date]);

  if (events.length === 0) return null;

  const allDay = events.filter(e => e.isAllDay);
  const timed = events.filter(e => !e.isAllDay).sort((a, b) =>
    (a.startTime ?? '').localeCompare(b.startTime ?? '')
  );

  return (
    <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20"
      >
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Apple Calendar — {events.length} event{events.length !== 1 ? 's' : ''} today
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-blue-500" />
          : <ChevronDown className="h-4 w-4 text-blue-500" />}
      </button>

      {open && (
        <div className="divide-y divide-blue-100 dark:divide-blue-800 bg-white dark:bg-gray-800">
          {allDay.map(ev => (
            <div key={ev.uid} className="flex items-center gap-3 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                {ev.summary}
              </span>
              <span className="text-xs text-blue-400">All day</span>
            </div>
          ))}
          {timed.map(ev => (
            <div key={ev.uid} className="flex items-center gap-3 px-3 py-2">
              <CalendarCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 w-20 flex-shrink-0">
                {formatTime(ev.startTime!)}
                {ev.endTime ? ` – ${formatTime(ev.endTime)}` : ''}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                {ev.summary}
              </span>
              {ev.location && (
                <span className="text-xs text-gray-400 truncate max-w-[100px]" title={ev.location}>
                  📍 {ev.location}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
