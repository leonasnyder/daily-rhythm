import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Self-heal: make sure the schema columns we rely on exist. Without
// these the INSERTs below fail with "column does not exist" and the
// activity appears to silently refuse to save. Runs once per server
// instance. Safe no-ops when the columns are already present.
let _columnsEnsured = false;
async function ensureColumns() {
  if (_columnsEnsured) return;
  try {
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID`;
    await sql`ALTER TABLE activity_defaults ADD COLUMN IF NOT EXISTS days_of_week TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`;
  } catch (e) {
    console.error('[activities] ensureColumns failed:', e);
  }
  _columnsEnsured = true;
}

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;
  try {
    await ensureColumns();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const activities = includeArchived
      ? await sql`SELECT * FROM activities WHERE user_id = ${userId} ORDER BY name`
      : await sql`SELECT * FROM activities WHERE user_id = ${userId} AND is_archived = 0 ORDER BY name`;
    return NextResponse.json(activities);
  } catch (e) {
    console.error('[activities GET]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;
  try {
    await ensureColumns();
    const body = await req.json();
    const { name, description, category, color, is_default, default_time, default_duration, days_of_week, defaults } = body;
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const [activity] = await sql`
      INSERT INTO activities (user_id, name, description, category, color, is_default)
      VALUES (${userId}, ${name}, ${description ?? null}, ${category ?? null}, ${color ?? '#F97316'}, ${is_default ?? 0})
      RETURNING *
    `;

    if (Array.isArray(defaults) && defaults.length > 0) {
      for (const slot of defaults as Array<{ default_time: string; default_duration: number; days_of_week: string | null }>) {
        await sql`
          INSERT INTO activity_defaults (activity_id, default_time, default_duration, days_of_week)
          VALUES (${activity.id}, ${slot.default_time}, ${slot.default_duration ?? 30}, ${slot.days_of_week ?? null})
        `;
      }
    } else if (default_time) {
      await sql`
        INSERT INTO activity_defaults (activity_id, default_time, default_duration, days_of_week)
        VALUES (${activity.id}, ${default_time}, ${default_duration ?? 30}, ${days_of_week ?? null})
      `;
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (e) {
    console.error('[activities POST]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
