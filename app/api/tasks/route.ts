import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const tasks = await sql`
    SELECT id, title, notes, is_completed, completed_at, due_date, due_time, parent_id, sort_order, created_at
    FROM pa_tasks
    WHERE user_id = ${userId}
    ORDER BY is_completed ASC, COALESCE(parent_id, id) ASC, parent_id ASC NULLS FIRST, sort_order ASC, created_at ASC
  `;

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { title, notes, due_date, due_time, parent_id } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const rows = await sql`
    INSERT INTO pa_tasks (user_id, title, notes, due_date, due_time, parent_id)
    VALUES (${userId}, ${title.trim()}, ${notes ?? null}, ${due_date ?? null}, ${due_time ?? null}, ${parent_id ?? null})
    RETURNING id, title, notes, is_completed, completed_at, due_date, due_time, parent_id, sort_order, created_at
  ` as unknown as Array<Record<string, unknown>>;

  return NextResponse.json(rows[0], { status: 201 });
}
