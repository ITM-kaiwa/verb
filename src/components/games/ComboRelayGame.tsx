"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import type { ConjugationFormId, DataSourceSetting } from "@/lib/types";

const HELP_BODY = [
  "Động từ và thể chia yêu cầu xuất hiện liên tục, mỗi câu có giới hạn thời gian.",
  "Trả lời đúng để giữ combo; trả lời sai hoặc hết giờ sẽ làm combo về 0.",
  "Mục tiêu: đạt combo cao nhất và luyện phản xạ chia động từ thật nhanh!",
];

const TOTAL_ROUNDS = 12;
const TIME_LIMIT_MS = 4200;
const CHOICE_COUNT = 4;

interface RoundData {
  dictForm: string;
  formId: ConjugationFormId;
  correctAnswer: string;
  choices: string[];
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
  const [target, ...decoyPool] = pickRandomVerbs(CHOICE_COUNT * 3, new Set(), sourceFilter(dataSource));
  const correctAnswer = conjugate(target)[formMeta.id];

  const decoys: string[] = [];
  const seen = new Set([correctAnswer]);
  for (const v of decoyPool) {
    if (decoys.length >= CHOICE_COUNT - 1) break;
    const ans = conjugate(v)[formMeta.id];
    if (seen.has(ans)) continue;
    seen.add(ans);
    decoys.push(ans);
  }

  return {
    dictForm: conjugate(target).dictionary,
    formId: formMeta.id,
    correctAnswer,
    choices: shuffle([correctAnswer, ...decoys]),
  };
}

export default function ComboRelayGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const [round, setRound] = useState(1);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [phase, setPhase] = useState<"playing" | "result" | "summary">("playing");
  const [result, setResult] = useState<{ success: boolean; timedOut: boolean } | null>(null);
  const [timeLeftPct, setTimeLeftPct] = useState(100);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const settledRef = useRef(false);

  const startTimer = useCallback(() => {
    settledRef.current = false;
    startRef.current = performance.now();
    setTimeLeftPct(100);

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / TIME_LIMIT_MS) * 100);
      setTimeLeftPct(pct);
      if (elapsed >= TIME_LIMIT_MS) {
        if (!settledRef.current) {
          settledRef.current = true;
          setCombo(0);
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
    setPhase("playing");
    startTimer();
  }, [dataSource, startTimer]);

  useEffect(() => {
    setRound(1);
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
    startRound();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  function handleChoice(choice: string) {
    if (phase !== "playing" || !roundData || settledRef.current) return;
    settledRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const success = choice === roundData.correctAnswer;
    if (success) {
      setCombo((c) => {
        const next = c + 1;
        setBestCombo((b) => Math.max(b, next));
        return next;
      });
      setCorrectCount((c) => c + 1);
    } else {
      setCombo(0);
    }
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
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
    startRound();
  }

  if (phase === "summary") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-sand-300 bg-sand-50 p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-sand-700">Kết thúc!</p>
        <p className="text-sand-600">
          Đúng {correctCount}/{TOTAL_ROUNDS} — Combo tối đa: {bestCombo}
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

  const formLabel = CONJUGATION_FORMS.find((f) => f.id === roundData.formId);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          {round}/{TOTAL_ROUNDS}
          <HelpButton title="Chuyền combo chia động từ" body={HELP_BODY} />
        </span>
        <span className="rounded-full bg-leaf-200 px-3 py-1 font-semibold text-kanjibrown">Combo: {combo}🔥</span>
        <span>Combo tối đa: {bestCombo}</span>
      </div>

      <div className="rounded-3xl border border-lemon-300/70 bg-lemon-100 p-5 shadow-card">
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-sand-200">
          <div
            className={`h-full transition-[width] ${timeLeftPct < 30 ? "bg-wrong" : "bg-leaf-400"}`}
            style={{ width: `${timeLeftPct}%`, transitionDuration: "80ms" }}
          />
        </div>

        <div className="mb-4 text-center">
          <p className="font-kyokasho text-3xl text-kanjibrown">{roundData.dictForm}</p>
          <p className="mt-1 text-sm text-sand-600">→ {formLabel?.labelJa}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {roundData.choices.map((c) => (
            <button
              key={c}
              type="button"
              disabled={phase !== "playing"}
              onClick={() => handleChoice(c)}
              className="btn-press rounded-xl border border-leaf-300 bg-leaf-100 py-3 font-kyokasho text-base text-kanjibrown shadow hover:bg-leaf-200 disabled:opacity-60"
            >
              {c}
            </button>
          ))}
        </div>

        {phase === "result" && result && (
          <div
            className={`mt-3 rounded-xl border p-3 text-center text-sm ${
              result.success ? "border-leaf-400 bg-leaf-100 text-kanjibrown" : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-semibold">
              {result.timedOut
                ? "Hết giờ! Combo về 0."
                : result.success
                  ? "Chính xác! Combo tiếp tục!"
                  : `Sai rồi. Đáp án đúng là 「${roundData.correctAnswer}」.`}
            </p>
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
  );
}
