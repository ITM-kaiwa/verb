"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONJUGATION_FORMS } from "@/lib/forms";
import { conjugate, naiveTrap } from "@/lib/conjugate";
import { pickRandomVerbs, sourceFilter } from "@/lib/verbData";
import HelpButton from "@/components/HelpButton";
import type { ConjugationFormId, DataSourceSetting, VerbEntry } from "@/lib/types";

function getCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  try {
    if (!ref.current) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      ref.current = new AudioCtx();
    }
    return ref.current;
  } catch {
    return null;
  }
}

function playVulcanShot(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = getCtx(ref);
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    // ignore
  }
}

function playMissileLaunch(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = getCtx(ref);
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.34);
  } catch {
    // ignore
  }
}

function playExplosion(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = getCtx(ref);
    if (!ctx) return;
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // ignore
  }
}

const HELP_BODY = [
  "Phía trên hiển thị động từ thể ます và tên thể chia cần bắn hạ (ví dụ「て形」).",
  "4 máy bay địch bay bên phải, mỗi chiếc mang một thể chia khác nhau — chỉ 1 chiếc là đúng.",
  "Di chuyển bằng 4 phím mũi tên ←↑↓→.",
  "Vulcan (giữ phím X): tầm bắn ngắn (~1/3 màn hình). Sát thương lên máy bay địch được cộng dồn vĩnh viễn (không hồi phục) — chỉ cần đủ ~2 giây bắn trúng tính gộp là hạ được, kể cả bắn ngắt quãng. Máy bay của bạn thì ngược lại: phải bị bắn trúng liên tục ~3 giây không ngắt quãng mới nổ. Bắn trúng tên lửa (của cả 2 bên) thì hạ ngay lập tức bất kể bên nào bắn.",
  "Tên lửa (phím Z, bạn có 4 quả, mỗi máy bay địch có 2 quả): khi có vòng khóa mục tiêu màu xanh lá hiện trên địch (trong tầm 2/3 màn hình, ngay phía trước), bắn 1 phát là hạ luôn.",
  "Chaff/flare (phím C): mở một vùng gây nhiễu quanh máy bay của bạn trong 2 giây — tên lửa địch bay vào vùng đó trong lúc còn hiệu lực sẽ mất khóa vĩnh viễn và bay thẳng trượt qua.",
  "Gọi僚機 hỗ trợ (phím S): một máy bay đồng đội xuất hiện trong 10 giây và tự bắn vào máy bay địch gần nhất một cách không phân biệt đúng/sai — có thể vô tình bắn hạ đúng mục tiêu (được tính vào chuỗi) hoặc bắn nhầm (mất chuỗi). Có thời gian hồi sau khi hết hiệu lực.",
  "Địch cũng được trang bị y hệt bạn — chúng sẽ bắn vulcan và tên lửa lại bạn theo đúng luật trên.",
  "Bắn hạ đúng 5 chiếc liên tiếp để qua màn (bắn trúng địch sai sẽ làm mất chuỗi). Tổng cộng 5 màn, càng lên cao địch càng nhanh và bắn trả nhiều hơn.",
  "Nhấn phím Space bất cứ lúc nào để tạm dừng／tiếp tục.",
];

// Fixed logical resolution — the canvas element scales to its container via
// CSS while physics/positions stay in this coordinate space.
const W = 960;
const H = 450;
const STREAK_GOAL = 5;
const TOTAL_STAGES = 5;
const ENEMY_COUNT = 4;
const VULCAN_RANGE = W / 3;
const MISSILE_RANGE = (W * 2) / 3;
const ALIGN_TOLERANCE = 70;
const PLAYER_SPEED = 4.2;
const PLAYER_BOUNDS = { minX: 24, maxX: W * 0.26, minY: 28, maxY: H - 28 };
const ENEMY_BOUNDS = { minX: W * 0.42, maxX: W - 40, minY: 34, maxY: H - 34 };
const VULCAN_COOLDOWN_MS = 110;
const MISSILE_COOLDOWN_MS = 1400;
const VULCAN_SPEED = 13;
const MISSILE_SPEED = 4;
// Enemy aircraft go down after the equivalent of ~2s of vulcan hits, and that
// damage is cumulative — it never resets, hits can land across separate
// bursts. The player's own aircraft is tougher (~3s) but must take that fire
// continuously: any gap longer than VULCAN_HIT_GAP_MS between hits resets it
// back to zero (see registerVulcanHit's resetOnGap param). A missile, by
// contrast, is destroyed by a single vulcan hit on either side (see collisions).
const ENEMY_VULCAN_KILL_MS = 2000;
const PLAYER_VULCAN_KILL_MS = 3000;
const ENEMY_VULCAN_HITS_TO_KILL = Math.ceil(ENEMY_VULCAN_KILL_MS / VULCAN_COOLDOWN_MS);
const PLAYER_VULCAN_HITS_TO_KILL = Math.ceil(PLAYER_VULCAN_KILL_MS / VULCAN_COOLDOWN_MS);
const VULCAN_HIT_GAP_MS = 300;
const HIT_RADIUS = 22;
const CHAFF_COOLDOWN_MS = 3000;
const CHAFF_DURATION_MS = 2000;
const CHAFF_RADIUS = 90;
const PLAYER_MISSILE_AMMO = 4;
const ENEMY_MISSILE_AMMO = 2;
const WINGMAN_DURATION_MS = 10000;
const WINGMAN_COOLDOWN_MS = 8000; // starts once the wingman leaves
const WINGMAN_FIRE_INTERVAL_MS = 260;

interface Combatant {
  vulcanHits: number;
  lastVulcanHitAt: number;
}
interface Enemy extends Combatant {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speedMul: number;
  text: string;
  correct: boolean;
  redirectAt: number;
  nextVulcanAt: number;
  nextMissileAt: number;
  missilesLeft: number;
}
interface Bullet {
  x: number;
  y: number;
  vx: number;
}
interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homing: "player" | number | null; // "player", an enemy id, or null once chaff breaks its lock
}
interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}
// Directional (aimed-at-fire-time, non-homing) shot fired by the wingman at
// whichever enemy is nearest when it fires — unlike the player's own vulcan,
// which only ever travels straight right.
interface WingmanBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Wingman {
  x: number;
  y: number;
  expiresAt: number;
  nextShotAt: number;
}

type Phase = "playing" | "stage-clear" | "game-clear" | "game-over";

let enemySeq = 0;

function buildTarget(dataSource: DataSourceSetting) {
  const formMeta = CONJUGATION_FORMS[Math.floor(Math.random() * CONJUGATION_FORMS.length)];
  const [verb] = pickRandomVerbs(1, new Set(), sourceFilter(dataSource));
  return { formMeta, verb, correctText: conjugate(verb)[formMeta.id] };
}

function spawnEnemy(text: string, correct: boolean, speedMul: number, now: number): Enemy {
  return {
    id: enemySeq++,
    x: W + Math.random() * 60,
    y: ENEMY_BOUNDS.minY + Math.random() * (ENEMY_BOUNDS.maxY - ENEMY_BOUNDS.minY),
    vx: -(0.4 + Math.random() * 0.8) * speedMul,
    vy: (Math.random() - 0.5) * 1.6 * speedMul,
    speedMul,
    text,
    correct,
    redirectAt: now + 700 + Math.random() * 1200,
    nextVulcanAt: now + 500 + Math.random() * 1000,
    nextMissileAt: now + 1500 + Math.random() * 2000,
    missilesLeft: ENEMY_MISSILE_AMMO,
    vulcanHits: 0,
    lastVulcanHitAt: -Infinity,
  };
}

function buildEnemies(
  verb: VerbEntry,
  formId: ConjugationFormId,
  correctText: string,
  dataSource: DataSourceSetting,
  speedMul: number,
  now: number
): Enemy[] {
  const decoyPool = pickRandomVerbs(ENEMY_COUNT * 4, new Set([verb.id]), sourceFilter(dataSource));
  const texts: string[] = [];
  const seen = new Set([correctText]);

  const trap = naiveTrap(verb, formId);
  if (trap && !seen.has(trap)) {
    texts.push(trap);
    seen.add(trap);
  }
  for (const v of decoyPool) {
    if (texts.length >= ENEMY_COUNT - 1) break;
    const ans = conjugate(v)[formId];
    if (seen.has(ans)) continue;
    seen.add(ans);
    texts.push(ans);
  }

  const all = [{ text: correctText, correct: true }, ...texts.map((text) => ({ text, correct: false }))];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map((c) => spawnEnemy(c.text, c.correct, speedMul, now));
}

/** The enemy a missile fired right now would lock onto: nearest one dead
 * ahead of `p` and within missile range (shared by fireMissile and the HUD
 * lock-on reticle so they always agree). */
function findMissileLock(enemies: Enemy[], p: { x: number; y: number }): Enemy | null {
  const candidates = enemies.filter(
    (e) => e.x > p.x && e.x - p.x <= MISSILE_RANGE && Math.abs(e.y - p.y) <= ALIGN_TOLERANCE
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.x - b.x);
  return candidates[0];
}

/** Registers one vulcan hit on a combatant; returns true once sustained fire
 * has reached the kill threshold (resets on gaps longer than the grace period). */
function registerVulcanHit(entity: Combatant, now: number, hitsToKill: number, resetOnGap: boolean): boolean {
  if (resetOnGap && now - entity.lastVulcanHitAt > VULCAN_HIT_GAP_MS) entity.vulcanHits = 0;
  entity.lastVulcanHitAt = now;
  entity.vulcanHits += 1;
  return entity.vulcanHits >= hitsToKill;
}

export default function AirCombatGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);

  const [hud, setHud] = useState({
    masuForm: "",
    formLabelJa: "",
    formLabelVn: "",
    streak: 0,
    stage: 1,
    phase: "playing" as Phase,
    missilesLeft: PLAYER_MISSILE_AMMO,
  });

  const gameRef = useRef<{
    player: { x: number; y: number } & Combatant;
    keys: Record<string, boolean>;
    enemies: Enemy[];
    bullets: Bullet[];
    missiles: Missile[];
    enemyBullets: Bullet[];
    enemyMissiles: Missile[];
    clouds: Cloud[];
    target: { verb: VerbEntry; formId: ConjugationFormId; correctText: string } | null;
    stage: number;
    streak: number;
    speedMul: number;
    lastVulcan: number;
    lastMissile: number;
    lastChaff: number;
    firingVulcan: boolean;
    phase: Phase;
    flash: { text: string; color: string; until: number } | null;
    playerHitUntil: number;
    playerMissilesLeft: number;
    chaffActiveUntil: number;
    wingman: Wingman | null;
    wingmanBullets: WingmanBullet[];
    wingmanNextAvailableAt: number;
    paused: boolean;
  } | null>(null);

  const initStage = useCallback(
    (stage: number) => {
      const now = performance.now();
      const speedMul = 1 + (stage - 1) * 0.22;
      const { formMeta, verb, correctText } = buildTarget(dataSource);
      const enemies = buildEnemies(verb, formMeta.id, correctText, dataSource, speedMul, now);
      const g = gameRef.current!;
      g.enemies = enemies;
      g.target = { verb, formId: formMeta.id, correctText };
      g.stage = stage;
      g.streak = 0;
      g.speedMul = speedMul;
      g.bullets = [];
      g.missiles = [];
      g.enemyBullets = [];
      g.enemyMissiles = [];
      g.phase = "playing";
      g.playerMissilesLeft = PLAYER_MISSILE_AMMO;
      setHud({
        masuForm: verb.masuForm,
        formLabelJa: formMeta.labelJa,
        formLabelVn: formMeta.labelVn,
        streak: 0,
        stage,
        phase: "playing",
        missilesLeft: PLAYER_MISSILE_AMMO,
      });
    },
    [dataSource]
  );

  const nextTarget = useCallback(() => {
    const g = gameRef.current!;
    const now = performance.now();
    const { formMeta, verb, correctText } = buildTarget(dataSource);
    g.enemies = buildEnemies(verb, formMeta.id, correctText, dataSource, g.speedMul, now);
    g.target = { verb, formId: formMeta.id, correctText };
    setHud((h) => ({ ...h, masuForm: verb.masuForm, formLabelJa: formMeta.labelJa, formLabelVn: formMeta.labelVn }));
  }, [dataSource]);

  const restart = useCallback(() => {
    gameRef.current = {
      player: { x: 90, y: H / 2, vulcanHits: 0, lastVulcanHitAt: -Infinity },
      keys: {},
      enemies: [],
      bullets: [],
      missiles: [],
      enemyBullets: [],
      enemyMissiles: [],
      clouds: Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * W,
        y: 30 + i * 70 + Math.random() * 30,
        scale: 0.7 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.3,
      })),
      target: null,
      stage: 1,
      streak: 0,
      speedMul: 1,
      lastVulcan: 0,
      lastMissile: 0,
      lastChaff: 0,
      firingVulcan: false,
      phase: "playing",
      flash: null,
      playerHitUntil: 0,
      playerMissilesLeft: PLAYER_MISSILE_AMMO,
      chaffActiveUntil: 0,
      wingman: null,
      wingmanBullets: [],
      wingmanNextAvailableAt: 0,
      paused: false,
    };
    initStage(1);
  }, [initStage]);

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background music: start on mount (best-effort — browsers may block
  // autoplay until the user interacts with the page), stop on unmount.
  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    if (!muted) audio.play().catch(() => {});
    else audio.pause();
  }, [muted]);

  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
    };
  }, []);

  const handleHit = useCallback(
    (enemy: Enemy) => {
      const g = gameRef.current!;
      g.enemies = g.enemies.filter((e) => e.id !== enemy.id);
      playExplosion(audioCtxRef);

      if (enemy.correct) {
        g.streak += 1;
        g.flash = { text: "Trúng!", color: "#2F7D3C", until: performance.now() + 500 };
        if (g.streak >= STREAK_GOAL) {
          if (g.stage >= TOTAL_STAGES) {
            g.phase = "game-clear";
            setHud((h) => ({ ...h, streak: g.streak, phase: "game-clear" }));
          } else {
            g.phase = "stage-clear";
            setHud((h) => ({ ...h, streak: g.streak, phase: "stage-clear" }));
          }
          return;
        }
        nextTarget();
        setHud((h) => ({ ...h, streak: g.streak }));
      } else {
        g.streak = 0;
        g.flash = { text: "Sai!", color: "#C1443A", until: performance.now() + 500 };
        const decoyPool = pickRandomVerbs(6, new Set(), sourceFilter(dataSource));
        const existingTexts = new Set(g.enemies.map((e) => e.text));
        existingTexts.add(g.target!.correctText);
        let replacementText = enemy.text;
        for (const v of decoyPool) {
          const ans = conjugate(v)[g.target!.formId];
          if (!existingTexts.has(ans)) {
            replacementText = ans;
            break;
          }
        }
        g.enemies.push(spawnEnemy(replacementText, false, g.speedMul, performance.now()));
        setHud((h) => ({ ...h, streak: 0 }));
      }
    },
    [dataSource, nextTarget]
  );

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function frame() {
      const g = gameRef.current;
      if (!g) return;
      const now = performance.now();

      if (g.phase === "playing" && !g.paused) {
        // Player movement (arrow keys)
        const p = g.player;
        if (g.keys["ArrowUp"]) p.y -= PLAYER_SPEED;
        if (g.keys["ArrowDown"]) p.y += PLAYER_SPEED;
        if (g.keys["ArrowLeft"]) p.x -= PLAYER_SPEED;
        if (g.keys["ArrowRight"]) p.x += PLAYER_SPEED;
        p.x = Math.min(PLAYER_BOUNDS.maxX, Math.max(PLAYER_BOUNDS.minX, p.x));
        p.y = Math.min(PLAYER_BOUNDS.maxY, Math.max(PLAYER_BOUNDS.minY, p.y));

        // Player vulcan auto-fire while held
        if (g.firingVulcan && now - g.lastVulcan > VULCAN_COOLDOWN_MS) {
          g.lastVulcan = now;
          g.bullets.push({ x: p.x + 26, y: p.y, vx: VULCAN_SPEED });
          playVulcanShot(audioCtxRef);
        }

        // Enemies: wander + occasional direction change, bounce on bounds; also
        // return fire at the player with the same weapons/ranges the player has.
        for (const e of g.enemies) {
          if (now > e.redirectAt) {
            e.vx = -(0.4 + Math.random() * 0.9) * e.speedMul;
            e.vy = (Math.random() - 0.5) * 1.8 * e.speedMul;
            e.redirectAt = now + 700 + Math.random() * 1300;
          }
          e.x += e.vx;
          e.y += e.vy;
          if (e.x < ENEMY_BOUNDS.minX || e.x > ENEMY_BOUNDS.maxX) e.vx *= -1;
          if (e.y < ENEMY_BOUNDS.minY || e.y > ENEMY_BOUNDS.maxY) e.vy *= -1;
          e.x = Math.min(ENEMY_BOUNDS.maxX, Math.max(ENEMY_BOUNDS.minX, e.x));
          e.y = Math.min(ENEMY_BOUNDS.maxY, Math.max(ENEMY_BOUNDS.minY, e.y));

          const dx = e.x - p.x;
          const alignedWithPlayer = Math.abs(e.y - p.y) <= ALIGN_TOLERANCE && dx > 0;
          if (now > e.nextVulcanAt && alignedWithPlayer && dx <= VULCAN_RANGE) {
            e.nextVulcanAt = now + VULCAN_COOLDOWN_MS + Math.random() * 40;
            g.enemyBullets.push({ x: e.x - 26, y: e.y, vx: -VULCAN_SPEED });
            playVulcanShot(audioCtxRef);
          }
          if (now > e.nextMissileAt && alignedWithPlayer && dx <= MISSILE_RANGE && e.missilesLeft > 0) {
            e.nextMissileAt = now + MISSILE_COOLDOWN_MS + Math.random() * 600;
            e.missilesLeft -= 1;
            g.enemyMissiles.push({ x: e.x - 26, y: e.y, vx: -MISSILE_SPEED, vy: 0, homing: "player" });
            playMissileLaunch(audioCtxRef);
          }
        }

        // Player bullets
        for (const b of g.bullets) b.x += b.vx;
        g.bullets = g.bullets.filter((b) => b.x - (p.x + 26) < VULCAN_RANGE && b.x < W);

        // Enemy bullets
        for (const b of g.enemyBullets) b.x += b.vx;
        g.enemyBullets = g.enemyBullets.filter((b) => b.x > -20);

        // Wingman (S key): hovers near the player and fires indiscriminately
        // at whichever enemy is nearest, for a limited time.
        if (g.wingman) {
          if (now > g.wingman.expiresAt) {
            g.wingman = null;
            g.wingmanNextAvailableAt = now + WINGMAN_COOLDOWN_MS;
          } else {
            g.wingman.x = p.x + 34;
            g.wingman.y = p.y - 46;
            if (now > g.wingman.nextShotAt && g.enemies.length > 0) {
              g.wingman.nextShotAt = now + WINGMAN_FIRE_INTERVAL_MS;
              let nearest = g.enemies[0];
              let bestDist = Math.hypot(nearest.x - g.wingman.x, nearest.y - g.wingman.y);
              for (const e of g.enemies) {
                const d = Math.hypot(e.x - g.wingman.x, e.y - g.wingman.y);
                if (d < bestDist) {
                  bestDist = d;
                  nearest = e;
                }
              }
              const dx = nearest.x - g.wingman.x;
              const dy = nearest.y - g.wingman.y;
              const dist = Math.hypot(dx, dy) || 1;
              g.wingmanBullets.push({
                x: g.wingman.x,
                y: g.wingman.y,
                vx: (dx / dist) * VULCAN_SPEED,
                vy: (dy / dist) * VULCAN_SPEED,
              });
              playVulcanShot(audioCtxRef);
            }
          }
        }
        for (const b of g.wingmanBullets) {
          b.x += b.vx;
          b.y += b.vy;
        }
        g.wingmanBullets = g.wingmanBullets.filter((b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

        // Player missiles: home toward their locked enemy
        for (const m of g.missiles) {
          const target = g.enemies.find((e) => e.id === m.homing);
          if (target) {
            const dx = target.x - m.x;
            const dy = target.y - m.y;
            const dist = Math.hypot(dx, dy) || 1;
            m.vx = (dx / dist) * MISSILE_SPEED;
            m.vy = (dy / dist) * MISSILE_SPEED;
          }
          m.x += m.vx;
          m.y += m.vy;
        }
        g.missiles = g.missiles.filter((m) => m.x < W + 20 && m.x > -20 && m.y > -20 && m.y < H + 20);

        // Enemy missiles: home toward the player. Chaff/flare (phím C) opens
        // a jamming field around the player for CHAFF_DURATION_MS — any
        // still-homing missile that enters it permanently loses its lock and
        // just flies straight on from then on.
        const chaffActive = now < g.chaffActiveUntil;
        for (const m of g.enemyMissiles) {
          if (chaffActive && m.homing === "player" && Math.hypot(m.x - p.x, m.y - p.y) <= CHAFF_RADIUS) {
            m.homing = null;
          }
          if (m.homing === "player") {
            const dx = p.x - m.x;
            const dy = p.y - m.y;
            const dist = Math.hypot(dx, dy) || 1;
            m.vx = (dx / dist) * MISSILE_SPEED;
            m.vy = (dy / dist) * MISSILE_SPEED;
          }
          m.x += m.vx;
          m.y += m.vy;
        }
        g.enemyMissiles = g.enemyMissiles.filter((m) => m.x < W + 20 && m.x > -20 && m.y > -20 && m.y < H + 20);

        // Collisions: player's missiles vs enemies (instant kill)
        outerPlayerMissileHits: for (let i = g.missiles.length - 1; i >= 0; i--) {
          const m = g.missiles[i];
          for (const e of g.enemies) {
            if (Math.hypot(m.x - e.x, m.y - e.y) < HIT_RADIUS) {
              g.missiles.splice(i, 1);
              handleHit(e);
              continue outerPlayerMissileHits;
            }
          }
        }
        // Player vulcan: can shoot down an incoming enemy missile in one hit,
        // otherwise chips away at an enemy's sustained-fire kill threshold.
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i];
          let consumed = false;
          for (let j = g.enemyMissiles.length - 1; j >= 0; j--) {
            if (Math.hypot(b.x - g.enemyMissiles[j].x, b.y - g.enemyMissiles[j].y) < HIT_RADIUS) {
              g.enemyMissiles.splice(j, 1);
              g.bullets.splice(i, 1);
              playExplosion(audioCtxRef);
              consumed = true;
              break;
            }
          }
          if (consumed) continue;
          for (const e of g.enemies) {
            if (Math.hypot(b.x - e.x, b.y - e.y) < HIT_RADIUS) {
              g.bullets.splice(i, 1);
              if (registerVulcanHit(e, now, ENEMY_VULCAN_HITS_TO_KILL, false)) handleHit(e);
              break;
            }
          }
        }
        // Wingman fire: same cumulative-damage rule as the player's own
        // vulcan, but indiscriminate — it doesn't know which enemy is correct.
        outerWingmanHits: for (let i = g.wingmanBullets.length - 1; i >= 0; i--) {
          const b = g.wingmanBullets[i];
          for (const e of g.enemies) {
            if (Math.hypot(b.x - e.x, b.y - e.y) < HIT_RADIUS) {
              g.wingmanBullets.splice(i, 1);
              if (registerVulcanHit(e, now, ENEMY_VULCAN_HITS_TO_KILL, false)) handleHit(e);
              continue outerWingmanHits;
            }
          }
        }

        // Collisions: enemy missiles vs player (instant kill)
        if (now > g.playerHitUntil && g.phase === "playing") {
          for (let i = g.enemyMissiles.length - 1; i >= 0; i--) {
            const m = g.enemyMissiles[i];
            if (Math.hypot(m.x - p.x, m.y - p.y) < HIT_RADIUS) {
              g.enemyMissiles.splice(i, 1);
              playExplosion(audioCtxRef);
              g.phase = "game-over";
              setHud((h) => ({ ...h, phase: "game-over" }));
              break;
            }
          }
        }
        // Enemy vulcan: can shoot down the player's outgoing missile in one
        // hit, otherwise chips away at the player's sustained-fire threshold.
        if (g.phase === "playing") {
          for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
            const b = g.enemyBullets[i];
            let consumed = false;
            for (let j = g.missiles.length - 1; j >= 0; j--) {
              if (Math.hypot(b.x - g.missiles[j].x, b.y - g.missiles[j].y) < HIT_RADIUS) {
                g.missiles.splice(j, 1);
                g.enemyBullets.splice(i, 1);
                playExplosion(audioCtxRef);
                consumed = true;
                break;
              }
            }
            if (consumed) continue;
            if (now > g.playerHitUntil && Math.hypot(b.x - p.x, b.y - p.y) < HIT_RADIUS) {
              g.enemyBullets.splice(i, 1);
              g.playerHitUntil = now + 120;
              if (registerVulcanHit(p, now, PLAYER_VULCAN_HITS_TO_KILL, true)) {
                playExplosion(audioCtxRef);
                g.phase = "game-over";
                setHud((h) => ({ ...h, phase: "game-over" }));
              }
              break;
            }
          }
        }

        // Clouds drift
        for (const c of g.clouds) {
          c.x -= c.speed;
          if (c.x < -80) {
            c.x = W + 80;
            c.y = 20 + Math.random() * (H - 60);
          }
        }
      }

      draw(ctx!, g, now);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleHit]);

  // Keyboard input — movement is the 4 arrow keys; X = vulcan, Z = missile,
  // C = chaff/flare (breaks the lock of any incoming enemy missiles).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const g = gameRef.current;
      if (!g) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault(); // Space normally scrolls the page
        togglePause();
        return;
      }
      if (e.key.startsWith("Arrow")) e.preventDefault();
      g.keys[e.key] = true;
      if (e.key === "x" || e.key === "X") g.firingVulcan = true;
      if (e.key === "z" || e.key === "Z") fireMissile();
      if (e.key === "c" || e.key === "C") deployChaff();
      if (e.key === "s" || e.key === "S") summonWingman();
    }
    function onKeyUp(e: KeyboardEvent) {
      const g = gameRef.current;
      if (!g) return;
      g.keys[e.key] = false;
      if (e.key === "x" || e.key === "X") g.firingVulcan = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fireMissile() {
    const g = gameRef.current;
    if (!g || g.phase !== "playing" || g.paused) return;
    const now = performance.now();
    if (now - g.lastMissile < MISSILE_COOLDOWN_MS) return;
    if (g.playerMissilesLeft <= 0) return;

    const target = findMissileLock(g.enemies, g.player);
    if (!target) return;

    g.lastMissile = now;
    g.playerMissilesLeft -= 1;
    setHud((h) => ({ ...h, missilesLeft: g.playerMissilesLeft }));
    g.missiles.push({ x: g.player.x + 26, y: g.player.y, vx: MISSILE_SPEED, vy: 0, homing: target.id });
    playMissileLaunch(audioCtxRef);
  }

  /** Chaff/flare: opens a jamming field around the player for
   * CHAFF_DURATION_MS — any enemy missile that comes within CHAFF_RADIUS of
   * the player while it's active permanently loses its lock (see the
   * enemy-missile update in the main loop) and just flies straight on. */
  function deployChaff() {
    const g = gameRef.current;
    if (!g || g.phase !== "playing" || g.paused) return;
    const now = performance.now();
    if (now - g.lastChaff < CHAFF_COOLDOWN_MS) return;
    g.lastChaff = now;
    g.chaffActiveUntil = now + CHAFF_DURATION_MS;
  }

  /** Wingman: a support jet that shows up for a while and fires at whatever
   * enemy is nearest, indiscriminately (correct or not — same handleHit path
   * as the player's own kills, so it can help or accidentally cost a streak). */
  function summonWingman() {
    const g = gameRef.current;
    if (!g || g.phase !== "playing" || g.paused) return;
    const now = performance.now();
    if (g.wingman || now < g.wingmanNextAvailableAt) return;
    g.wingman = { x: g.player.x + 34, y: g.player.y - 46, expiresAt: now + WINGMAN_DURATION_MS, nextShotAt: now + 300 };
  }

  function togglePause() {
    const g = gameRef.current;
    if (!g || g.phase !== "playing") return;
    g.paused = !g.paused;
  }

  function setDirKey(key: string, down: boolean) {
    const g = gameRef.current;
    if (!g) return;
    g.keys[key] = down;
  }

  function draw(ctx: CanvasRenderingContext2D, g: NonNullable<typeof gameRef.current>, now: number) {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#8FCBEE");
    sky.addColorStop(1, "#CDEBFA");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of g.clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 34 * c.scale, 16 * c.scale, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 24 * c.scale, c.y + 6 * c.scale, 22 * c.scale, 13 * c.scale, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 24 * c.scale, c.y + 8 * c.scale, 20 * c.scale, 12 * c.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player (delta-wing jet, facing right); flicker while briefly hit
    const p = g.player;
    if (now > g.playerHitUntil || Math.floor(now / 80) % 2 === 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = "#3B5568";
      ctx.strokeStyle = "#1F2E38";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-22, -16);
      ctx.lineTo(-16, -4);
      ctx.lineTo(-26, -2);
      ctx.lineTo(-26, 2);
      ctx.lineTo(-16, 4);
      ctx.lineTo(-22, 16);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#9FD3E8";
      ctx.beginPath();
      ctx.ellipse(6, 0, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Wingman (S key): a smaller jet in a lighter, distinct color
    if (g.wingman) {
      ctx.save();
      ctx.translate(g.wingman.x, g.wingman.y);
      ctx.scale(0.75, 0.75);
      ctx.fillStyle = "#6FA8C4";
      ctx.strokeStyle = "#2C5A70";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-22, -16);
      ctx.lineTo(-16, -4);
      ctx.lineTo(-26, -2);
      ctx.lineTo(-26, 2);
      ctx.lineTo(-16, 4);
      ctx.lineTo(-22, 16);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Sustained-fire exposure ring on the player
    if (p.vulcanHits > 0 && now - p.lastVulcanHitAt < VULCAN_HIT_GAP_MS) {
      ctx.strokeStyle = "rgba(193,68,58,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, -Math.PI / 2, -Math.PI / 2 + (p.vulcanHits / PLAYER_VULCAN_HITS_TO_KILL) * Math.PI * 2);
      ctx.stroke();
    }

    // Chaff/flare jamming field, visible for its whole active duration
    if (now < g.chaffActiveUntil) {
      ctx.strokeStyle = "rgba(230,230,230,0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, CHAFF_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Range guides (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x + VULCAN_RANGE, 0);
    ctx.lineTo(p.x + VULCAN_RANGE, H);
    ctx.stroke();
    ctx.setLineDash([]);

    const lockTarget = g.phase === "playing" ? findMissileLock(g.enemies, p) : null;

    // Enemies
    for (const e of g.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = e.correct ? "#B5544A" : "#8A4A46";
      ctx.strokeStyle = "#4A2418";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(10, -6);
      ctx.lineTo(20, -14);
      ctx.lineTo(15, -3);
      ctx.lineTo(24, -2);
      ctx.lineTo(24, 2);
      ctx.lineTo(15, 3);
      ctx.lineTo(20, 14);
      ctx.lineTo(10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Enemy damage is cumulative (never resets), so show it whenever any
      // has landed — not just right after the most recent hit.
      if (e.vulcanHits > 0) {
        ctx.strokeStyle = "rgba(193,68,58,0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 20, -Math.PI / 2, -Math.PI / 2 + (e.vulcanHits / ENEMY_VULCAN_HITS_TO_KILL) * Math.PI * 2);
        ctx.stroke();
      }

      // Label pill
      ctx.font = "600 15px 'Klee One', serif";
      const textW = ctx.measureText(e.text).width;
      const pillW = textW + 14;
      ctx.fillStyle = "rgba(250,243,184,0.95)";
      ctx.strokeStyle = "#8C6D3F";
      ctx.lineWidth = 1;
      roundRect(ctx, e.x - pillW / 2, e.y + 20, pillW, 22, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4C3A22";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.text, e.x, e.y + 31);
    }

    // Green lock-on reticle over whichever enemy a missile would target now
    if (lockTarget) {
      ctx.save();
      ctx.translate(lockTarget.x, lockTarget.y);
      ctx.strokeStyle = "#3FCB4F";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
      for (const [x1, y1, x2, y2] of [
        [0, -30, 0, -22],
        [0, 30, 0, 22],
        [-30, 0, -22, 0],
        [30, 0, 22, 0],
      ]) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Bullets (player deep orange, enemy orange-red)
    ctx.fillStyle = "#C2540A";
    for (const b of g.bullets) ctx.fillRect(b.x - 6, b.y - 2, 12, 4);
    ctx.fillStyle = "#E85B3B";
    for (const b of g.enemyBullets) ctx.fillRect(b.x - 6, b.y - 2, 12, 4);
    ctx.fillStyle = "#3FB6C4";
    for (const b of g.wingmanBullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    }

    // Missiles
    for (const [list, color] of [
      [g.missiles, "#F4763A"],
      [g.enemyMissiles, "#B23A6B"],
    ] as const) {
      ctx.fillStyle = color;
      for (const m of list) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(Math.atan2(m.vy, m.vx));
        ctx.fillRect(-8, -3, 16, 6);
        ctx.restore();
      }
    }

    // Hit flash
    if (g.flash && now < g.flash.until) {
      ctx.fillStyle = g.flash.color;
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(g.flash.text, W / 2, 60);
    }

    // Pause overlay
    if (g.phase === "playing" && g.paused) {
      ctx.fillStyle = "rgba(76,58,34,0.45)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FBF8F1";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⏸ Tạm dừng（Space để tiếp tục）", W / 2, H / 2);
    }

    // Wingman status (phím S)
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    if (g.wingman) {
      ctx.fillStyle = "#2C5A70";
      ctx.fillText(`僚機 (S): còn ${Math.ceil((g.wingman.expiresAt - now) / 1000)}s`, 12, H - 12);
    } else if (now < g.wingmanNextAvailableAt) {
      ctx.fillStyle = "rgba(76,58,34,0.55)";
      ctx.fillText(`僚機 (S): hồi ${Math.ceil((g.wingmanNextAvailableAt - now) / 1000)}s`, 12, H - 12);
    } else {
      ctx.fillStyle = "#4C3A22";
      ctx.fillText("僚機 (S): sẵn sàng", 12, H - 12);
    }
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <audio ref={bgmRef} src="/audio/skyward-thrust.mp3" loop />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-sand-600">
        <span className="flex items-center gap-2">
          Màn {hud.stage}/{TOTAL_STAGES}
          <HelpButton title="Không chiến chia động từ" body={HELP_BODY} />
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Bật nhạc" : "Tắt nhạc"}
            title={muted ? "Bật nhạc" : "Tắt nhạc"}
            className="btn-press rounded-full border border-sand-300 bg-sand-50 px-2 py-1 text-xs text-sand-600 shadow-card hover:bg-sand-200"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </span>
        <span className="rounded-full bg-sand-200 px-3 py-1 font-semibold text-sand-700">
          Bắn hạ: {hud.formLabelVn}（{hud.formLabelJa}）
        </span>
        <span className="flex items-center gap-3">
          <span>Tên lửa: {hud.missilesLeft}/{PLAYER_MISSILE_AMMO}</span>
          <span>
            Chuỗi: {hud.streak}/{STREAK_GOAL}
          </span>
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-sand-300 shadow-card">
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-xl border border-sand-300 bg-sand-50/90 px-4 py-1 text-center shadow">
          <p className="font-kyokasho text-2xl text-kanjibrown">{hud.masuForm}</p>
        </div>

        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />

        {hud.phase !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-sand-50/90">
            <div className="space-y-3 rounded-2xl border border-sand-300 bg-sand-50 p-6 text-center shadow-card">
              <p className="text-lg font-semibold text-sand-700">
                {hud.phase === "stage-clear" && `Qua màn ${hud.stage}!`}
                {hud.phase === "game-clear" && "Chinh phục tất cả 5 màn! 🎉"}
                {hud.phase === "game-over" && "Máy bay của bạn đã bị bắn hạ…"}
              </p>
              <button
                type="button"
                onClick={() => (hud.phase === "stage-clear" ? initStage(hud.stage + 1) : restart())}
                className="btn-press rounded-full bg-sand-600 px-5 py-2 text-sm font-semibold text-sand-50 shadow hover:brightness-95"
              >
                {hud.phase === "stage-clear" ? "Màn tiếp theo →" : "Chơi lại"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="grid w-28 grid-cols-3 grid-rows-2 gap-1">
          <div />
          <TouchButton label="▲" onDown={() => setDirKey("ArrowUp", true)} onUp={() => setDirKey("ArrowUp", false)} />
          <div />
          <TouchButton label="◀" onDown={() => setDirKey("ArrowLeft", true)} onUp={() => setDirKey("ArrowLeft", false)} />
          <TouchButton label="▼" onDown={() => setDirKey("ArrowDown", true)} onUp={() => setDirKey("ArrowDown", false)} />
          <TouchButton label="▶" onDown={() => setDirKey("ArrowRight", true)} onUp={() => setDirKey("ArrowRight", false)} />
        </div>
        <p className="text-center text-[11px] text-sand-500">
          Di chuyển: ←↑↓→　Vulcan: giữ X　Tên lửa: Z　Chaff/flare: C　Gọi僚機 hỗ trợ: S　Tạm dừng: Space
        </p>
        <div className="flex gap-2">
          <TouchButton
            label="X"
            wide
            onDown={() => {
              const g = gameRef.current;
              if (g) g.firingVulcan = true;
            }}
            onUp={() => {
              const g = gameRef.current;
              if (g) g.firingVulcan = false;
            }}
          />
          <TouchButton label="Z" wide onDown={fireMissile} onUp={() => {}} />
          <TouchButton label="C" wide onDown={deployChaff} onUp={() => {}} />
          <TouchButton label="S" wide onDown={summonWingman} onUp={() => {}} />
          <TouchButton label="⏸" wide onDown={togglePause} onUp={() => {}} />
        </div>
      </div>
    </div>
  );
}

function TouchButton({
  label,
  onDown,
  onUp,
  wide,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => {
        e.preventDefault();
        onDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onUp();
      }}
      className={`btn-press select-none rounded-lg border border-leaf-300 bg-leaf-100 font-bold text-kanjibrown shadow hover:bg-leaf-200 ${
        wide ? "h-12 w-12 text-lg" : "h-8 w-8 text-sm"
      }`}
    >
      {label}
    </button>
  );
}
