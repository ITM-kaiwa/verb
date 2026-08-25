"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { conjugate, kanjiForForm } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import Furigana from "@/components/Furigana";
import type { DataSourceSetting, VerbEntry, VerbGroup } from "@/lib/types";

const HELP_BODY = [
  "Một động từ (thể từ điển) sẽ rơi xuống.",
  "Hãy nhấn đúng nhóm của nó: Nhóm I (godan), Nhóm II (ichidan), hoặc Nhóm III (bất quy tắc) trước khi nó rơi tới đáy.",
  "Biết đúng nhóm động từ là bước đầu tiên để chia đúng mọi thể!",
];

const TOTAL_ROUNDS = 8;
const FALL_DURATION_MS = 5500;

const LANES: { group: VerbGroup; label: string }[] = [
  { group: 1, label: "Nhóm I\n（godan）" },
  { group: 2, label: "Nhóm II\n（ichidan）" },
  { group: 3, label: "Nhóm III\n（bất quy tắc）" },
];

interface ResultInfo {
  success: boolean;
  timedOut: boolean;
}

export default function GroupSortGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [verb, setVerb] = useState<VerbEntry | null>(null);
  const [phase, setPhase] = useState<"falling" | "result" | "summary">("falling");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [fallTop, setFallTop] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const settledRef = useRef(false);

  const startFall = useCallback(() => {
    settledRef.current = false;
    setFallTop(0);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / FALL_DURATION_MS, 1);
      setFallTop(progress * 82);

      if (progress >= 1) {
        if (!settledRef.current) {
          settledRef.current = true;
          setResult({ success: false, timedOut: true });
          setPhase("result");
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startRound = useCallback(() => {
    const [v] = pickRandomVerbs(1, new Set(), sourceFilter(dataSource));
    setVerb(v);
    setResult(null);
    setPhase("falling");
    startFall();
  }, [dataSource, startFall]);

  useEffect(() => {
    setRound(1);
    setScore(0);
    startRound();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  function handlePick(group: VerbGroup) {
    if (phase !== "falling" || !verb || settledRef.current) return;
    settledRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const success = verb.group === group;
    if (success) setScore((s) => s + 1);
    setResult({ success, timedOut: false });
    setPhase("result");
  }

  function handleNext() {
    if (round >= TOTAL_ROUNDS) {
      setPhase("summary");
      return;
    }
    setRound((r) => r + 1);
    startRound();
  }

  function handleRestart() {
    setRound(1);
    setScore(0);
    startRound();
  }

  if (phase === "summary") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-sand-300 bg-sand-50 p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-sand-700">Kết thúc!</p>
        <p className="text-sand-600">
          Đúng {score}/{TOTAL_ROUNDS} câu.
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="btn-press rounded-full bg-sand-600 px-5 py-2 text-sm font-semibold text-sand-50 hover:brightness-95"
        >
          Chơi lại
        </button>
      </div>
    );
  }

  if (!verb) {
    return <div className="p-8 text-center text-sand-600">Đang tải…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          {round}/{TOTAL_ROUNDS}
          <HelpButton title="Phân loại nhóm động từ" body={HELP_BODY} />
        </span>
        <span>Điểm: {score}</span>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-2xl border-2 border-dashed border-leaf-300 bg-lemon-100">
        <div
          className="absolute left-1/2 flex h-16 w-32 -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-lemon-300 bg-lemon-200 shadow-card"
          style={{ top: `${fallTop}%`, transition: phase === "falling" ? "none" : "top 0.2s ease-out" }}
        >
          <span className="font-kyokasho text-2xl text-kanjibrown">{conjugate(verb).dictionary}</span>
          <span className="text-[10px] text-sand-500">
            <Furigana kanji={kanjiForForm(verb, conjugate(verb).dictionary)} reading={conjugate(verb).dictionary} />
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {LANES.map((lane) => (
          <button
            key={lane.group}
            type="button"
            disabled={phase !== "falling"}
            onClick={() => handlePick(lane.group)}
            className="btn-press whitespace-pre-line rounded-xl border border-leaf-300 bg-leaf-100 py-3 text-sm font-semibold text-kanjibrown shadow hover:bg-leaf-200 disabled:opacity-60"
          >
            {lane.label}
          </button>
        ))}
      </div>

      {phase === "result" && result && (
        <div
          className={`mt-3 rounded-xl border p-3 text-center text-sm ${
            result.success ? "border-leaf-400 bg-leaf-100 text-kanjibrown" : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {result.timedOut && <p className="font-semibold">Hết giờ!</p>}
          {!result.timedOut && result.success && <p className="font-semibold">Chính xác!</p>}
          {!result.timedOut && !result.success && (
            <p className="font-semibold">Sai rồi. Đáp án đúng là Nhóm {verb.group}.</p>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="btn-press mt-2 rounded-full bg-sand-600 px-5 py-1.5 text-xs font-semibold text-sand-50 hover:brightness-95"
          >
            {round < TOTAL_ROUNDS ? "Câu tiếp theo →" : "Xem kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}
