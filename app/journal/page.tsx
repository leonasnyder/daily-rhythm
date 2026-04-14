'use client';
import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, ChevronLeft, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface JournalEntry {
  id: number;
  entry_date: string;
  title: string | null;
  content: string;
  mood: string | null;
  preview?: string;
  created_at: string;
  updated_at: string;
}

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great'  },
  { value: 'good',  emoji: '🙂', label: 'Good'   },
  { value: 'okay',  emoji: '😐', label: 'Okay'   },
  { value: 'hard',  emoji: '😔', label: 'Hard'   },
  { value: 'rough', emoji: '😢', label: 'Rough'  },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef('');

  const fetchEntries = async () => {
    try {
      const data = await fetch('/api/journal').then(r => r.json());
      if (Array.isArray(data)) setEntries(data);
    } catch { toast.error('Failed to load journal'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, []);

  const openEntry = async (entry: JournalEntry) => {
    // Load full content
    const full = await fetch(`/api/journal/${entry.id}`).then(r => r.json());
    setSelected(full);
    setTitle(full.title ?? '');
    setContent(full.content ?? '');
    setMood(full.mood ?? null);
    setEditing(false);
    lastSavedContent.current = full.content ?? '';
  };

  const newEntry = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_date: today, title: '', content: '', mood: null }),
      });
      const entry = await res.json();
      setEntries(prev => [entry, ...prev]);
      setSelected(entry);
      setTitle('');
      setContent('');
      setMood(null);
      setEditing(true);
      lastSavedContent.current = '';
    } catch { toast.error('Failed to create entry'); }
  };

  const saveEntry = async (updates: Partial<{ title: string; content: string; mood: string | null }>) => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journal/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setSelected(updated);
      lastSavedContent.current = updated.content ?? '';
      setEntries(prev => prev.map(e => e.id === updated.id
        ? { ...e, title: updated.title, mood: updated.mood, preview: updated.content?.slice(0, 200), updated_at: updated.updated_at }
        : e
      ));
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEntry({ title, content: val, mood }), 1500);
  };

  const handleTitleBlur = () => saveEntry({ title, content, mood });
  const handleMoodSelect = (val: string) => {
    const newMood = mood === val ? null : val;
    setMood(newMood);
    saveEntry({ title, content, mood: newMood });
  };

  const deleteEntry = async () => {
    if (!selected || !confirm('Delete this journal entry? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/journal/${selected.id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== selected.id));
      setSelected(null);
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete entry'); }
    finally { setDeleting(false); }
  };

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy'); }
    catch { return dateStr; }
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold">Journal</h1>
          </div>
          <Button
            onClick={newEntry}
            style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }}
            className="text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="h-14 w-14 text-gray-200 mx-auto" />
            <p className="text-lg font-semibold text-gray-500">Your journal is empty</p>
            <p className="text-sm text-gray-400">Tap New Entry to write your first entry.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => {
              const moodObj = MOODS.find(m => m.value === entry.mood);
              return (
                <button
                  key={entry.id}
                  onClick={() => openEntry(entry)}
                  className="w-full text-left rounded-xl border bg-white dark:bg-gray-900 p-4 hover:border-teal-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {moodObj && <span className="text-lg leading-none">{moodObj.emoji}</span>}
                        <p className="text-xs text-gray-400">{formatDate(entry.entry_date)}</p>
                      </div>
                      {entry.title && (
                        <p className="font-semibold text-gray-800 dark:text-gray-100 mt-1 truncate">{entry.title}</p>
                      )}
                      {entry.preview && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {entry.preview}
                        </p>
                      )}
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180 shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── ENTRY VIEW / EDITOR ────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setSelected(null); fetchEntries(); }}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 font-medium"
        >
          <ChevronLeft className="h-4 w-4" /> All Entries
        </button>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {editing && (
            <Button size="sm" onClick={() => { saveEntry({ title, content, mood }); setEditing(false); }}
              style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }} className="text-white">
              Done
            </Button>
          )}
          <button onClick={deleteEntry} disabled={deleting} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date */}
      <p className="text-sm text-gray-400">{formatDate(selected.entry_date)}</p>

      {/* Mood picker */}
      <div className="flex gap-2">
        {MOODS.map(m => (
          <button
            key={m.value}
            onClick={() => handleMoodSelect(m.value)}
            title={m.label}
            className={`text-2xl leading-none p-1.5 rounded-lg transition-all ${
              mood === m.value
                ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-900 scale-110'
                : 'opacity-50 hover:opacity-100 hover:scale-105'
            }`}
          >
            {m.emoji}
          </button>
        ))}
        {mood && <span className="text-xs text-gray-400 self-center ml-1">{MOODS.find(m => m.value === mood)?.label}</span>}
      </div>

      {/* Title */}
      {editing ? (
        <input
          className="w-full text-xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 focus:outline-none focus:border-teal-500 placeholder:text-gray-300"
          placeholder="Title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
        />
      ) : (
        title && <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      )}

      {/* Content */}
      {editing ? (
        <textarea
          className="w-full min-h-[50vh] resize-none bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 text-base leading-relaxed placeholder:text-gray-300"
          placeholder="What's on your heart today…"
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          autoFocus
        />
      ) : (
        <div
          className="min-h-[40vh] text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap cursor-text"
          onClick={() => setEditing(true)}
        >
          {content || <span className="text-gray-300 italic">Tap to start writing…</span>}
        </div>
      )}
    </div>
  );
}
