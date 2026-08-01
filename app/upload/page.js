'use client';

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';

export default function UploadPage() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const cleaned = result.data.filter((r) => (r.japanese || '').trim() && (r.english || '').trim());
        setRows(cleaned);
        if (cleaned.length === 0) {
          setStatus('❌ 有効な行が見つかりませんでした。ヘッダーが category,japanese,english,phonetic になっているか確認してください。');
        }
      },
      error: (err) => setStatus(`❌ 読み込みエラー: ${err.message}`),
    });
  }

  async function handleUpload() {
    if (rows.length === 0) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'アップロードに失敗しました');
      setStatus(`✅ ${data.inserted}件の単語を登録しました。トップページで確認できます。`);
      setRows([]);
      setFileName('');
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="upload-page">
      <div className="upload-card">
        <Link href="/" className="back-link">
          ← カードに戻る
        </Link>
        <h1>CSVで単語を一括登録</h1>
        <p>
          次の6列を持つCSVファイルを用意してください:{' '}
          <code>category,japanese,english,phonetic,example_en,example_ja</code>
          <br />
          例: <code>動物,ねこ,cat,[kæt],The cat is sleeping.,その猫は眠っています。</code>
          <br />
          （category / phonetic / example_en / example_ja は空欄でも構いません）
        </p>

        <div className="file-drop">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          {fileName && <p style={{ marginBottom: 0 }}>選択中: {fileName}</p>}
        </div>

        {rows.length > 0 && (
          <>
            <p>{rows.length}件のプレビュー(先頭5件):</p>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>category</th>
                  <th>japanese</th>
                  <th>english</th>
                  <th>phonetic</th>
                  <th>example_en</th>
                  <th>example_ja</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    <td>{r.category}</td>
                    <td>{r.japanese}</td>
                    <td>{r.english}</td>
                    <td>{r.phonetic}</td>
                    <td>{r.example_en}</td>
                    <td>{r.example_ja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="primary-btn" onClick={handleUpload} disabled={busy}>
              {busy ? '登録中…' : `${rows.length}件をSupabaseに登録`}
            </button>
          </>
        )}

        {status && <p className="status-msg">{status}</p>}
      </div>
    </main>
  );
}
