"use client";

import { useEffect, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate } from "@/lib/conjugate";
import { pickRandomVerbs } from "@/lib/verbData";
import type { ConjugationFormId, VerbEntry } from "@/lib/types";

const ROWS = 5;

interface RoundState {
  verbs: VerbEntry[];
  answers: string[];
  checked: (boolean | null)[];
}

function newRound(usedIds: Set<string>): RoundState {
  const verbs = pickRandomVerbs(ROWS, usedIds);
  return {
    verbs,
    answers: Array(ROWS).fill(""),
    checked: Array(ROWS).fill(null),
  };
}

export default function ConjugationPractice() {
  const [formId, setFormId] = useState<ConjugationFormId>("te");
  const [history, setHistory] = useState<RoundState[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setHistory([newRound(new Set())]);
    setIndex(0);
  }, []);

  const current = history[index];

  function updateCurrent(patch: Partial<RoundState>) {
    setHistory((h) => h.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function handleFormChange(next: ConjugationFormId) {
    setFormId(next);
    if (current) {
      updateCurrent({
        answers: Array(ROWS).fill(""),
        checked: Array(ROWS).fill(null),
      });
    }
  }

  function handleAnswerChange(row: number, value: string) {
    if (!current) return;
    const answers = [...current.answers];
    answers[row] = value;
    const checked = [...current.checked];
    checked[row] = null;
    updateCurrent({ answers, checked });
  }

  function handleCheck(row: number) {
    if (!current) return;
    const verb = current.verbs[row];
    const correctAnswer = conjugate(verb)[formId];
    const isCorrect = current.answers[row].trim() === correctAnswer;
    const checked = [...current.checked];
    checked[row] = isCorrect;
    updateCurrent({ checked });
  }

  function handleBack() {
    if (index > 0) setIndex(index - 1);
  }

  function handleNext() {
    if (index < history.length - 1) {
      setIndex(index + 1);
      return;
    }
    const usedIds = new Set(history.flatMap((r) => r.verbs.map((v) => v.id)));
    setHistory((h) => [...h, newRound(usedIds)]);
    setIndex(index + 1);
  }

  if (!current) {
    return <div className="p-8 text-center text-sand-600">読み込み中…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-sand-700" htmlFor="form-select">
          活用形：
        </label>
        <select
          id="form-select"
          value={formId}
          onChange={(e) => handleFormChange(e.target.value as ConjugationFormId)}
          className="rounded-full border border-sand-300 bg-lemon-100 px-4 py-1.5 text-sm font-semibold text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sand-400"
        >
          {CONJUGATION_FORMS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.labelJa}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-stretch gap-2 sm:gap-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={index === 0}
          className="btn-press flex shrink-0 items-center rounded-2xl border border-leaf-300 bg-leaf-100 px-2 text-lg font-bold text-kanjibrown shadow-card hover:bg-leaf-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
          aria-label="前に戻る"
        >
          ≪
        </button>

        <div className="flex-1 space-y-3 rounded-3xl border border-sand-300 bg-lemon-100 p-4 shadow-card sm:p-6">
          {current.verbs.map((verb, i) => (
            <VerbRow
              key={verb.id}
              verb={verb}
              answer={current.answers[i]}
              checked={current.checked[i]}
              onChange={(v) => handleAnswerChange(i, v)}
              onCheck={() => handleCheck(i)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="btn-press flex shrink-0 items-center rounded-2xl border border-leaf-300 bg-leaf-100 px-2 text-lg font-bold text-kanjibrown shadow-card hover:bg-leaf-200 sm:px-3"
          aria-label="次へ進む"
        >
          ≫
        </button>
      </div>
    </div>
  );
}

function VerbRow({
  verb,
  answer,
  checked,
  onChange,
  onCheck,
}: {
  verb: VerbEntry;
  answer: string;
  checked: boolean | null;
  onChange: (v: string) => void;
  onCheck: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-3 sm:gap-4">
      <div className="w-2/5 min-w-0 sm:w-1/3">
        <p className="truncate font-kyokasho text-2xl text-kanjibrown sm:text-3xl">{verb.masuForm}</p>
        <p className="truncate text-xs text-sand-500 sm:text-sm">{verb.kanji}</p>
        <p className="truncate font-vietnamese text-xs italic text-sand-500 sm:text-sm">{verb.meaningVn}</p>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCheck}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCheck();
            }
          }}
          placeholder="ひらがなで入力"
          className="w-full min-w-0 rounded-xl border border-sand-300 bg-white px-3 py-2 font-kyokasho text-lg text-sand-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-sand-400"
        />
        <span
          className={`w-6 shrink-0 text-center text-2xl font-bold ${
            checked === true ? "text-correct" : checked === false ? "text-wrong" : "text-transparent"
          }`}
        >
          {checked === true ? "レ" : checked === false ? "×" : "・"}
        </span>
      </div>
    </div>
  );
}
