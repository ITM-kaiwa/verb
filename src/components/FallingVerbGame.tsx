"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, kanjiMasuForm } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import Furigana from "@/components/Furigana";
import type { ConjugationFormId, DataSourceSetting } from "@/lib/types";

const HELP_BODY = [
  "Một động từ ở thể ます sẽ từ từ rơi xuống, phía trên hiển thị thể chia được yêu cầu.",
  "Trong 10 lựa chọn bên cạnh, hãy nhấn vào đúng thể chia của động từ đó trước khi nó rơi hết.",
  "Chơi 5 vòng, mỗi vòng đúng được 1 điểm.",
];

const TOTAL_ROUNDS = 5;
const FALL_DURATION_MS = 9000;
const CANDIDATE_COUNT = 10;

interface RoundData {
  formId: ConjugationFormId;
  masuForm: string;
  kanji: string;
  correctAnswer: string;
  candidates: string[];
}

interface ResultInfo {
  success: boolean;
  timedOut: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRound(dataSource: DataSourceSetting): RoundData {
  const formMeta = CONJUGATION_FORMS[Math.floor(Math.random() * CONJUGATION_FORMS.length)];
  const [target, ...decoyPool] = pickRandomVerbs(CANDIDATE_COUNT * 3, new Set(), sourceFilter(dataSource));

  const correctAnswer = conjugate(target)[formMeta.id];

  const decoyAnswers: string[] = [];
  const seen = new Set([correctAnswer]);
  for (const v of decoyPool) {
    const ans = conjugate(v)[formMeta.id];
    if (seen.has(ans)) continue;
    seen.add(ans);
    decoyAnswers.push(ans);
    if (decoyAnswers.length >= CANDIDATE_COUNT - 1) break;
  }

  const candidates = shuffle([correctAnswer, ...decoyAnswers]);

  return {
    formId: formMeta.id,
    masuForm: target.masuForm,
    kanji: kanjiMasuForm(target),
    correctAnswer,
    candidates,
  };
}

export default function FallingVerbGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [phase, setPhase] = useState<"falling" | "result" | "summary">("falling");
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [fallTop, setFallTop] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const settledRef = useRef(false);

  const formLabel = useMemo(() => {
    if (!roundData) return null;
    return CONJUGATION_FORMS.find((f) => f.id === roundData.formId) ?? null;
  }, [roundData]);

  const startFall = useCallback(() => {
    settledRef.current = false;
    setFallTop(0);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / FALL_DURATION_MS, 1);
      setFallTop(progress * 88);

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
    setRoundData(buildRound(dataSource));
    setResult(null);
    setPhase("falling");
    startFall();
  }, [startFall, dataSource]);

  useEffect(() => {
    setRound(1);
    setScore(0);
    startRound();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  function handleCatch(candidate: string) {
    if (phase !== "falling" || !roundData || settledRef.current) return;
    settledRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const success = candidate === roundData.correctAnswer;
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

  if (!roundData) {
    return <div className="p-8 text-center text-sand-600">Đang tải…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          {round}/{TOTAL_ROUNDS}
          <HelpButton title="Đoán thể chia" body={HELP_BODY} />
        </span>
        <span className="rounded-full bg-sand-200 px-3 py-1 font-semibold text-sand-700">
          {formLabel?.labelVn}（{formLabel?.labelJa}）
        </span>
        <span>Điểm: {score}</span>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-lemon-300/70 bg-lemon-100 p-5 shadow-card sm:flex-row">
        <div className="relative mx-auto h-80 w-full max-w-[220px] shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-leaf-300 bg-lemon-200/60">
          <p className="absolute left-0 right-0 top-2 text-center text-[11px] font-medium text-sand-600">
            Thể ます
          </p>
          <div
            className="absolute left-1/2 flex h-16 w-32 -translate-x-1/2 select-none flex-col items-center justify-center rounded-xl border border-lemon-300 bg-lemon-200 shadow-card"
            style={{
              top: `${fallTop}%`,
              transition: phase === "falling" ? "none" : "top 0.2s ease-out",
            }}
          >
            <span className="font-kyokasho text-2xl text-kanjibrown">{roundData.masuForm}</span>
            <span className="text-[10px] text-sand-500">
              <Furigana kanji={roundData.kanji} reading={roundData.masuForm} />
            </span>
          </div>
          <div className="absolute bottom-6 left-2 right-2 border-t-2 border-dashed border-leaf-400/70" />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <p className="text-center text-[11px] font-medium text-sand-600 sm:text-left">
            Hãy chọn {formLabel?.labelJa} đúng của động từ đang rơi xuống
          </p>
          <div className="grid grid-cols-2 gap-2">
            {roundData.candidates.map((candidate, i) => (
              <button
                key={`${candidate}-${i}`}
                type="button"
                disabled={phase !== "falling"}
                onClick={() => handleCatch(candidate)}
                className="btn-press flex h-12 items-center justify-center rounded-xl border border-leaf-300 bg-leaf-100 px-2 font-kyokasho text-base text-kanjibrown shadow hover:bg-leaf-200 hover:brightness-95 disabled:opacity-60"
              >
                {candidate}
              </button>
            ))}
          </div>

          {phase === "result" && result && (
            <div
              className={`mt-2 rounded-xl border p-3 text-center text-sm ${
                result.success
                  ? "border-leaf-400 bg-leaf-100 text-kanjibrown"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {result.timedOut && <p className="font-semibold">Hết giờ!</p>}
              {!result.timedOut && result.success && <p className="font-semibold">Chính xác!</p>}
              {!result.timedOut && !result.success && (
                <p className="font-semibold">
                  Sai rồi. Đáp án đúng là 「{roundData.correctAnswer}」.
                </p>
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
      </div>
    </div>
  );
}
