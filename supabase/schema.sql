-- Supabase SQL Editor でこのファイルの内容を貼り付けて実行してください

create table if not exists words (
  id bigint generated always as identity primary key,
  category text,
  japanese text not null,
  english text not null,
  phonetic text,
  status text not null default 'unknown' check (status in ('known', 'unknown')),
  created_at timestamptz not null default now()
);

create index if not exists words_category_idx on words (category);
create index if not exists words_status_idx on words (status);

-- このアプリはサーバー側で service role キーを使ってアクセスするため、
-- RLS を有効にして匿名クライアントからの直接アクセスは遮断します。
alter table words enable row level security;

-- サンプルデータ (お試し用。不要であれば削除してください)
insert into words (category, japanese, english, phonetic) values
  ('動物', 'ねこ', 'cat', '[kæt]'),
  ('動物', 'いぬ', 'dog', '[dɔːg]'),
  ('食べ物', 'りんご', 'apple', '[ˈæpəl]'),
  ('食べ物', 'パン', 'bread', '[bred]'),
  ('人・職業', '先生', 'teacher', '[ˈtiːtʃər]');
