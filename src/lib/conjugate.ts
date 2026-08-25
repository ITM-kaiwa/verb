import type { ConjugatedForms, VerbEntry } from "./types";

// Godan (五段) i-row kana -> [a-row, u-row, e-row, o-row] for the same consonant column.
// Used to derive the dictionary/potential/volitional/imperative/conditional forms
// from the ます形 stem (which always ends on an i-row kana for godan verbs).
const GODAN_ROW: Record<string, [string, string, string, string]> = {
  い: ["わ", "う", "え", "お"],
  き: ["か", "く", "け", "こ"],
  ぎ: ["が", "ぐ", "げ", "ご"],
  し: ["さ", "す", "せ", "そ"],
  ち: ["た", "つ", "て", "と"],
  に: ["な", "ぬ", "ね", "の"],
  び: ["ば", "ぶ", "べ", "ぼ"],
  み: ["ま", "む", "め", "も"],
  り: ["ら", "る", "れ", "ろ"],
};

function stripSuffix(s: string, suffix: string): string {
  return s.endsWith(suffix) ? s.slice(0, -suffix.length) : s;
}

/**
 * Derives all practice-relevant conjugated forms (in hiragana) from a verb's
 * ます形 + group. て形/ない形/た形 come straight from the source data since
 * they're irregular often enough (音便) to not be worth re-deriving; the rest
 * (dictionary/potential/volitional/imperative/prohibitive/conditional) aren't
 * present in the source datasets at all, so they're computed here.
 */
export function conjugate(entry: VerbEntry): ConjugatedForms {
  const { group, masuForm, teForm, naiForm, taForm } = entry;

  if (group === 2) {
    // Ichidan (一段): stem = ます形 minus ます.
    const stem = stripSuffix(masuForm, "ます");
    return {
      te: teForm,
      nai: naiForm,
      ta: taForm,
      dictionary: stem + "る",
      potential: stem + "られる",
      volitional: stem + "よう",
      imperative: stem + "ろ",
      prohibitive: stem + "るな",
      conditional: stem + "れば",
    };
  }

  if (group === 3) {
    // Irregular (する / 来る and compounds thereof). Detect which one using
    // the given ない形, which reliably ends in しない or こない.
    if (naiForm.endsWith("しない")) {
      const prefix = stripSuffix(masuForm, "します");
      return {
        te: teForm,
        nai: naiForm,
        ta: taForm,
        dictionary: prefix + "する",
        potential: prefix + "できる",
        volitional: prefix + "しよう",
        imperative: prefix + "しろ",
        prohibitive: prefix + "するな",
        conditional: prefix + "すれば",
      };
    }
    // くる-type (来る and compounds like 持って来る, 遊びに来る).
    const prefix = stripSuffix(masuForm, "きます");
    return {
      te: teForm,
      nai: naiForm,
      ta: taForm,
      dictionary: prefix + "くる",
      potential: prefix + "こられる",
      volitional: prefix + "こよう",
      imperative: prefix + "こい",
      prohibitive: prefix + "くるな",
      conditional: prefix + "くれば",
    };
  }

  // Godan (五段).
  const stem = stripSuffix(masuForm, "ます");
  const lastKana = stem.slice(-1);
  const rest = stem.slice(0, -1);
  const row = GODAN_ROW[lastKana];

  if (!row) {
    // Should never happen for well-formed data, but fail soft rather than throw.
    return {
      te: teForm,
      nai: naiForm,
      ta: taForm,
      dictionary: masuForm,
      potential: masuForm,
      volitional: masuForm,
      imperative: masuForm,
      prohibitive: masuForm,
      conditional: masuForm,
    };
  }

  const [, uRow, eRow, oRow] = row;
  const dictionary = rest + uRow;

  return {
    te: teForm,
    nai: naiForm,
    ta: taForm,
    dictionary,
    potential: rest + eRow + "る",
    volitional: rest + oRow + "う",
    imperative: rest + eRow,
    prohibitive: dictionary + "な",
    conditional: rest + eRow + "ば",
  };
}

const HIRAGANA_RE = /[぀-ゟ]/;

/**
 * The source data's `kanji` field is the dictionary-form headword (e.g. 分別する
 * for ぶんべつします). The UI displays the ます形, so this reconstructs a kanji
 * version aligned to the ます形 instead of the dictionary form, by finding the
 * trailing hiragana (okurigana) common to both the kanji and hiragana headwords
 * and re-attaching the ます形's own tail after the same kanji stem.
 */
export function kanjiMasuForm(entry: VerbEntry): string {
  const { kanji, hiragana, masuForm, group, naiForm } = entry;

  // 来る/来ます etc: 来 changes reading (くる/きます/こない...), so the general
  // okurigana-alignment approach below would wrongly keep it read as く.
  if (group === 3 && naiForm.endsWith("こない") && kanji.endsWith("来る")) {
    return kanji.slice(0, -2) + "来ます";
  }

  let okuriLen = 0;
  for (let i = kanji.length - 1; i >= 0; i--) {
    if (HIRAGANA_RE.test(kanji[i])) okuriLen++;
    else break;
  }
  const stem = kanji.slice(0, kanji.length - okuriLen);
  const boundary = hiragana.length - okuriLen;
  if (boundary < 0 || boundary > masuForm.length) return masuForm;
  return stem + masuForm.slice(boundary);
}

// The ichidan (一段) ending for each form — wrongly applying these to a godan
// verb's ます-stem is one of the most common beginner mistakes (e.g. 書きて
// instead of 書いて). Used to generate a plausible "trap" wrong answer.
const ICHIDAN_SUFFIX: Record<keyof ConjugatedForms, string> = {
  te: "て",
  nai: "ない",
  dictionary: "る",
  ta: "た",
  potential: "られる",
  volitional: "よう",
  imperative: "ろ",
  prohibitive: "るな",
  conditional: "れば",
};

/**
 * A plausible wrong answer for `formId`, built by (incorrectly) applying the
 * ichidan conjugation pattern to a godan verb's ます-stem. Returns null for
 * ichidan/irregular verbs, or if the trap happens to equal the real answer.
 */
export function naiveTrap(entry: VerbEntry, formId: keyof ConjugatedForms): string | null {
  if (entry.group !== 1) return null;
  const stem = stripSuffix(entry.masuForm, "ます");
  const trap = stem + ICHIDAN_SUFFIX[formId];
  const real = conjugate(entry)[formId];
  return trap !== real ? trap : null;
}
