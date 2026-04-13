import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    // Show redacted URL so we can verify format
    const url = process.env.DATABASE_URL;
    const redacted = url.replace(/:([^:@]+)@/, ':***@');

    const postgres = (await import('postgres')).default;
    const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10 });

    const result = await sql`SELECT current_database(), current_user, version()`;
    await sql.end();

    return NextResponse.json({
      success: true,
      url_used: redacted,
      db: result[0],
    });
  } catch (e: unknown) {
    const url = process.env.DATABASE_URL ?? 'NOT SET';
    const redacted = url.replace(/:([^:@]+)@/, ':***@');
    return NextResponse.json({
      error: String(e),
      url_used: redacted,
    }, { status: 500 });
  }
}
