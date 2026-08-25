"use client";

import { useCallback, useEffect, useState } from "react";
import { CONTEXT_SENTENCES, type ContextSentence } from "@/lib/contextSentences";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate } from "@/lib/conjugate";
import { findVerb } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import Furigana from "@/components/Furigana";
import type { ConjugationFormId } from "@/lib/types";

const HELP_BODY = [
  "Một câu có chỗ trống xuất hiện, kèm gợi ý là thể từ điển của động từ.",
  "Hãy chọn thể chia phù hợp với ngữ pháp trong câu để tấn công quái vật.",
  "Đánh bại quái vật bằng cách trả lời đúng liên tiếp!",
];

const TOTAL_ROUNDS = Math.min(8, CONTEXT_SENTENCES.length);
const CHOICE_COUNT = 4;

interface RoundData {
  sentence: ContextSentence;
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

function buildRound(usedIds: Set<string>): RoundData | null {
  const pool = CONTEXT_SENTENCES.filter((s) => !usedIds.has(s.id));
  const source = pool.length > 0 ? pool : CONTEXT_SENTENCES;
  const sentence = source[Math.floor(Math.random() * source.length)];
  const verb = findVerb(sentence.hiragana);
  if (!verb) return null;

  const forms = conjugate(verb);
  const correctAnswer = forms[sentence.formId];

  const otherFormIds = CONJUGATION_FORMS.map((f) => f.id).filter((id) => id !== sentence.formId);
  const decoyFormIds = shuffle(otherFormIds).slice(0, CHOICE_COUNT - 1);
  const decoys = Array.from(new Set(decoyFormIds.map((id) => forms[id as ConjugationFormId]))).filter(
    (d) => d !== correctAnswer
  );

  const choices = shuffle([correctAnswer, ...decoys]);
  return { sentence, correctAnswer, choices };
}

export default function FillBlankBattleGame() {
  const [round, setRound] = useState(1);
  const [enemyHp, setEnemyHp] = useState(TOTAL_ROUNDS);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [phase, setPhase] = useState<"battling" | "result" | "summary">("battling");
  const [result, setResult] = useState<{ success: boolean } | null>(null);

  const startRound = useCallback((used: Set<string>) => {
    const data = buildRound(used);
    setRoundData(data);
    setResult(null);
    setPhase("battling");
  }, []);

  useEffect(() => {
    setRound(1);
    setEnemyHp(TOTAL_ROUNDS);
    const fresh = new Set<string>();
    setUsedIds(fresh);
    startRound(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChoice(choice: string) {
    if (phase !== "battling" || !roundData) return;
    const success = choice === roundData.correctAnswer;
    if (success) setEnemyHp((hp) => Math.max(0, hp - 1));
    setResult({ success });
    setPhase("result");
  }

  function handleNext() {
    const nextUsed = new Set(usedIds);
    if (roundData) nextUsed.add(roundData.sentence.id);
    setUsedIds(nextUsed);

    if (round >= TOTAL_ROUNDS) {
      setPhase("summary");
      return;
    }
    setRound((r) => r + 1);
    startRound(nextUsed);
  }

  function handleRestart() {
    setRound(1);
    setEnemyHp(TOTAL_ROUNDS);
    const fresh = new Set<string>();
    setUsedIds(fresh);
    startRound(fresh);
  }

  if (phase === "summary") {
    const win = enemyHp <= 0;
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-sand-300 bg-sand-50 p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-sand-700">{win ? "Đã đánh bại quái vật!" : "Trận đấu kết thúc"}</p>
        <p className="text-sand-600">
          HP quái vật còn lại: {enemyHp}/{TOTAL_ROUNDS}
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
    return (
      <div className="p-8 text-center text-sand-600">
        Đang tải…
      </div>
    );
  }

  const formLabel = CONJUGATION_FORMS.find((f) => f.id === roundData.sentence.formId);
  const hpPct = Math.max(0, Math.round((enemyHp / TOTAL_ROUNDS) * 100));

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          Câu {round}/{TOTAL_ROUNDS}
          <HelpButton title="Đấu trường điền từ" body={HELP_BODY} />
        </span>
        <span className="rounded-full bg-sand-200 px-3 py-1 font-semibold text-sand-700">{formLabel?.labelJa}</span>
      </div>

      <div className="rounded-3xl border border-lemon-300/70 bg-lemon-100 p-5 shadow-card">
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-red-700">
            <span>👹 Quái vật</span>
            <span>
              {enemyHp}/{TOTAL_ROUNDS}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-red-100">
            <div className="h-full bg-red-400 transition-all" style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-center">
          <p className="font-kyokasho text-xl leading-relaxed text-kanjibrown">
            {roundData.sentence.before}
            <span className="mx-1 inline-block min-w-[3em] border-b-2 border-dashed border-sand-400 align-middle">
              &nbsp;
            </span>
            {roundData.sentence.after}
          </p>
          <p className="mt-2 text-xs text-sand-500">
            （<Furigana kanji={roundData.sentence.dictHint} reading={roundData.sentence.hiragana} />）
          </p>
          <p className="mt-1 font-vietnamese text-xs italic text-sand-500">{roundData.sentence.translationVn}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {roundData.choices.map((c) => (
            <button
              key={c}
              type="button"
              disabled={phase !== "battling"}
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
              result.success
                ? "border-leaf-400 bg-leaf-100 text-kanjibrown"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-semibold">
              {result.success
                ? "Đòn chí mạng! Tấn công thành công!"
                : `Không có tác dụng… Đáp án đúng là 「${roundData.correctAnswer}」.`}
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
