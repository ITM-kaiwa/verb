import raw from "./verbData.generated.json";
import type { VerbEntry } from "./types";

export const VERBS: VerbEntry[] = raw as VerbEntry[];

export function pickRandomVerbs(count: number, exclude: Set<string> = new Set()): VerbEntry[] {
  const pool = VERBS.filter((v) => !exclude.has(v.id));
  const source = pool.length >= count ? pool : VERBS;
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
