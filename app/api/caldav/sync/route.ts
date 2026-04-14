import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';
import { fetchAllEventsForDate } from '@/lib/caldav';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date param required (YYYY-MM-DD)' }, { status: 400 });
  }

  // Load credentials
  const rows = await sql`
    SELECT server_url, username, password, enabled
    FROM dr_caldav_credentials
    WHERE user_id = ${userId}
    LIMIT 1
  ` as unknown as Array<{ server_url: string; username: string; password: string; enabled: boolean }>;

  if (rows.length === 0 || !rows[0].enabled) {
    return NextResponse.json([]);
  }

  const { server_url, username, password } = rows[0];

  try {
    const events = await fetchAllEventsForDate(server_url, username, password, date);
    return NextResponse.json(events);
  } catch (e) {
    console.error('CalDAV sync error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
