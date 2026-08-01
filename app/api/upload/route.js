import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabaseが設定されていません。' }, { status: 500 });
  }
  try {
    const { rows } = await request.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rowsが空です。' }, { status: 400 });
    }

    const cleaned = rows
      .map((r) => ({
        category: (r.category || '').toString().trim() || null,
        japanese: (r.japanese || '').toString().trim(),
        english: (r.english || '').toString().trim(),
        phonetic: (r.phonetic || '').toString().trim() || null,
        example_en: (r.example_en || '').toString().trim() || null,
        example_ja: (r.example_ja || '').toString().trim() || null,
      }))
      .filter((r) => r.japanese && r.english);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: '有効な行がありません。japaneseとenglishは必須です。' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('words').insert(cleaned);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ inserted: cleaned.length });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
