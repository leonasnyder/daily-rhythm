import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import sql from '@/lib/db';
import { TASK_LIBRARY_SEED } from '@/lib/task-library-seed';
import { SEED_ACTIVITIES } from '@/lib/seed-activities';

export const dynamic = 'force-dynamic';

async function seedTaskLibrary(userId: string) {
  const existing = await sql`
    SELECT id FROM task_library_categories WHERE user_id = ${userId} LIMIT 1
  `;
  if ((existing as unknown[]).length > 0) return;

  await sql.begin(async sql => {
    for (const cat of TASK_LIBRARY_SEED) {
      const [{ id: categoryId }] = await sql`
        INSERT INTO task_library_categories (user_id, name, sort_order)
        VALUES (${userId}, ${cat.name}, ${cat.sort_order})
        RETURNING id
      ` as Array<{ id: number }>;

      for (let i = 0; i < cat.items.length; i++) {
        await sql`
          INSERT INTO task_library_items (user_id, category_id, label, sort_order)
          VALUES (${userId}, ${categoryId}, ${cat.items[i]}, ${i})
        `;
      }
    }
  });
}

async function seedActivities(userId: string) {
  const existing = await sql`
    SELECT id FROM activities WHERE user_id = ${userId} LIMIT 1
  `;
  if ((existing as unknown[]).length > 0) return;

  for (const act of SEED_ACTIVITIES) {
    const [{ id: actId }] = await sql`
      INSERT INTO activities (user_id, name, description, category, color, is_default)
      VALUES (${userId}, ${act.name}, ${act.description}, ${act.category}, ${act.color}, ${act.is_default})
      RETURNING id
    ` as Array<{ id: number }>;

    for (const sub of act.sub_activities) {
      await sql`
        INSERT INTO activity_sub_activities (activity_id, label)
        VALUES (${actId}, ${sub})
      `;
    }

    for (const d of act.defaults) {
      await sql`
        INSERT INTO activity_defaults (activity_id, default_time, default_duration)
        VALUES (${actId}, ${d.time}, ${d.duration})
      `;
    }
  }
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await req.json();

    const email = body?.record?.email ?? body?.email ?? 'Unknown';
    const userId = body?.record?.id ?? body?.id ?? null;
    const createdAt = body?.record?.created_at ?? new Date().toISOString();

    if (userId) {
      await seedTaskLibrary(userId);
      await seedActivities(userId);
    }

    if (process.env.NOTIFY_EMAIL && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Daily Rhythm <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL,
        subject: 'New user signed up — Daily Rhythm',
        html: `
          <p>A new user has signed up for Daily Rhythm.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Signed up:</strong> ${new Date(createdAt).toLocaleString()}</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
