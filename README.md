# 英単語フラッシュカード (日本語 ⇄ 英語)

添付いただいた日本語⇄ベトナム語カードと同じ操作感の、日本語⇄英語フラッシュカードアプリです。

- 表面: 日本語　/　裏面: 英語 + 発音記号 + 発音ボタン
- 左右ボタン（または ← → キー）で前後のカードに移動
- 「覚えた / まだ覚えていない」で習熟度を記録（Supabaseに保存）
- カテゴリー・習熟度でフィルター
- CSVアップロードで単語を一括登録
- 発音はブラウザ標準の音声合成 (Web Speech API / `speechSynthesis`) を使用。追加のAPIキーや課金は不要です

## 技術構成

- Next.js 14 (App Router) + React
- Supabase (Postgres) … 単語データの保存先
- Web Speech API (ブラウザ標準) … テキスト読み上げ
- デプロイ先: Vercel

---

## 1. ローカルでセットアップ

作業フォルダ例: `C:\Users\Admin\.Claude`

```bash
cd C:\Users\Admin\.Claude
git clone https://github.com/ITM-kaiwa/ENG.git
cd ENG
# このプロジェクトの中身(package.json など)をこのフォルダにコピーしてください
npm install
```

`.env.local.example` を `.env.local` にコピーし、下記の手順で取得した値を入力します。

```bash
copy .env.local.example .env.local
```

---

## 2. Supabaseのセットアップ

1. https://supabase.com にログインし、新規プロジェクトを作成します。
2. 左メニュー「SQL Editor」を開き、`supabase/schema.sql` の中身を貼り付けて実行します。
   - `words` テーブルが作成され、サンプル単語が5件登録されます。
3. 左メニュー「Project Settings」→「API」を開き、以下を `.env.local` にコピーします。
   - `Project URL` → `SUPABASE_URL`
   - `service_role` キー（**secret**と書かれている方。anonキーではありません）→ `SUPABASE_SERVICE_ROLE_KEY`

> service_role キーは強い権限を持つため、サーバー側のAPIルート (`app/api/*`) からのみ使用しています。ブラウザに公開される `NEXT_PUBLIC_*` の変数には入れていません。

---

## 3. 発音について

発音ボタンを押すと、ブラウザ標準の音声合成 (Web Speech API) で英単語を読み上げます。
追加のAPIキーや設定は不要ですが、以下の点にご注意ください。

- 対応状況・音質はブラウザやOS、インストールされている音声パックによって異なります（Chrome / Edge / Safari で利用可能。英語の音声が入っていない環境では読み上げない場合があります）。
- スマートフォンではブラウザの言語設定によって発音が変わることがあります。

---

## 4. ローカルで起動して確認

```bash
npm run dev
```

http://localhost:3000 を開いて動作を確認してください。
単語がまだ無い場合は「+ CSVで単語を追加」から `sample_words.csv` をアップロードしてみてください。

---

## 5. GitHubにpush

```bash
git add .
git commit -m "英単語フラッシュカードアプリ 初期版"
git push origin main
```

---

## 6. Vercelにデプロイ

1. https://vercel.com にログインし、「Add New... → Project」からGitHubリポジトリ `ITM-kaiwa/ENG` をインポートします。
2. Framework Preset は自動で `Next.js` が選択されます。
3. 「Environment Variables」で以下を登録します（`.env.local` と同じ内容）。
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 「Deploy」をクリックすればデプロイ完了です。以後、`main` ブランチにpushするたびに自動で再デプロイされます。

---

## CSVフォーマット

```csv
category,japanese,english,phonetic,example_en,example_ja
動物,ねこ,cat,[kæt],The cat is sleeping.,その猫は眠っています。
食べ物,りんご,apple,[ˈæpəl],She ate a red apple.,彼女は赤いりんごを食べました。
```

- `category` / `phonetic` / `example_en` / `example_ja` は空欄でも登録できます。
- ヘッダー行は必須です。

## 例文列を後から追加する場合

すでにSupabaseで `words` テーブルを作成済みの場合は、SQL Editorで `supabase/migration_add_examples.sql` の内容を実行してください（既存データは保持されたまま `example_en` / `example_ja` 列が追加されます）。新規セットアップの場合は `supabase/schema.sql` に最初から含まれています。

---

## フォルダ構成

```
app/
  page.js            … カード表示のメイン画面
  upload/page.js     … CSVアップロード画面
  api/words/route.js … 単語一覧の取得・習熟度の更新
  api/upload/route.js… CSV一括登録
lib/supabaseAdmin.js … Supabaseサーバークライアント
supabase/schema.sql  … テーブル作成SQL
sample_words.csv      … アップロード確認用サンプル
```
