import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabaseが設定されていません。SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを設定してください。' },
      { status: 500 }
    );
  }

  let allWords = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('words')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + step - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    allWords = allWords.concat(data);

    if (data.length < step) {
      hasMore = false;
    } else {
      from += step;
    }
  }

  return NextResponse.json({ words: allWords });
}

export async function PATCH(request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabaseが設定されていません。' }, { status: 500 });
  }
  const { id, status } = await request.json();
  if (!id || !['known', 'unknown'].includes(status)) {
    return NextResponse.json({ error: 'idとstatus(known/unknown)が必要です。' }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from('words').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
