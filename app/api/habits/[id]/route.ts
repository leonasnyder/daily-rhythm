import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/habits/[id] — update habit name, category, color, frequency, is_active
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.name === 'string') updates.name = body.name.trim();
  if (typeof body.category === 'string') updates.category = body.category;
  if (typeof body.color === 'string') updates.color = body.color;
  if (typeof body.frequency === 'string') updates.frequency = body.frequency;
  if (typeof body.is_active === 'number') updates.is_active = body.is_active;
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const [habit] = await sql`
    UPDATE dr_habits
    SET ${sql(updates)}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, name, category, color, frequency, is_active, sort_order, created_at
  `;

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(habit);
}

// DELETE /api/habits/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await sql`DELETE FROM dr_habits WHERE id = ${id} AND user_id = ${userId}`;
  return new NextResponse(null, { status: 204 });
}
