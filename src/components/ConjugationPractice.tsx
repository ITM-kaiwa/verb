"use client";

import { useEffect, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, kanjiMasuForm } from "@/lib/conjugate";
import { alreadyLearnedFilter, combineFilters, pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import type { ConjugationFormId, DataSourceSetting, VerbEntry } from "@/lib/types";

const ROWS = 5;

interface RoundState {
  verbs: VerbEntry[];
  answers: string[];
  checked: (boolean | null)[];
}

function newRound(
  usedIds: Set<string>,
  formId: ConjugationFormId,
  learnedOnly: boolean,
  dataSource: DataSourceSetting
): RoundState {
  const formMeta = CONJUGATION_FORMS.find((f) => f.id === formId)!;
  // 既習語のみ only makes sense against みんなの日本語's lesson numbers, so it's
  // a no-op when いろどり is the sole selected source (see alreadyLearnedFilter).
  const learnedFilter = learnedOnly && dataSource !== "irodori" ? alreadyLearnedFilter(formMeta.lesson) : undefined;
  const filterFn = combineFilters(sourceFilter(dataSource), learnedFilter);
  const verbs = pickRandomVerbs(ROWS, usedIds, filterFn);
  return {
    verbs,
    answers: Array(ROWS).fill(""),
    checked: Array(ROWS).fill(null),
  };
}

export default function ConjugationPractice({
  showVietnamese,
  onShowVietnameseChange,
  dataSource,
}: {
  showVietnamese: boolean;
  onShowVietnameseChange: (v: boolean) => void;
  dataSource: DataSourceSetting;
}) {
  const [formId, setFormId] = useState<ConjugationFormId>("te");
  const [learnedOnly, setLearnedOnly] = useState(true);
  const [history, setHistory] = useState<RoundState[]>([]);
  const [index, setIndex] = useState(0);

  // データソースや既習語のみを切り替えたら、今表示中のカードにもすぐ反映する
  // （活用形の切り替えは意図的に据え置き — 同じ語のまま活用形だけ変わる）。
  useEffect(() => {
    setHistory([newRound(new Set(), formId, learnedOnly, dataSource)]);
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnedOnly, dataSource]);

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
    setHistory((h) => [...h, newRound(usedIds, formId, learnedOnly, dataSource)]);
    setIndex(index + 1);
  }

  if (!current) {
    return <div className="p-8 text-center text-sand-600">読み込み中…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
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

        <label
          className={`flex items-center gap-1.5 text-sm text-sand-700 ${dataSource === "irodori" ? "opacity-40" : ""}`}
          title={dataSource === "irodori" ? "いろどりの課はみんなの日本語と番号が対応していないため無効です" : undefined}
        >
          <input
            type="checkbox"
            checked={learnedOnly}
            disabled={dataSource === "irodori"}
            onChange={(e) => setLearnedOnly(e.target.checked)}
            className="h-4 w-4 accent-sand-600"
          />
          既習語のみ
        </label>

        <label className="flex items-center gap-1.5 text-sm text-sand-700">
          <input
            type="checkbox"
            checked={showVietnamese}
            onChange={(e) => onShowVietnameseChange(e.target.checked)}
            className="h-4 w-4 accent-sand-600"
          />
          ベトナム語訳を表示
        </label>
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
              correctAnswer={conjugate(verb)[formId]}
              showVietnamese={showVietnamese}
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
  correctAnswer,
  showVietnamese,
  onChange,
  onCheck,
}: {
  verb: VerbEntry;
  answer: string;
  checked: boolean | null;
  correctAnswer: string;
  showVietnamese: boolean;
  onChange: (v: string) => void;
  onCheck: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-3 sm:gap-4">
      <div className="w-1/2 min-w-0 sm:w-2/5">
        <p className="truncate font-kyokasho text-xl text-kanjibrown sm:text-2xl">{verb.masuForm}</p>
        <p className="truncate text-xs text-sand-500 sm:text-sm">{kanjiMasuForm(verb)}</p>
        {showVietnamese && (
          <p className="truncate font-vietnamese text-xs italic text-sand-500 sm:text-sm">{verb.meaningVn}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
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
            className="w-full min-w-0 rounded-xl border border-sand-300 bg-white px-2 py-1.5 font-kyokasho text-base text-sand-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-sand-400"
          />
          <span
            className={`w-6 shrink-0 text-center text-2xl font-bold ${
              checked === true ? "text-correct" : checked === false ? "text-wrong" : "text-transparent"
            }`}
          >
            {checked === true ? "✓" : checked === false ? "×" : "・"}
          </span>
        </div>
        {checked === false && (
          <p className="pl-1 text-xs text-wrong">正解：{correctAnswer}</p>
        )}
      </div>
    </div>
  );
}
