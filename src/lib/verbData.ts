import raw from "./verbData.generated.json";
import type { DataSourceSetting, VerbEntry } from "./types";

export const VERBS: VerbEntry[] = raw as VerbEntry[];

function shuffled(arr: VerbEntry[]): VerbEntry[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandomVerbs(
  count: number,
  exclude: Set<string> = new Set(),
  filterFn?: (v: VerbEntry) => boolean
): VerbEntry[] {
  const filtered = filterFn ? VERBS.filter(filterFn) : VERBS;

  let pool = filtered.filter((v) => !exclude.has(v.id));
  if (pool.length < count) pool = filtered; // not enough unseen words left, allow repeats
  if (pool.length < count) pool = VERBS; // filter too strict for the whole app, fall back fully

  return shuffled(pool).slice(0, count);
}

export function sourceFilter(source: DataSourceSetting): ((v: VerbEntry) => boolean) | undefined {
  if (source === "both") return undefined;
  return (v: VerbEntry) => v.source === source;
}

export function verbsForSource(source: DataSourceSetting): VerbEntry[] {
  const f = sourceFilter(source);
  return f ? VERBS.filter(f) : VERBS;
}

// Only みんなの日本語 lesson numbers correspond to the "第N課" the conjugation
// forms are labeled with — いろどり's lesson numbers restart per book part and
// don't map onto the same scale, so the filter is only meaningful when いろどり
// isn't the sole selected source (see alreadyLearnedFilter usage below).
export function alreadyLearnedFilter(maxLesson: number) {
  return (v: VerbEntry) => v.source === "minna" && v.lesson <= maxLesson;
}

export function combineFilters(
  ...fns: Array<((v: VerbEntry) => boolean) | undefined>
): ((v: VerbEntry) => boolean) | undefined {
  const active = fns.filter((f): f is (v: VerbEntry) => boolean => !!f);
  if (active.length === 0) return undefined;
  return (v: VerbEntry) => active.every((f) => f(v));
}
