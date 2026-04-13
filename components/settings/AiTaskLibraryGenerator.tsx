'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sparkles, ChevronDown, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

interface GeneratedCategory {
  name: string;
  items: string[];
}

interface AiTaskLibraryGeneratorProps {
  open: boolean;
  onClose: () => void;
  onSeeded?: () => void;
}

const EXAMPLE_PROMPTS = [
  'Training plan for my first 5K race',
  'Starting a small business from home',
  'Preparing for a job interview',
  'Planning a wedding in 12 months',
  'Home renovation project by phase',
  'Learning to cook healthy meals from scratch',
  'Getting out of debt in 2 years',
  'Starting a vegetable garden',
];

export default function AiTaskLibraryGenerator({ open, onClose, onSeeded }: AiTaskLibraryGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; categories: GeneratedCategory[] } | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set([0]));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setPrompt('');
    setPreview(null);
    setExpandedCats(new Set([0]));
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/ai/generate-task-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), previewOnly: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Failed to generate list');
        return;
      }
      setPreview({ title: data.title, categories: data.categories });
      setExpandedCats(new Set([0]));
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = async () => {
    if (!prompt.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ai/generate-task-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), previewOnly: false }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Failed to save list');
        return;
      }
      setDone(true);
      toast.success(`"${data.title}" added — ${data.categories} categories, ${data.tasks} tasks!`);
      onSeeded?.();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCat = (i: number) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalTasks = preview?.categories.reduce((sum, c) => sum + c.items.length, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Generate a Task List with AI
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Describe any goal, project, or life event and AI will build an organized checklist for you.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Input area */}
          {!done && (
            <div className="space-y-3">
              <textarea
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="e.g. 'CBU nursing plan for a 4-year student' or 'Planning a mission trip to Guatemala' or 'Training for my first marathon'…"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(); }}
                disabled={loading || saving}
              />

              {/* Example prompts */}
              {!preview && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Try one of these:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS.map(ex => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={generate}
                  disabled={!prompt.trim() || loading || saving}
                  className="flex-1"
                  style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> {preview ? 'Regenerate' : 'Generate List'}</>
                  )}
                </Button>
                {preview && (
                  <Button variant="outline" onClick={reset} disabled={saving}>
                    Start Over
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Done state */}
          {done && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-teal-500 mx-auto" />
              <p className="font-semibold text-lg">List added to your Task Library!</p>
              <p className="text-sm text-gray-500">Find it in Settings → Manage Task Library</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" onClick={reset}>Generate Another</Button>
                <Button onClick={handleClose} style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !done && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{preview.title}</p>
                  <p className="text-xs text-gray-400">{preview.categories.length} categories · {totalTasks} tasks</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden divide-y">
                {preview.categories.map((cat, i) => (
                  <div key={i}>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      onClick={() => toggleCat(i)}
                    >
                      {expandedCats.has(i)
                        ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      }
                      <span className="text-sm font-medium flex-1">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.items.length}</span>
                    </button>
                    {expandedCats.has(i) && (
                      <ul className="divide-y dark:divide-gray-700">
                        {cat.items.map((item, j) => (
                          <li key={j} className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={saveToLibrary}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #0f4c5c, #0f766e)' }}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving to Library…</>
                  : <><CheckCircle2 className="h-4 w-4 mr-2" /> Add to My Task Library</>
                }
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
