"use client";

import { useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { getTeaching } from "@/lib/teachingContent";
import type { ConjugationFormId } from "@/lib/types";

export default function TeachingMode() {
  const [formId, setFormId] = useState<ConjugationFormId>("te");
  const teaching = getTeaching(formId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-semibold text-sand-700" htmlFor="teach-form-select">
          Thể chia：
        </label>
        <select
          id="teach-form-select"
          value={formId}
          onChange={(e) => setFormId(e.target.value as ConjugationFormId)}
          className="rounded-full border border-sand-300 bg-lemon-100 px-4 py-1.5 text-sm font-semibold text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sand-400"
        >
          {CONJUGATION_FORMS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.labelJa}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 rounded-3xl border border-sand-300 bg-lemon-100 p-4 shadow-card sm:p-6">
        <div>
          <h2 className="font-kyokasho text-2xl text-kanjibrown">{teaching.title}</h2>
          <p className="mt-1 font-vietnamese text-sm italic text-sand-600">{teaching.usage}</p>
        </div>

        {teaching.groups.map((g) => (
          <div key={g.groupLabel} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
            <p className="mb-2 font-semibold text-kanjibrown">{g.groupLabel}</p>
            <p className="font-vietnamese text-sm text-sand-700">{g.rule}</p>

            {g.subRules && (
              <ul className="mt-2 space-y-1 pl-4 text-sm text-sand-700">
                {g.subRules.map((r) => (
                  <li key={r} className="list-disc font-kyokasho marker:text-sand-400">
                    {r}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {g.examples.map((ex) => (
                <div
                  key={ex.dict + ex.result}
                  className="rounded-xl border border-leaf-300 bg-leaf-100 px-3 py-1.5 text-center font-kyokasho text-sm text-kanjibrown"
                >
                  {ex.dict}
                  <span className="mx-1 text-sand-400">→</span>
                  <span className="font-semibold">{ex.result}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {teaching.notes && (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-100 p-3 text-sm text-sand-600">
            {teaching.notes.map((n) => (
              <p key={n} className="font-vietnamese italic">
                ※ {n}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
