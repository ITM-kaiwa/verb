import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, kanjiMasuForm } from "@/lib/conjugate";
import type { VerbEntry } from "@/lib/types";

export default function PrintableVerbList({
  verbs,
  showVietnamese,
}: {
  verbs: VerbEntry[];
  showVietnamese: boolean;
}) {
  return (
    <div className="hidden print:block">
      <h1 className="mb-2 text-lg font-bold">動詞活用一覧（全{verbs.length}語）</h1>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border border-black px-1 py-0.5 text-left">ます形</th>
            <th className="border border-black px-1 py-0.5 text-left">漢字</th>
            {showVietnamese && <th className="border border-black px-1 py-0.5 text-left">意味</th>}
            {CONJUGATION_FORMS.map((f) => (
              <th key={f.id} className="border border-black px-1 py-0.5 text-left">
                {f.labelJa}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {verbs.map((verb) => {
            const forms = conjugate(verb);
            return (
              <tr key={verb.id} className="break-inside-avoid">
                <td className="border border-black px-1 py-0.5">{verb.masuForm}</td>
                <td className="border border-black px-1 py-0.5">{kanjiMasuForm(verb)}</td>
                {showVietnamese && <td className="border border-black px-1 py-0.5">{verb.meaningVn}</td>}
                {CONJUGATION_FORMS.map((f) => (
                  <td key={f.id} className="border border-black px-1 py-0.5">
                    {forms[f.id]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
