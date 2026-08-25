"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, naiveTrap } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import type { ConjugationFormId, DataSourceSetting } from "@/lib/types";

const HELP_BODY = [
  "Phía trên hiển thị động từ nguyên thể và thể chia cần tìm.",
  "Các thẻ đáp án sẽ bay từ trên xuống — hãy nhấn (chém) vào đúng thẻ có thể chia chính xác.",
  "Coi chừng những cái bẫy dễ nhầm (ví dụ 書きて thay vì 書いて)!",
  "Nếu để thẻ đúng rơi hết mà chưa chém trúng, vòng đó sẽ thua.",
];

const TOTAL_ROUNDS = 5;
const CANDIDATE_COUNT = 6;
const BASE_DURATION_MS = 3400;

interface Candidate {
  id: string;
  text: string;
  correct: boolean;
  left: number;
  duration: number;
  delay: number;
}

interface RoundData {
  formId: ConjugationFormId;
  dictForm: string;
  kanji: string;
  correctAnswer: string;
  candidates: Candidate[];
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
  const forms = conjugate(target);
  const correctAnswer = forms[formMeta.id];

  const wrongTexts: string[] = [];
  const seen = new Set([correctAnswer]);

  const trap = naiveTrap(target, formMeta.id);
  if (trap && !seen.has(trap)) {
    wrongTexts.push(trap);
    seen.add(trap);
  }
  for (const v of decoyPool) {
    if (wrongTexts.length >= CANDIDATE_COUNT - 1) break;
    const ans = conjugate(v)[formMeta.id];
    if (seen.has(ans)) continue;
    seen.add(ans);
    wrongTexts.push(ans);
  }

  const shuffledItems = shuffle([
    { text: correctAnswer, correct: true },
    ...wrongTexts.map((text) => ({ text, correct: false })),
  ]);
  // Fixed, evenly-spaced lanes (rather than random left%) so falling cards
  // never overlap and hide one another behind an unclickable stack.
  const laneWidth = 100 / shuffledItems.length;
  const items: Candidate[] = shuffledItems.map((c, i) => ({
    id: `${i}-${c.text}`,
    text: c.text,
    correct: c.correct,
    left: laneWidth * (i + 0.5),
    duration: BASE_DURATION_MS + Math.random() * 1400,
    delay: Math.random() * 900,
  }));

  return {
    formId: formMeta.id,
    dictForm: forms.dictionary,
    kanji: forms.dictionary,
    correctAnswer,
    candidates: items,
  };
}

export default function SlashGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [phase, setPhase] = useState<"playing" | "result" | "summary">("playing");
  const [result, setResult] = useState<{ success: boolean } | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [slashed, setSlashed] = useState<Set<string>>(new Set());

  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const settledRef = useRef(false);

  const formLabel = useMemo(
    () => CONJUGATION_FORMS.find((f) => f.id === roundData?.formId) ?? null,
    [roundData]
  );

  const tick = useCallback(
    (data: RoundData) => {
      function frame(now: number) {
        const elapsed = now - startRef.current;
        const next: Record<string, number> = {};
        let anyCorrectMissed = false;
        for (const c of data.candidates) {
          const p = elapsed < c.delay ? 0 : Math.min((elapsed - c.delay) / c.duration, 1);
          next[c.id] = p;
          if (c.correct && p >= 1) anyCorrectMissed = true;
        }
        setProgressMap(next);

        if (anyCorrectMissed && !settledRef.current) {
          settledRef.current = true;
          setResult({ success: false });
          setPhase("result");
          return;
        }
        if (!settledRef.current) rafRef.current = requestAnimationFrame(frame);
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    []
  );

  const startRound = useCallback(() => {
    const data = buildRound(dataSource);
    settledRef.current = false;
    startRef.current = performance.now();
    setProgressMap({});
    setSlashed(new Set());
    setRoundData(data);
    setResult(null);
    setPhase("playing");
    tick(data);
  }, [dataSource, tick]);

  useEffect(() => {
    setRound(1);
    setScore(0);
    startRound();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  function handleSlash(candidate: Candidate) {
    if (phase !== "playing" || settledRef.current) return;
    if (candidate.correct) {
      settledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setScore((s) => s + 1);
      setResult({ success: true });
      setPhase("result");
    } else {
      setSlashed((s) => new Set(s).add(candidate.id));
    }
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
          <HelpButton title="Chém thể chia" body={HELP_BODY} />
        </span>
        <span className="rounded-full bg-sand-200 px-3 py-1 font-semibold text-sand-700">
          {roundData.dictForm}　→　{formLabel?.labelJa}
        </span>
        <span>Điểm: {score}</span>
      </div>

      <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-lemon-300/70 bg-lemon-100 shadow-card">
        {roundData.candidates.map((c) => {
          const p = progressMap[c.id] ?? 0;
          const isSlashed = slashed.has(c.id);
          if (p >= 1 && !c.correct) return null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSlash(c)}
              disabled={phase !== "playing" || isSlashed}
              className={`btn-press absolute -translate-x-1/2 rounded-xl border px-3 py-1.5 font-kyokasho text-base shadow-card transition-opacity ${
                isSlashed
                  ? "border-sand-300 bg-sand-100 text-sand-300 opacity-40"
                  : "border-leaf-300 bg-leaf-100 text-kanjibrown hover:bg-leaf-200"
              }`}
              style={{ left: `${c.left}%`, top: `${p * 88}%` }}
            >
              {c.text}
            </button>
          );
        })}

        {phase === "result" && result && (
          <div className="absolute inset-0 flex items-center justify-center bg-sand-50/90">
            <div
              className={`space-y-2 rounded-2xl border p-5 text-center ${
                result.success ? "border-leaf-400 bg-leaf-100 text-kanjibrown" : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              <p className="font-semibold">
                {result.success ? "Chém trúng! Chính xác!" : `Đã lỡ mất… Đáp án đúng là 「${roundData.correctAnswer}」.`}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="btn-press rounded-full bg-sand-600 px-5 py-1.5 text-xs font-semibold text-sand-50 hover:brightness-95"
              >
                {round < TOTAL_ROUNDS ? "Câu tiếp theo →" : "Xem kết quả"}
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-sand-500">
        Trong số các thẻ bay tới, hãy nhấn vào đúng {formLabel?.labelJa} của「{roundData.dictForm}」để chém
      </p>
    </div>
  );
}
