import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';
import {
  discoverPrincipalUrl,
  getCalendarHome,
  listCalendars,
  fetchEventsForDate,
} from '@/lib/caldav';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const tzParam = req.nextUrl.searchParams.get('tz');
  const tz =
    tzParam && /^[A-Za-z_+\-]+(?:\/[A-Za-z_0-9+\-]+)*$/.test(tzParam) ? tzParam : undefined;

  const rows = await sql`
    SELECT server_url, username, password FROM dr_caldav_credentials
    WHERE user_id = ${userId} LIMIT 1
  ` as unknown as Array<{ server_url: string; username: string; password: string }>;

  if (!rows.length) return NextResponse.json({ error: 'No credentials saved' }, { status: 400 });

  const { server_url, username, password } = rows[0];

  try {
    const principalUrl = await discoverPrincipalUrl(server_url, username, password);
    const calendarHome = await getCalendarHome(principalUrl, username, password);
    const calendars = await listCalendars(calendarHome, username, password);

    const results = await Promise.all(
      calendars.map(async cal => {
        try {
          const events = await fetchEventsForDate(cal.url, username, password, date, tz);
          return { calendar: cal.displayName, url: cal.url, eventCount: events.length, events };
        } catch (e) {
          return { calendar: cal.displayName, url: cal.url, error: (e as Error).message };
        }
      })
    );

    return NextResponse.json({
      date,
      principalUrl,
      calendarHome,
      calendarCount: calendars.length,
      results,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
