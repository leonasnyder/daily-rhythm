import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — return credentials (password masked) + enabled status
export async function GET() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const rows = await sql`
    SELECT server_url, username, enabled
    FROM dr_caldav_credentials
    WHERE user_id = ${userId}
    LIMIT 1
  ` as unknown as Array<{ server_url: string; username: string; enabled: boolean }>;

  if (rows.length === 0) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    server_url: rows[0].server_url,
    username: rows[0].username,
    enabled: rows[0].enabled,
  });
}

// POST — save or update credentials
export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { server_url, username, password, enabled } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
  }

  await sql`
    INSERT INTO dr_caldav_credentials (user_id, server_url, username, password, enabled)
    VALUES (
      ${userId},
      ${server_url ?? 'https://caldav.icloud.com'},
      ${username.trim()},
      ${password.trim()},
      ${enabled ?? true}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      server_url = EXCLUDED.server_url,
      username   = EXCLUDED.username,
      password   = EXCLUDED.password,
      enabled    = EXCLUDED.enabled,
      updated_at = NOW()
  `;

  return NextResponse.json({ success: true });
}

// DELETE — disconnect
export async function DELETE() {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  await sql`DELETE FROM dr_caldav_credentials WHERE user_id = ${userId}`;
  return NextResponse.json({ success: true });
}

// PATCH — toggle enabled
export async function PATCH(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { enabled } = await req.json();
  await sql`
    UPDATE dr_caldav_credentials SET enabled = ${enabled}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  return NextResponse.json({ success: true });
}
