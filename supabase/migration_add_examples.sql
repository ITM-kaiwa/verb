-- 既存の words テーブルに例文列を追加するマイグレーション
-- Supabase の SQL Editor に貼り付けて実行してください（既存データは保持されます）

alter table words add column if not exists example_en text;
alter table words add column if not exists example_ja text;
