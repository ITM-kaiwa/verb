'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

export default function Home() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/words');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '単語の取得に失敗しました');
        if (!cancelled) setWords(data.words || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(words.map((w) => w.category).filter(Boolean));
    return Array.from(set);
  }, [words]);

  const filtered = useMemo(() => {
    return words.filter((w) => {
      const catOk = categoryFilter === 'all' || w.category === categoryFilter;
      const statusOk = statusFilter === 'all' || w.status === statusFilter;
      return catOk && statusOk;
    });
  }, [words, categoryFilter, statusFilter]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    if (index >= filtered.length && filtered.length > 0) {
      setIndex(filtered.length - 1);
    }
  }, [filtered, index]);

  const current = filtered[index];

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.min(filtered.length - 1, i + 1));
  }, [filtered.length]);

  const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === ' ') {
        e.preventDefault();
        toggleFlip();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, toggleFlip]);

  async function setStatus(status) {
    if (!current) return;
    const wordId = current.id;
    setWords((prev) => prev.map((w) => (w.id === wordId ? { ...w, status } : w)));
    try {
      await fetch('/api/words', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wordId, status }),
      });
    } catch (err) {
      // ローカル表示はすでに更新済み。次回リロード時にサーバーと再同期されます。
      console.error('status update failed', err);
    }
    if (index < filtered.length - 1) {
      goNext();
    } else {
      setFlipped(false);
    }
  }

  function speak(text) {
    if (!text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">読み込み中...</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="page">
        <div className="empty-state">
          エラー: {loadError}
          <br />
          Supabase の環境変数 (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) を確認してください。
        </div>
      </main>
    );
  }

  if (words.length === 0) {
    return (
      <main className="page">
        <div className="empty-state">
          まだ単語が登録されていません。
          <br />
          <Link href="/upload">CSVをアップロード</Link>して単語を追加してください。
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="top-bar">
        <div className="progress-label">
          単語 {filtered.length === 0 ? 0 : index + 1} / {filtered.length}
        </div>
        <div className="top-controls">
          <select
            className="select-pill"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="カテゴリーで絞り込み"
          >
            <option value="all">すべてのカテゴリー</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="select-pill"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="習熟度で絞り込み"
          >
            <option value="all">すべて表示</option>
            <option value="unknown">まだ覚えていない</option>
            <option value="known">覚えた</option>
          </select>
          <Link href="/upload" className="upload-link">
            + CSVで単語を追加
          </Link>
        </div>
      </div>

      {!current ? (
        <div className="empty-state">条件に合う単語がありません。フィルターを変更してください。</div>
      ) : (
        <>
          <div className="stage">
            <button className="nav-btn" onClick={goPrev} disabled={index === 0} aria-label="前のカード">
              ‹
            </button>

            <div className="card-wrap">
              <div className="card" onClick={toggleFlip} role="button" tabIndex={0}>
                {!flipped ? (
                  <>
                    <div className="card-face-label">JP 日本語 (表)</div>
                    <div className="card-body">
                      <div className="main-word">{current.japanese}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="card-face-label">EN ENGLISH (裏)</div>
                    <div className="card-body">
                      <div className="main-word">{current.english}</div>
                      {current.phonetic && <div className="phonetic">[{current.phonetic.replace(/^\[|\]$/g, '')}]</div>}
                      <button
                        className="speak-btn"
                        disabled={speaking}
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(current.english);
                        }}
                      >
                        🔊 {speaking ? '再生中…' : '発音を聞く'}
                      </button>
                    </div>
                  </>
                )}

                <div className="card-footer">
                  <span>クリックでめくる</span>
                  {current.category && <span className="category-tag">{current.category}</span>}
                </div>
              </div>
            </div>

            <button
              className="nav-btn"
              onClick={goNext}
              disabled={index === filtered.length - 1}
              aria-label="次のカード"
            >
              ›
            </button>
          </div>

          <div className="actions">
            <button className="action-btn unknown" onClick={() => setStatus('unknown')}>
              ✕ まだ覚えていない
            </button>
            <button className="action-btn flip" onClick={toggleFlip}>
              🔄 めくる
            </button>
            <button className="action-btn known" onClick={() => setStatus('known')}>
              ✓ 覚えた
            </button>
          </div>
        </>
      )}
    </main>
  );
}
