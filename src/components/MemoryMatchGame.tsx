"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, kanjiMasuForm } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import Furigana from "@/components/Furigana";
import type { ConjugationFormId, DataSourceSetting, VerbEntry } from "@/lib/types";

const HELP_BODY = [
  "45 thẻ (5 động từ × 9 thể chia) được úp trên bàn chơi.",
  "Rút một thẻ 「ます形」từ chồng bài để làm đề bài, rồi lật từng thẻ trên bàn để tìm thẻ chia đúng của động từ đó.",
  "Đoán đúng thì được đi tiếp; đoán sai thì đổi lượt cho đối thủ (máy tính).",
  "Khi lấy hết 9 thẻ của một đề bài, đề bài mới sẽ được rút ra. Ai lấy được nhiều thẻ hơn sẽ thắng.",
];

const VERB_COUNT = 5;
const REVEAL_MS = 900;
const COMPUTER_THINK_MS = 800;

type Turn = "player" | "computer";
type Phase = "need-draw" | "guessing" | "finished";

interface BoardCard {
  id: string;
  verbIndex: number;
  formId: ConjugationFormId;
  text: string;
  matchedBy: Turn | null;
}

interface DeckCard {
  verbIndex: number;
  verb: VerbEntry;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setupRound(dataSource: DataSourceSetting) {
  const verbs = pickRandomVerbs(VERB_COUNT, new Set(), sourceFilter(dataSource));
  const deck: DeckCard[] = shuffle(verbs.map((verb, verbIndex) => ({ verbIndex, verb })));

  const board: BoardCard[] = shuffle(
    verbs.flatMap((verb, verbIndex) => {
      const forms = conjugate(verb);
      return CONJUGATION_FORMS.map((f) => ({
        id: `${verbIndex}-${f.id}`,
        verbIndex,
        formId: f.id,
        text: forms[f.id],
        matchedBy: null as Turn | null,
      }));
    })
  );

  return { verbs, deck, board };
}

function playTurnChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    window.setTimeout(() => ctx.close(), 800);
  } catch {
    // Autoplay restrictions or an unsupported browser — silently skip the chime.
  }
}

export default function MemoryMatchGame({
  showVietnamese,
  dataSource,
}: {
  showVietnamese: boolean;
  dataSource: DataSourceSetting;
}) {
  const [verbs, setVerbs] = useState<VerbEntry[]>([]);
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [board, setBoard] = useState<BoardCard[]>([]);
  const [target, setTarget] = useState<DeckCard | null>(null);
  const [turn, setTurn] = useState<Turn>("player");
  const [phase, setPhase] = useState<Phase>("need-draw");
  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [revealing, setRevealing] = useState<{ cardId: string; correct: boolean } | null>(null);

  const memoryRef = useRef<Map<string, number>>(new Map());
  const busyRef = useRef(false);
  const prevTurnRef = useRef<Turn>("player");

  const restart = useCallback(() => {
    const { verbs, deck, board } = setupRound(dataSource);
    setVerbs(verbs);
    setDeck(deck);
    setBoard(board);
    setTarget(null);
    setTurn("player");
    setPhase("need-draw");
    setScores({ player: 0, computer: 0 });
    setRevealing(null);
    memoryRef.current = new Map();
    busyRef.current = false;
  }, [dataSource]);

  useEffect(() => {
    restart();
  }, [restart]);

  // Chime whenever the turn comes back around to the player (not on the
  // initial mount, only on an actual computer -> player handoff).
  useEffect(() => {
    if (prevTurnRef.current === "computer" && turn === "player") {
      playTurnChime();
    }
    prevTurnRef.current = turn;
  }, [turn]);

  const drawNext = useCallback(
    () => {
      setDeck((prevDeck) => {
        if (prevDeck.length === 0) {
          setPhase("finished");
          return prevDeck;
        }
        const [next, ...rest] = prevDeck;
        setTarget(next);
        setPhase("guessing");
        return rest;
      });
    },
    []
  );

  function flipCard(cardId: string, who: Turn) {
    if (busyRef.current || phase !== "guessing" || !target) return;
    const card = board.find((c) => c.id === cardId);
    if (!card || card.matchedBy) return;

    busyRef.current = true;
    memoryRef.current.set(card.id, card.verbIndex);

    const correct = card.verbIndex === target.verbIndex;
    setRevealing({ cardId, correct });

    window.setTimeout(() => {
      if (correct) {
        setRevealing(null);
        busyRef.current = false;
        setScores((s) => ({ ...s, [who]: s[who] + 1 }));
        setBoard((prev) => {
          const updated = prev.map((c) => (c.id === cardId ? { ...c, matchedBy: who } : c));
          const remaining = updated.filter(
            (c) => c.verbIndex === target.verbIndex && c.matchedBy === null
          );
          if (remaining.length === 0) {
            setTarget(null);
            setDeck((d) => {
              if (d.length === 0) {
                setPhase("finished");
                return d;
              }
              const [nextCard, ...rest] = d;
              setTarget(nextCard);
              return rest;
            });
          }
          return updated;
        });
      } else {
        setRevealing(null);
        busyRef.current = false;
        setTurn((t) => (t === "player" ? "computer" : "player"));
      }
    }, REVEAL_MS);
  }

  // Player-initiated draw when it's their turn and nothing is active yet.
  function handlePlayerDraw() {
    if (turn !== "player" || phase !== "need-draw") return;
    drawNext();
  }

  // Auto-draw for the computer, and auto-play the computer's guesses.
  useEffect(() => {
    if (turn !== "computer" || busyRef.current) return;

    if (phase === "need-draw") {
      const t = window.setTimeout(() => drawNext(), COMPUTER_THINK_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "guessing" && target) {
      const t = window.setTimeout(() => {
        const known = [...memoryRef.current.entries()].find(([id, verbIndex]) => {
          const card = board.find((c) => c.id === id);
          return verbIndex === target.verbIndex && card && !card.matchedBy;
        });
        let pickId: string | undefined = known?.[0];
        if (!pickId) {
          const candidates = board.filter((c) => !c.matchedBy);
          pickId = candidates[Math.floor(Math.random() * candidates.length)]?.id;
        }
        if (pickId) flipCard(pickId, "computer");
      }, COMPUTER_THINK_MS);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, phase, target, board]);

  if (verbs.length === 0) {
    return <div className="p-8 text-center text-sand-600">Đang tải…</div>;
  }

  if (phase === "finished") {
    const you = scores.player;
    const cpu = scores.computer;
    const resultLabel = you > cpu ? "Bạn thắng!" : you < cpu ? "Máy tính thắng" : "Hòa";
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-sand-300 bg-sand-50 p-8 text-center shadow-card">
        <p className="text-lg font-semibold text-sand-700">{resultLabel}</p>
        <p className="text-sand-600">
          Bạn {you} － {cpu} Máy tính
        </p>
        <button
          type="button"
          onClick={restart}
          className="btn-press rounded-full bg-sand-600 px-5 py-2 text-sm font-semibold text-sand-50 hover:brightness-95"
        >
          Chơi lại
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-semibold ${turn === "player" ? "bg-leaf-200 text-kanjibrown" : "bg-sand-200 text-sand-700"}`}>
            {turn === "player" ? "Lượt của bạn" : "Lượt của máy tính"}
          </span>
          <HelpButton title="Lật thẻ trí nhớ" body={HELP_BODY} />
        </span>
        <span>
          Còn lại: {deck.length + (target ? 1 : 0)} lá
        </span>
        <span className="font-semibold text-sand-700">
          Bạn {scores.player} － {scores.computer} Máy tính
        </span>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-lemon-300/70 bg-lemon-100 p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-center gap-4 rounded-2xl border border-dashed border-leaf-300 bg-lemon-200/60 p-3">
          <div className="text-center">
            <p className="text-[11px] font-medium text-sand-600">Đề bài（ます形）</p>
            {target ? (
              <>
                <p className="font-kyokasho text-2xl text-kanjibrown">{target.verb.masuForm}</p>
                <p className="text-xs text-sand-500">
                  <Furigana kanji={kanjiMasuForm(target.verb)} reading={target.verb.masuForm} />
                  {showVietnamese && ` ／ ${target.verb.meaningVn}`}
                </p>
              </>
            ) : (
              <p className="text-sand-400">－</p>
            )}
          </div>
          {turn === "player" && phase === "need-draw" && (
            <button
              type="button"
              onClick={handlePlayerDraw}
              className="btn-press rounded-full bg-sand-600 px-4 py-2 text-sm font-semibold text-sand-50 shadow hover:brightness-95"
            >
              Rút bài
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9 sm:gap-2">
          {board.map((card) => {
            const isRevealing = revealing?.cardId === card.id;
            const faceUp = card.matchedBy !== null || isRevealing;
            return (
              <button
                key={card.id}
                type="button"
                disabled={
                  turn !== "player" ||
                  phase !== "guessing" ||
                  !!card.matchedBy ||
                  !!revealing ||
                  busyRef.current
                }
                onClick={() => flipCard(card.id, "player")}
                className={`btn-press flex h-14 items-center justify-center rounded-lg border p-1 text-center font-kyokasho text-[10px] leading-tight shadow disabled:cursor-default sm:h-16 sm:text-xs ${
                  card.matchedBy === "player"
                    ? "border-leaf-400 bg-leaf-100 text-kanjibrown"
                    : card.matchedBy === "computer"
                      ? "border-sand-400 bg-sand-200 text-sand-600"
                      : isRevealing
                        ? revealing?.correct
                          ? "border-leaf-400 bg-leaf-100 text-kanjibrown"
                          : "border-wrong bg-red-50 text-wrong"
                        : "border-sand-300 bg-sand-50 text-sand-400 hover:bg-sand-100"
                }`}
              >
                {faceUp ? card.text : "？"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
