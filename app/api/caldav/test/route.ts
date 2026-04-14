import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { testCalDAVConnection } from '@/lib/caldav';

export const dynamic = 'force-dynamic';

// POST { server_url, username, password } — test without saving
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const { server_url, username, password } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  }

  const result = await testCalDAVConnection(
    server_url ?? 'https://caldav.icloud.com',
    username.trim(),
    password.trim()
  );

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
