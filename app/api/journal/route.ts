import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/journal — list all entries for user (newest first)
export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const entries = await sql`
    SELECT id, entry_date, title, mood, LEFT(content, 200) AS preview, created_at, updated_at
    FROM dr_journal_entries
    WHERE user_id = ${userId}
    ORDER BY entry_date DESC, created_at DESC
  `;

  return NextResponse.json(entries);
}

// POST /api/journal — create new entry
export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { entry_date, title, content, mood } = await req.json();

  const [entry] = await sql`
    INSERT INTO dr_journal_entries (user_id, entry_date, title, content, mood)
    VALUES (
      ${userId},
      ${entry_date ?? new Date().toISOString().slice(0, 10)},
      ${title?.trim() ?? null},
      ${content ?? ''},
      ${mood ?? null}
    )
    RETURNING id, entry_date, title, content, mood, created_at, updated_at
  ` as unknown as Array<Record<string, unknown>>;

  return NextResponse.json(entry, { status: 201 });
}
