import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';
import { SEED_ACTIVITIES } from '@/lib/seed-activities';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    const existing = await sql`
      SELECT id FROM activities WHERE user_id = ${userId} LIMIT 1
    `;
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ message: 'Activities already seeded' });
    }

    for (const act of SEED_ACTIVITIES) {
      const [{ id: actId }] = await sql`
        INSERT INTO activities (user_id, name, description, category, color, is_default)
        VALUES (${userId}, ${act.name}, ${act.description}, ${act.category}, ${act.color}, ${act.is_default})
        RETURNING id
      ` as Array<{ id: number }>;

      for (const sub of act.sub_activities) {
        await sql`
          INSERT INTO activity_sub_activities (activity_id, label)
          VALUES (${actId}, ${sub})
        `;
      }

      for (const d of act.defaults) {
        await sql`
          INSERT INTO activity_defaults (activity_id, default_time, default_duration)
          VALUES (${actId}, ${d.time}, ${d.duration})
        `;
      }
    }

    return NextResponse.json({ success: true, count: SEED_ACTIVITIES.length });
  } catch (e) {
    console.error('Activity seed error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
