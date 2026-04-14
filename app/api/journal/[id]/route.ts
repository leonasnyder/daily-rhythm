import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/journal/[id] — fetch single entry
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rows = await sql`
    SELECT id, entry_date, title, content, mood, created_at, updated_at
    FROM dr_journal_entries
    WHERE id = ${params.id} AND user_id = ${userId}
    LIMIT 1
  ` as unknown as Array<Record<string, unknown>>;

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// PATCH /api/journal/[id] — update entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { title, content, mood, entry_date } = await req.json();

  const rows = await sql`
    UPDATE dr_journal_entries
    SET
      title      = COALESCE(${title?.trim() ?? null}, title),
      content    = COALESCE(${content ?? null}, content),
      mood       = COALESCE(${mood ?? null}, mood),
      entry_date = COALESCE(${entry_date ?? null}, entry_date),
      updated_at = NOW()
    WHERE id = ${params.id} AND user_id = ${userId}
    RETURNING id, entry_date, title, content, mood, updated_at
  ` as unknown as Array<Record<string, unknown>>;

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// DELETE /api/journal/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  await sql`
    DELETE FROM dr_journal_entries
    WHERE id = ${params.id} AND user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}
