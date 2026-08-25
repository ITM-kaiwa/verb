import type { ConjugationFormMeta } from "./types";

// `lesson` is the みんなの日本語 lesson each form is introduced at, used to
// restrict practice vocabulary to words already learned by that point
// (words from lessons after it are excluded when the "既習語のみ" filter is on).
export const CONJUGATION_FORMS: (ConjugationFormMeta & { lesson: number })[] = [
  { id: "te", labelJa: "て形（第14課）", labelVn: "Thể Te", lesson: 14 },
  { id: "nai", labelJa: "ない形（第17課）", labelVn: "Thể Nai (phủ định)", lesson: 17 },
  { id: "dictionary", labelJa: "辞書形（第18課）", labelVn: "Thể từ điển", lesson: 18 },
  { id: "ta", labelJa: "た形（第19課）", labelVn: "Thể Ta (quá khứ)", lesson: 19 },
  { id: "potential", labelJa: "可能形（第27課）", labelVn: "Thể khả năng", lesson: 27 },
  { id: "volitional", labelJa: "意向形（第31課）", labelVn: "Thể ý chí", lesson: 31 },
  { id: "imperative", labelJa: "命令形（第33課）", labelVn: "Thể mệnh lệnh", lesson: 33 },
  { id: "prohibitive", labelJa: "禁止形（第33課）", labelVn: "Thể cấm đoán", lesson: 33 },
  { id: "conditional", labelJa: "条件形（ば形）", labelVn: "Thể điều kiện", lesson: 33 },
];
