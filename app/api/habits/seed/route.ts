import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { STARTER_HABITS } from '@/lib/seed-habits';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  try {
    // Check if habits already exist
    const existing = await sql`
      SELECT id FROM dr_habits WHERE user_id = ${userId} LIMIT 1
    `;

    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ message: 'Habits already seeded' });
    }

    // Group by category to assign sort_order per category
    const categoryCounters: Record<string, number> = {};

    await sql.begin(async sql => {
      for (const habit of STARTER_HABITS) {
        if (categoryCounters[habit.category] === undefined) {
          categoryCounters[habit.category] = 0;
        }
        const sortOrder = categoryCounters[habit.category]++;

        await sql`
          INSERT INTO dr_habits (user_id, name, category, color, frequency, sort_order)
          VALUES (
            ${userId},
            ${habit.name},
            ${habit.category},
            ${habit.color},
            ${habit.frequency},
            ${sortOrder}
          )
        `;
      }
    });

    return NextResponse.json({ success: true, count: STARTER_HABITS.length });
  } catch (e) {
    console.error('Habit seed error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
