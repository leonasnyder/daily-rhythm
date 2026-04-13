import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface GeneratedCategory {
  name: string;
  items: string[];
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await requireUser();
  if (errorResponse) return errorResponse;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI features require an OPENAI_API_KEY. Add it in Vercel environment variables.' },
      { status: 503 }
    );
  }

  const { prompt, previewOnly } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const systemPrompt = `You are a task list generator for a daily life planner app.
The user will describe a goal, project, life event, or area of life they want to organize.
Your job is to generate a well-organized, practical task checklist organized into categories.

Rules:
- Generate 3 to 8 categories (sections) depending on the complexity of the request
- Each category should have 8 to 15 specific, actionable tasks
- Category names should be clear and descriptive (e.g. "Marathon Training — Week 1-4: Base Building")
- Tasks should be specific and actionable (not vague like "do stuff")
- Tasks should be things a real person would check off one by one
- Do NOT include markdown, bullet points, or formatting — just plain text tasks
- Tailor the content precisely to what the user described
- If it's a multi-phase plan (e.g. by month, semester, trimester), organize categories by phase
- If it's a topic/skill area, organize by subtopic or difficulty level

Respond ONLY with valid JSON in this exact shape:
{
  "title": "Short descriptive title for this list",
  "categories": [
    {
      "name": "Category Name Here",
      "items": [
        "Task one",
        "Task two",
        "Task three"
      ]
    }
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt.trim() },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message ?? 'OpenAI error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { title: string; categories: GeneratedCategory[] };

    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 });
    }

    // If preview only, return without saving
    if (previewOnly) {
      return NextResponse.json({ preview: true, ...parsed });
    }

    // Get the current max sort_order for this user
    const [{ max: currentMax }] = await sql`
      SELECT COALESCE(MAX(sort_order), 499) as max
      FROM task_library_categories
      WHERE user_id = ${userId}
    ` as Array<{ max: number }>;

    let sortOffset = (currentMax as number) + 1;

    await sql.begin(async sql => {
      for (const cat of parsed.categories) {
        if (!cat.name || !Array.isArray(cat.items)) continue;

        const [{ id: categoryId }] = await sql`
          INSERT INTO task_library_categories (user_id, name, sort_order)
          VALUES (${userId}, ${cat.name.trim()}, ${sortOffset++})
          RETURNING id
        ` as Array<{ id: number }>;

        for (let i = 0; i < cat.items.length; i++) {
          const item = cat.items[i];
          if (typeof item === 'string' && item.trim()) {
            await sql`
              INSERT INTO task_library_items (user_id, category_id, label, sort_order)
              VALUES (${userId}, ${categoryId}, ${item.trim()}, ${i})
            `;
          }
        }
      }
    });

    const totalTasks = parsed.categories.reduce((sum, c) => sum + (c.items?.length ?? 0), 0);

    return NextResponse.json({
      success: true,
      title: parsed.title,
      categories: parsed.categories.length,
      tasks: totalTasks,
      preview: parsed.categories,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
