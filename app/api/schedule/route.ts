import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getWeekStart } from '@/lib/utils';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Self-heal: make sure user_id columns exist before any INSERT that
// references them. Runs once per server instance.
let _columnsEnsured = false;
async function ensureColumns() {
  if (_columnsEnsured) return;
  try {
    await sql`ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS user_id UUID`;
    // removed / is_completed may be absent in older-created DBs and the
    // GET filters by `removed = 0`. If the column is missing the query
    // errors; if the default is NULL the row we just inserted is filtered
    // out even though it saved. Force presence and a 0 default so newly
    // inserted rows are visible without an explicit value.
    await sql`ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS removed INTEGER DEFAULT 0`;
    await sql`ALTER TABLE schedule_entries ALTER COLUMN removed SET DEFAULT 0`;
    await sql`UPDATE schedule_entries SET removed = 0 WHERE removed IS NULL`;
    await sql`ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS is_completed INTEGER DEFAULT 0`;
    await sql`ALTER TABLE schedule_entries ALTER COLUMN is_completed SET DEFAULT 0`;
    await sql`UPDATE schedule_entries SET is_completed = 0 WHERE is_completed IS NULL`;
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID`;
    await sql`ALTER TABLE activity_defaults ADD COLUMN IF NOT EXISTS days_of_week TEXT`;
    await sql`ALTER TABLE activity_usage_log ADD COLUMN IF NOT EXISTS user_id UUID`;
    // Also make sure the unique constraint is user-scoped — required for
    // the ON CONFLICT (user_id, activity_id, week_start) upsert below.
    try {
      await sql`ALTER TABLE activity_usage_log DROP CONSTRAINT IF EXISTS activity_usage_log_activity_id_week_start_key`;
    } catch { /* ignore */ }
    try {
      await sql`
        ALTER TABLE activity_usage_log
        ADD CONSTRAINT activity_usage_log_user_activity_week_key
        UNIQUE(user_id, activity_id, week_start)
      `;
    } catch { /* already exists or conflicting data — ignore */ }
    await sql`CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_id ON schedule_entries(user_id)`;
  } catch (e) {
    console.error('[schedule] ensureColumns failed:', e);
  }
  _columnsEnsured = true;
}

async function attachSubActivities(entries: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  if (entries.length === 0) return entries;
  const ids = entries.map(e => e.id as number);
  const subs = await sql`
    SELECT * FROM schedule_entry_sub_activities WHERE entry_id = ANY(${ids}) ORDER BY id
  `;
  const byEntry: Record<number, unknown[]> = {};
  for (const s of subs as unknown as Array<{ entry_id: number }>) {
    (byEntry[s.entry_id] ??= []).push(s);
  }
  return entries.map(e => ({ ...e, entry_sub_activities: byEntry[e.id as number] ?? [] }));
}

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;
  try {
    await ensureColumns();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let entries: Record<string, unknown>[];

    if (date) {
      const dayOfWeek = new Date(date + 'T12:00:00').getDay();
      const allDefaults = await sql`
        SELECT a.id as activity_id, ad.default_time, ad.default_duration, ad.days_of_week
        FROM activities a
        JOIN activity_defaults ad ON a.id = ad.activity_id
        WHERE a.is_default = 1 AND a.is_archived = 0 AND a.user_id = ${userId}
        ORDER BY ad.default_time
      `;
      const defaults = (allDefaults as unknown as Array<{ activity_id: number; default_time: string; default_duration: number; days_of_week: string | null }>).filter(d => {
        if (!d.days_of_week) return true;
        return d.days_of_week.split(',').map(Number).includes(dayOfWeek);
      });
      if (defaults.length > 0) {
        const existingActivityIds = await sql`
          SELECT activity_id FROM schedule_entries
          WHERE date = ${date} AND user_id = ${userId} AND activity_id IS NOT NULL
        `;
        const scheduledIds = new Set((existingActivityIds as unknown as Array<{ activity_id: number }>).map(r => r.activity_id));
        const missing = defaults.filter(d => !scheduledIds.has(d.activity_id));
        if (missing.length > 0) {
          const weekStart = getWeekStart(new Date(date + 'T12:00:00'));
          const activityIds = missing.map(d => d.activity_id);
          const times = missing.map(d => d.default_time);
          const durations = missing.map(d => d.default_duration);
          await sql`
            INSERT INTO schedule_entries (user_id, activity_id, date, time_slot, duration_minutes)
            SELECT ${userId}, unnest(${activityIds}::int[]), ${date}, unnest(${times}::text[]), unnest(${durations}::int[])
          `;
          await sql`
            INSERT INTO activity_usage_log (user_id, activity_id, week_start, times_scheduled)
            SELECT ${userId}, unnest(${activityIds}::int[]), ${weekStart}::date, 1
            ON CONFLICT(user_id, activity_id, week_start) DO UPDATE SET times_scheduled = activity_usage_log.times_scheduled + 1
          `;
        }
      }

      entries = await sql`
        SELECT se.*, a.name as activity_name, a.category, a.color
        FROM schedule_entries se
        LEFT JOIN activities a ON se.activity_id = a.id
        WHERE se.date = ${date} AND se.removed = 0 AND se.user_id = ${userId}
        ORDER BY se.time_slot
      ` as Record<string, unknown>[];
      // Debug: if the GET returns fewer rows than physically exist for this
      // user+date, log the gap so we can tell from Vercel logs whether a
      // saved row is being filtered out (e.g., by a NULL `removed` column).
      if (entries.length === 0) {
        const total = await sql`
          SELECT COUNT(*)::int AS n FROM schedule_entries
          WHERE date = ${date} AND user_id = ${userId}
        ` as unknown as Array<{ n: number }>;
        if (total[0]?.n > 0) {
          console.warn('[schedule GET] rows exist but filter hid them', {
            date, userId, totalForDate: total[0].n,
          });
        }
      }
    } else if (startDate && endDate) {
      const allDefaults = await sql`
        SELECT a.id as activity_id, ad.default_time, ad.default_duration, ad.days_of_week
        FROM activities a
        JOIN activity_defaults ad ON a.id = ad.activity_id
        WHERE a.is_default = 1 AND a.is_archived = 0 AND a.user_id = ${userId}
        ORDER BY ad.default_time
      ` as unknown as Array<{ activity_id: number; default_time: string; default_duration: number; days_of_week: string | null }>;

      if (allDefaults.length > 0) {
        const existingEntries = await sql`
          SELECT date, activity_id FROM schedule_entries
          WHERE date >= ${startDate} AND date <= ${endDate} AND user_id = ${userId} AND activity_id IS NOT NULL
        ` as unknown as Array<{ date: string | Date; activity_id: number }>;
        const scheduledSet = new Set(existingEntries.map(r => {
          const d = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
          return `${d}:${r.activity_id}`;
        }));

        const cur = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        // Collect all rows to insert across all days, then batch in 2 queries
        const allEntries: Array<{ activityId: number; dateStr: string; time: string; duration: number }> = [];
        const usageMap = new Map<string, { activityId: number; weekStart: string }>();

        while (cur <= end) {
          const y = cur.getFullYear();
          const mo = String(cur.getMonth() + 1).padStart(2, '0');
          const dy = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${mo}-${dy}`;
          const dayOfWeek = cur.getDay();
          const dayDefaults = allDefaults.filter(d =>
            !d.days_of_week || d.days_of_week.split(',').map(Number).includes(dayOfWeek)
          );
          const missing = dayDefaults.filter(d => !scheduledSet.has(`${dateStr}:${d.activity_id}`));
          if (missing.length > 0) {
            const weekStart = getWeekStart(new Date(dateStr + 'T12:00:00'));
            for (const d of missing) {
              allEntries.push({ activityId: d.activity_id, dateStr, time: d.default_time, duration: d.default_duration });
              const key = `${d.activity_id}:${weekStart}`;
              if (!usageMap.has(key)) usageMap.set(key, { activityId: d.activity_id, weekStart });
            }
          }
          cur.setDate(cur.getDate() + 1);
        }

        if (allEntries.length > 0) {
          const entryActIds = allEntries.map(r => r.activityId);
          const entryDates = allEntries.map(r => r.dateStr);
          const entryTimes = allEntries.map(r => r.time);
          const entryDurs = allEntries.map(r => r.duration);
          await sql`
            INSERT INTO schedule_entries (user_id, activity_id, date, time_slot, duration_minutes)
            SELECT ${userId}, unnest(${entryActIds}::int[]), unnest(${entryDates}::date[]), unnest(${entryTimes}::text[]), unnest(${entryDurs}::int[])
          `;
          const usageRows = Array.from(usageMap.values());
          const logActIds = usageRows.map(r => r.activityId);
          const logWeekStarts = usageRows.map(r => r.weekStart);
          await sql`
            INSERT INTO activity_usage_log (user_id, activity_id, week_start, times_scheduled)
            SELECT ${userId}, unnest(${logActIds}::int[]), unnest(${logWeekStarts}::date[]), 1
            ON CONFLICT(user_id, activity_id, week_start) DO UPDATE SET times_scheduled = activity_usage_log.times_scheduled + excluded.times_scheduled
          `;
        }
      }

      entries = await sql`
        SELECT se.*, a.name as activity_name, a.category, a.color
        FROM schedule_entries se
        LEFT JOIN activities a ON se.activity_id = a.id
        WHERE se.date >= ${startDate} AND se.date <= ${endDate} AND se.removed = 0 AND se.user_id = ${userId}
        ORDER BY se.date, se.time_slot
      ` as Record<string, unknown>[];
    } else {
      return NextResponse.json({ error: 'date or startDate+endDate required' }, { status: 400 });
    }

    return NextResponse.json(await attachSubActivities(entries));
  } catch (e) {
    console.error('[schedule GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
    await sql.begin(async sql => {
      await sql`
        DELETE FROM schedule_entry_sub_activities
        WHERE entry_id IN (SELECT id FROM schedule_entries WHERE date = ${date} AND user_id = ${userId})
      `;
      await sql`DELETE FROM schedule_entries WHERE date = ${date} AND user_id = ${userId}`;
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;
  try {
    await ensureColumns();
    const body = await req.json();
    const { activity_id, date, time_slot, duration_minutes, notes, sub_activity_ids, custom_sub_labels } = body;
    if (!date || !time_slot) return NextResponse.json({ error: 'date and time_slot required' }, { status: 400 });

    const [entry] = await sql`
      INSERT INTO schedule_entries (user_id, activity_id, date, time_slot, duration_minutes, notes, removed, is_completed)
      VALUES (${userId}, ${activity_id ?? null}, ${date}, ${time_slot}, ${duration_minutes ?? 30}, ${notes ?? null}, 0, 0)
      RETURNING *
    `;
    console.log('[schedule POST] inserted entry:', {
      id: (entry as { id: number }).id,
      user_id: userId,
      date,
      time_slot,
      activity_id,
    });

    if (activity_id) {
      const weekStart = getWeekStart(new Date(date + 'T12:00:00'));
      await sql`
        INSERT INTO activity_usage_log (user_id, activity_id, week_start, times_scheduled)
        VALUES (${userId}, ${activity_id}, ${weekStart}, 1)
        ON CONFLICT(user_id, activity_id, week_start) DO UPDATE SET times_scheduled = activity_usage_log.times_scheduled + 1
      `;
    }

    const hasSubs = (Array.isArray(sub_activity_ids) && sub_activity_ids.length > 0) ||
                    (Array.isArray(custom_sub_labels) && custom_sub_labels.length > 0);
    if (hasSubs) {
      const entryId = entry.id as number;
      await sql.begin(async sql => {
        if (Array.isArray(sub_activity_ids)) {
          for (const subId of sub_activity_ids as number[]) {
            const labels = await sql`SELECT label FROM activity_sub_activities WHERE id = ${subId} AND is_active = 1`;
            if (labels.length > 0) {
              await sql`
                INSERT INTO schedule_entry_sub_activities (entry_id, sub_activity_id, label, completed)
                VALUES (${entryId}, ${subId}, ${(labels[0] as { label: string }).label}, 0)
              `;
            }
          }
        }
        if (Array.isArray(custom_sub_labels)) {
          for (const label of custom_sub_labels as string[]) {
            if (typeof label === 'string' && label.trim()) {
              await sql`
                INSERT INTO schedule_entry_sub_activities (entry_id, sub_activity_id, label, completed)
                VALUES (${entryId}, null, ${label.trim()}, 0)
              `;
            }
          }
        }
      });
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error('[schedule POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
