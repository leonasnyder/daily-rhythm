import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/habit-completions?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const completions = await sql`
    SELECT id, habit_id, completed_date
    FROM dr_habit_completions
    WHERE user_id = ${userId} AND completed_date = ${date}
  `;

  return NextResponse.json(completions);
}

// POST /api/habit-completions — toggle a habit completion
export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { habit_id, date, completed } = await req.json();
  if (!habit_id || !date) {
    return NextResponse.json({ error: 'habit_id and date are required' }, { status: 400 });
  }

  if (completed) {
    // Mark complete (insert if not exists)
    const [row] = await sql`
      INSERT INTO dr_habit_completions (user_id, habit_id, completed_date)
      VALUES (${userId}, ${habit_id}, ${date})
      ON CONFLICT (user_id, habit_id, completed_date) DO NOTHING
      RETURNING id, habit_id, completed_date
    `;
    return NextResponse.json(row ?? { habit_id, completed_date: date });
  } else {
    // Mark incomplete (delete)
    await sql`
      DELETE FROM dr_habit_completions
      WHERE user_id = ${userId} AND habit_id = ${habit_id} AND completed_date = ${date}
    `;
    return NextResponse.json({ habit_id, completed_date: date, removed: true });
  }
}

// GET /api/habit-completions/streaks — get streak data for all habits
// We reuse the GET with a ?mode=streaks query param
