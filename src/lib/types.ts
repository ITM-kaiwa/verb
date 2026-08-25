export type VerbGroup = 1 | 2 | 3;

export type VerbSource = "minna" | "irodori";

export interface VerbEntry {
  id: string;
  source: VerbSource;
  group: VerbGroup;
  kanji: string;
  hiragana: string;
  meaningVn: string;
  lesson: number;
  masuForm: string;
  teForm: string;
  naiForm: string;
  taForm: string;
}

export type ConjugationFormId =
  | "te"
  | "nai"
  | "dictionary"
  | "ta"
  | "potential"
  | "volitional"
  | "imperative"
  | "prohibitive"
  | "conditional";

export interface ConjugationFormMeta {
  id: ConjugationFormId;
  labelJa: string;
  labelVn: string;
}

export interface ConjugatedForms {
  te: string;
  nai: string;
  dictionary: string;
  ta: string;
  potential: string;
  volitional: string;
  imperative: string;
  prohibitive: string;
  conditional: string;
}
