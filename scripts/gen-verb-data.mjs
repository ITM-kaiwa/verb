// Merges the two source vocabulary dumps (みんなの日本語 + いろどり) into a single
// flat dataset the app can import directly. Re-run with `node scripts/gen-verb-data.mjs`
// whenever data/*.json changes (e.g. once Vietnamese translations for いろどり land).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const minna = JSON.parse(readFileSync(path.join(root, "data/minna_shokyu1.json"), "utf-8"));
const irodori = JSON.parse(readFileSync(path.join(root, "data/irodori.json"), "utf-8"));

let irodoriVn = [];
try {
  irodoriVn = JSON.parse(readFileSync(path.join(root, "data/irodori_vn.json"), "utf-8"));
} catch {
  console.warn("data/irodori_vn.json not found yet — falling back to meaning_en for いろどり entries.");
}

const groupToNum = { I: 1, II: 2, III: 3 };

const minnaEntries = minna.map((v, i) => ({
  id: `minna-${i}`,
  source: "minna",
  group: groupToNum[v.group],
  kanji: v.kanji,
  hiragana: v.hiragana,
  meaningVn: v.meaning_vn,
  lesson: v.lesson,
  masuForm: v.masu_form,
  teForm: v.te_form,
  naiForm: v.nai_form,
  taForm: v.ta_form,
}));

const irodoriEntries = irodori.map((v, i) => ({
  id: `irodori-${i}`,
  source: "irodori",
  group: v.group,
  kanji: v.kanji,
  hiragana: v.hiragana,
  meaningVn: irodoriVn[i]?.meaning_vn ?? v.meaning_en,
  lesson: v.lesson,
  masuForm: v.masu_form,
  teForm: v.te_form,
  naiForm: v.nai_form,
  taForm: v.ta_form,
}));

// Dedupe by (hiragana + all four given forms) so the same verb/sense repeated
// across lessons in the source files (common in いろどり, which lists a verb
// once per book part it appears in) only shows up once in the practice pool.
const seen = new Set();
const merged = [];
for (const e of [...minnaEntries, ...irodoriEntries]) {
  const key = `${e.hiragana}|${e.masuForm}|${e.teForm}|${e.naiForm}|${e.taForm}`;
  if (seen.has(key)) continue;
  seen.add(key);
  merged.push(e);
}

writeFileSync(
  path.join(root, "src/lib/verbData.generated.json"),
  JSON.stringify(merged, null, 2) + "\n",
  "utf-8"
);

console.log(`Wrote ${merged.length} verb entries (from ${minnaEntries.length} minna + ${irodoriEntries.length} irodori, ${minnaEntries.length + irodoriEntries.length - merged.length} duplicates dropped).`);
