import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/habits — fetch all habits for the current user
export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const habits = await sql`
    SELECT id, name, category, color, frequency, is_active, sort_order, created_at
    FROM dr_habits
    WHERE user_id = ${userId}
    ORDER BY category ASC, sort_order ASC, created_at ASC
  `;

  return NextResponse.json(habits);
}

// POST /api/habits — create a new habit
export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { name, category, color, frequency } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // Get max sort_order for this category
  const [{ max }] = await sql`
    SELECT COALESCE(MAX(sort_order), -1) as max
    FROM dr_habits
    WHERE user_id = ${userId} AND category = ${category ?? 'General'}
  `;

  const [habit] = await sql`
    INSERT INTO dr_habits (user_id, name, category, color, frequency, sort_order)
    VALUES (
      ${userId},
      ${name.trim()},
      ${category ?? 'General'},
      ${color ?? '#6B7280'},
      ${frequency ?? 'daily'},
      ${(max as number) + 1}
    )
    RETURNING id, name, category, color, frequency, is_active, sort_order, created_at
  `;

  return NextResponse.json(habit, { status: 201 });
}
