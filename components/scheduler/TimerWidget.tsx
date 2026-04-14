'use client';
import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square, RotateCcw } from 'lucide-react';

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TimerWidget() {
  const [elapsed, setElapsed] = useState(0); // seconds
  const [running, setRunning] = useState(false);
  const [splits, setSplits] = useState<{ label: string; duration: number }[]>([]);
  const [label, setLabel] = useState('');
  const startRef = useRef<number>(0); // Date.now() when timer last started
  const baseRef = useRef<number>(0);  // accumulated seconds before current run

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000) + baseRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = () => {
    baseRef.current = elapsed;
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    const finalElapsed = Math.floor((Date.now() - startRef.current) / 1000) + baseRef.current;
    setElapsed(finalElapsed);
    baseRef.current = finalElapsed;
    if (finalElapsed > 0) {
      setSplits(prev => [
        { label: label.trim() || 'Activity', duration: finalElapsed },
        ...prev.slice(0, 4), // keep last 5
      ]);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    setLabel('');
  };

  const isZero = elapsed === 0 && !running;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Clock className="h-4 w-4 text-teal-600" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stopwatch</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Activity label */}
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Activity name (optional)"
          disabled={running}
          className="w-full text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
        />

        {/* Timer display */}
        <div className={`text-center font-mono font-bold transition-colors ${
          running
            ? 'text-3xl text-teal-600 dark:text-teal-400'
            : isZero
            ? 'text-3xl text-gray-300 dark:text-gray-600'
            : 'text-3xl text-gray-800 dark:text-gray-200'
        }`}>
          {formatElapsed(elapsed)}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!running ? (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              {elapsed > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
              Stop
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={isZero}
            className="p-2 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Recent splits */}
        {splits.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Recent</p>
            {splits.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{s.label}</span>
                <span className="font-mono text-gray-700 dark:text-gray-300 flex-shrink-0">{formatDuration(s.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
