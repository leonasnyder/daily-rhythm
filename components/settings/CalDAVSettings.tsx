'use client';
import { useState, useEffect } from 'react';
import { CalendarCheck, Check, Loader2, Trash2, RefreshCw, ExternalLink, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Credentials {
  connected: boolean;
  server_url?: string;
  username?: string;
  enabled?: boolean;
}

export default function CalDAVSettings() {
  const [creds, setCreds] = useState<Credentials>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; calendarCount?: number; error?: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [serverUrl, setServerUrl] = useState('https://caldav.icloud.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('/api/caldav/credentials')
      .then(r => r.json())
      .then((data: Credentials) => {
        setCreds(data);
        if (data.connected) {
          setServerUrl(data.server_url ?? 'https://caldav.icloud.com');
          setUsername(data.username ?? '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/caldav/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_url: serverUrl, username, password }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/caldav/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_url: serverUrl, username, password, enabled: true }),
      });
      if (!res.ok) throw new Error();
      setCreds({ connected: true, server_url: serverUrl, username, enabled: true });
      setShowForm(false);
      setPassword('');
      toast.success('Apple Calendar connected!');
    } catch {
      toast.error('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Apple Calendar? Your events will no longer show in the schedule.')) return;
    await fetch('/api/caldav/credentials', { method: 'DELETE' });
    setCreds({ connected: false });
    setUsername('');
    setPassword('');
    setTestResult(null);
    toast.success('Apple Calendar disconnected');
  };

  const handleToggleEnabled = async () => {
    const next = !creds.enabled;
    await fetch('/api/caldav/credentials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
    setCreds(prev => ({ ...prev, enabled: next }));
    toast.success(next ? 'Apple Calendar enabled' : 'Apple Calendar paused');
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <span className="font-medium text-gray-900 dark:text-white">Apple Calendar</span>
          {creds.connected && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              creds.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {creds.enabled ? 'Connected' : 'Paused'}
            </span>
          )}
        </div>

        {creds.connected && !showForm && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleEnabled}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {creds.enabled ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Connected summary */}
      {creds.connected && !showForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Syncing from <span className="font-medium text-gray-700 dark:text-gray-300">{creds.username}</span>.
          Your Apple Calendar events appear in the daily schedule view.
        </p>
      )}

      {/* Connect button when not connected */}
      {!creds.connected && !showForm && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Show your Apple Calendar events directly inside the daily schedule.
            Requires an App-Specific Password from Apple.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setShowForm(true); setShowInstructions(true); }}>
            <CalendarCheck className="h-4 w-4 mr-1.5" />
            Connect Apple Calendar
          </Button>
        </div>
      )}

      {/* Setup form */}
      {showForm && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">

          {/* Instructions accordion */}
          <div className="rounded-md border border-blue-200 dark:border-blue-800 overflow-hidden">
            <button
              onClick={() => setShowInstructions(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-800 dark:text-blue-300"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How to get an App-Specific Password
              </span>
              {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showInstructions && (
              <div className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 space-y-2 bg-white dark:bg-gray-800">
                <p>Apple requires an <strong>App-Specific Password</strong> (not your main Apple ID password) to connect third-party apps to iCloud.</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Go to <strong>appleid.apple.com</strong> and sign in.</li>
                  <li>Under <strong>Sign-In and Security</strong>, tap <strong>App-Specific Passwords</strong>.</li>
                  <li>Tap the <strong>+</strong> icon and label it <em>Daily Rhythm</em>.</li>
                  <li>Copy the generated password (format: xxxx-xxxx-xxxx-xxxx).</li>
                </ol>
                <a
                  href="https://support.apple.com/en-us/102654"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Apple's official guide <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apple ID (email)
              </label>
              <input
                type="email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="you@icloud.com"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                App-Specific Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="mt-1 text-xs text-gray-400">Generated at appleid.apple.com — not your main password.</p>
            </div>

            {/* Server URL (advanced) */}
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                Advanced: custom CalDAV server
              </summary>
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Server URL</label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </details>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-md p-3 text-sm flex items-start gap-2 ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}>
              {testResult.success
                ? <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              }
              <span>
                {testResult.success
                  ? `Connected! Found ${testResult.calendarCount} calendar${testResult.calendarCount === 1 ? '' : 's'}.`
                  : `Connection failed: ${testResult.error}`
                }
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(false); setTestResult(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !username || !password}
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Test Connection
            </Button>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleSave}
              disabled={saving || !username || !password}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Save &amp; Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
