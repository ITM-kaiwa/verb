-- Supabase SQL Editor でこのファイルの内容を貼り付けて実行してください
-- (新規セットアップ用。既存プロジェクトに列を追加する場合は migration_add_examples.sql を使ってください)

create table if not exists words (
  id bigint generated always as identity primary key,
  category text,
  japanese text not null,
  english text not null,
  phonetic text,
  example_en text,
  example_ja text,
  status text not null default 'unknown' check (status in ('known', 'unknown')),
  created_at timestamptz not null default now()
);

create index if not exists words_category_idx on words (category);
create index if not exists words_status_idx on words (status);

-- このアプリはサーバー側で service role キーを使ってアクセスするため、
-- RLS を有効にして匿名クライアントからの直接アクセスは遮断します。
alter table words enable row level security;

-- サンプルデータ (お試し用。不要であれば削除してください)
insert into words (category, japanese, english, phonetic, example_en, example_ja) values
  ('動物', 'ねこ', 'cat', '[kæt]', 'The cat is sleeping on the sofa.', 'その猫はソファで眠っています。'),
  ('動物', 'いぬ', 'dog', '[dɔːg]', 'My dog likes to run in the park.', '私の犬は公園を走るのが好きです。'),
  ('食べ物', 'りんご', 'apple', '[ˈæpəl]', 'She ate a red apple for breakfast.', '彼女は朝食に赤いりんごを食べました。'),
  ('食べ物', 'パン', 'bread', '[bred]', 'We bought fresh bread this morning.', '今朝、焼きたてのパンを買いました。'),
  ('人・職業', '先生', 'teacher', '[ˈtiːtʃər]', 'The teacher explained the lesson clearly.', 'その先生は授業をわかりやすく説明しました。');
