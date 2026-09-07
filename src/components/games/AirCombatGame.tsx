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
  "Di chuyển bằng 4 phím mũi tên ←↑↓→. Giữ phím A để tăng tốc độ di chuyển gấp đôi.",
  "Vulcan (giữ phím X, 350 viên đạn, tiếp đạn đầy mỗi 2 màn): tầm bắn ngắn (~1/3 màn hình). Số đạn còn lại hiện nhỏ ở góc trên bên phải máy bay của bạn. Sát thương lên máy bay địch được cộng dồn vĩnh viễn (không hồi phục) — chỉ cần đủ ~2 giây bắn trúng tính gộp là hạ được, kể cả bắn ngắt quãng. Máy bay của bạn thì ngược lại: phải bị bắn trúng liên tục ~3 giây không ngắt quãng mới nổ. Bắn trúng tên lửa (của cả 2 bên) thì hạ ngay lập tức bất kể bên nào bắn.",
  "Tên lửa (phím Z, bạn có 8 quả, mỗi máy bay địch có 2 quả): khi có vòng khóa mục tiêu màu xanh lá hiện trên địch (trong tầm 2/3 màn hình, ngay phía trước), bắn 1 phát là hạ luôn. Cứ qua 2 màn là được tiếp đạn đầy lại 8 quả.",
  "Laser màu hồng (phím S, 10 phát): bắn xuyên suốt tới tận rìa màn hình theo đúng độ cao của bạn, trúng 2 phát là hạ một máy bay địch; trúng tên lửa địch thì tên lửa nổ ngay lập tức. Thanh ngang nhỏ dưới máy bay của bạn hiện số đạn laser còn lại.",
  "Chaff/flare (phím C): bấm là bắn ngay lập tức, không cần chờ hồi — tỏa ra một chùm mồi bẫy xung quanh máy bay của bạn, chỉ đánh lừa được tên lửa bay tới từ phía sau／trên／dưới. Tên lửa bay thẳng từ chính diện (đối đầu) sẽ không bị mồi bẫy đánh lừa — phải dùng vulcan để bắn hạ loại này. Ngay khi tên lửa của bạn khóa mục tiêu vào một máy bay địch, địch đó có 25% cơ hội tự bắn chaff phòng thủ theo đúng luật tương tự.",
  "Gọi僚機 hỗ trợ (phím D): một máy bay đồng đội xuất hiện trong 10 giây, tự bay theo ý riêng (không cần bám theo bạn) và tự bắn vào máy bay địch gần nhất trong tầm vulcan giống hệt bạn, không phân biệt đúng/sai — có thể vô tình bắn hạ đúng mục tiêu (được tính vào chuỗi) hoặc bắn nhầm (mất chuỗi). Mỗi lần bạn bắn hạ đúng mục tiêu, một僚機 mới cũng tự động được điều đến (không cần chờ hồi).",
  "Địch cũng được trang bị y hệt bạn — chúng sẽ bắn vulcan và tên lửa lại bạn theo đúng luật trên.",
  "Bắn hạ đúng 5 chiếc liên tiếp để qua màn (bắn trúng địch sai sẽ làm mất chuỗi).",
  "Sau màn 5 sẽ xuất hiện trung boss: to lớn, bắn vulcan tứ phía và có 10 quả tên lửa.",
  "Sau màn 10 sẽ xuất hiện quái vật cuối cùng (kaiju): đứng dưới đất, thỉnh thoảng nhảy lên nhưng không tiến tới, thỉnh thoảng phun tia sáng nhắm thẳng vào bạn — dính 3 lần là bạn bị hạ. Nó chỉ gục ngã khi đạt MỘT trong các mốc: 100 phát vulcan, 5 quả tên lửa, hoặc 5 phát laser.",
  "Đánh bại quái vật cuối cùng sẽ quay lại màn 1 với nâng cấp vĩnh viễn: thêm 4 quả tên lửa, thêm 10 phát laser, tầm bắn vulcan xa hơn, và đạn vulcan tăng gấp đôi (700 viên).",
  "Nhấn phím Space bất cứ lúc nào để tạm dừng／tiếp tục.",
];

// Fixed logical resolution — the canvas element scales to its container via
// CSS while physics/positions stay in this coordinate space.
const W = 960;
const H = 450;
const STREAK_GOAL = 5;
// Each "loop": 5 normal stages → mid-boss → 5 more normal stages → final
// boss (kaiju) → loop back to stage 1 with permanent weapon upgrades.
const STAGES_PER_LOOP = 10;
const MID_BOSS_AT_STAGE = 5;
const FINAL_BOSS_AT_STAGE = 10;
const ENEMY_COUNT = 4;
const VULCAN_RANGE = W / 3;
const MISSILE_RANGE = (W * 2) / 3;
const ALIGN_TOLERANCE = 70;
const PLAYER_SPEED = 4.2;
const PLAYER_BOUNDS = { minX: 24, maxX: W * 0.26, minY: 28, maxY: H - 28 };
const ENEMY_BOUNDS = { minX: W * 0.42, maxX: W - 40, minY: 34, maxY: H - 34 };
// The wingman wanders on its own within the friendly (left) side of the
// screen — it doesn't lock onto the player's exact position.
const WINGMAN_BOUNDS = { minX: 20, maxX: W * 0.4, minY: 24, maxY: H - 24 };
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
const CHAFF_PARTICLE_COUNT = 10;
const CHAFF_PARTICLE_LIFETIME_MS = 900;
const CHAFF_SCATTER_RADIUS = 60; // how far particles start from the player
const PLAYER_MISSILE_AMMO = 8;
const ENEMY_MISSILE_AMMO = 2;
const PLAYER_VULCAN_AMMO_BASE = 350;
// Chance an enemy deploys defensive chaff the moment a player missile locks
// onto it (rolled once per missile — see Missile.chaffRolled).
const ENEMY_CHAFF_CHANCE = 0.25;
const WINGMAN_DURATION_MS = 10000;
const WINGMAN_COOLDOWN_MS = 8000; // starts once the wingman leaves
const WINGMAN_FIRE_INTERVAL_MS = 260;
const LASER_AMMO = 10;
const LASER_HITS_TO_KILL = 2;
const LASER_BEAM_FADE_MS = 180;
const LASER_COOLDOWN_MS = 260;
const BOSS_MAX_HP = 40;
const BOSS_VULCAN_DAMAGE = 1;
const BOSS_MISSILE_DAMAGE = 8;
const BOSS_LASER_DAMAGE = 4;
const BOSS_MISSILE_AMMO = 10;
const BOSS_VULCAN_BURST_INTERVAL_MS = 450;
const BOSS_VULCAN_BULLET_COUNT = 8;
const BOSS_VULCAN_SPEED = 9;
const BOSS_MISSILE_INTERVAL_MS = 1700;
const BOSS_RADIUS = 60; // for collision — it's much bigger than a regular enemy

// Final boss (kaiju): independent per-weapon thresholds — it goes down as
// soon as ANY ONE of these is reached, not a shared HP pool like the mid-boss.
const LASTBOSS_VULCAN_HITS = 100;
const LASTBOSS_MISSILE_HITS = 5;
const LASTBOSS_LASER_HITS = 5;
const LASTBOSS_RADIUS = 90;
// Stands its ground and barely advances, just hops in place occasionally.
const LASTBOSS_JUMP_INTERVAL_MS = 2600;
const LASTBOSS_JUMP_DURATION_MS = 500;
const LASTBOSS_JUMP_HEIGHT = 36;
const LASTBOSS_BEAM_INTERVAL_MS = 1300;
const LASTBOSS_BEAM_SPEED = 7;
// 3 beam hits and the player is destroyed — independent of the usual
// sustained-vulcan-fire rule, since this is the kaiju's own unique attack.
const LASTBOSS_BEAM_HITS_TO_KILL = 3;

// Permanent upgrades granted each time the final boss is defeated, before
// looping back to stage 1.
const LOOP_MISSILE_BONUS = 4;
const LOOP_LASER_BONUS = 10;
const LOOP_VULCAN_RANGE_BONUS = 60;

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
  laserHits: number;
}
interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy?: number; // only the mid-boss's omnidirectional spray uses this; every
  // other vulcan bullet in the game travels perfectly straight.
}
interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homing: "player" | number; // "player", or an enemy id
  chaffRolled?: boolean; // player missiles only: has the target enemy's
  // 25%-chance defensive-chaff roll already happened for this missile?
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
  vx: number;
  vy: number;
  redirectAt: number;
  expiresAt: number;
  nextShotAt: number;
}
// A scattered chaff/flare speck — any enemy missile that touches one while
// it's still alive explodes against it.
interface ChaffParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  expiresAt: number;
}
// Appears after stage 5 (mid-boss) and stage 10 (final boss/kaiju) of each
// loop. Unlike the regular Enemy list, it's not part of the ます形-matching
// mechanic — it's a straight fight against a single big target.
interface Boss {
  kind: "mid" | "final";
  x: number;
  y: number;
  baseY: number; // "ground" level the final boss stands on between jumps
  hp: number; // mid-boss: shared HP pool
  vulcanHitsTaken: number; // final boss: independent per-weapon thresholds —
  missileHitsTaken: number; // it dies as soon as ANY ONE of these reaches its
  laserHitsTaken: number; // own limit (see BOSS_LASTBOSS_*_HITS).
  missilesLeft: number;
  nextVulcanBurstAt: number;
  nextMissileAt: number;
  nextBeamAt: number;
  nextJumpAt: number;
  jumpStartedAt: number;
}
interface BossBeam {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type Phase = "playing" | "stage-clear" | "boss-intro" | "boss" | "game-clear" | "game-over";

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
    laserHits: 0,
    vulcanHits: 0,
    lastVulcanHitAt: -Infinity,
  };
}

function spawnWingman(prevX: number | undefined, prevY: number | undefined, now: number): Wingman {
  return {
    x: prevX ?? WINGMAN_BOUNDS.minX + Math.random() * (WINGMAN_BOUNDS.maxX - WINGMAN_BOUNDS.minX),
    y: prevY ?? WINGMAN_BOUNDS.minY + Math.random() * (WINGMAN_BOUNDS.maxY - WINGMAN_BOUNDS.minY),
    vx: (Math.random() - 0.5) * 1.6,
    vy: (Math.random() - 0.5) * 1.6,
    redirectAt: now + 500 + Math.random() * 1000,
    expiresAt: now + WINGMAN_DURATION_MS,
    nextShotAt: now + 300,
  };
}

function spawnBoss(kind: "mid" | "final", now: number): Boss {
  const baseY = kind === "final" ? ENEMY_BOUNDS.maxY - 40 : H / 2;
  return {
    kind,
    x: kind === "final" ? W - 150 : W - 130,
    y: baseY,
    baseY,
    hp: BOSS_MAX_HP,
    vulcanHitsTaken: 0,
    missileHitsTaken: 0,
    laserHitsTaken: 0,
    missilesLeft: kind === "final" ? 0 : BOSS_MISSILE_AMMO,
    nextVulcanBurstAt: now + 800,
    nextMissileAt: now + 1500,
    nextBeamAt: now + 1200,
    nextJumpAt: now + LASTBOSS_JUMP_INTERVAL_MS,
    jumpStartedAt: -Infinity,
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

/** Applies one weapon hit to a boss and reports whether it's now defeated.
 * The mid-boss uses a shared HP pool chipped away by weapon-specific damage
 * amounts; the final boss (kaiju) instead uses independent per-weapon hit
 * counters — it dies as soon as ANY ONE of its thresholds is reached. */
function applyBossHit(boss: Boss, weapon: "vulcan" | "missile" | "laser"): boolean {
  if (boss.kind === "mid") {
    const dmg = weapon === "vulcan" ? BOSS_VULCAN_DAMAGE : weapon === "missile" ? BOSS_MISSILE_DAMAGE : BOSS_LASER_DAMAGE;
    boss.hp -= dmg;
    return boss.hp <= 0;
  }
  if (weapon === "vulcan") {
    boss.vulcanHitsTaken += 1;
    return boss.vulcanHitsTaken >= LASTBOSS_VULCAN_HITS;
  }
  if (weapon === "missile") {
    boss.missileHitsTaken += 1;
    return boss.missileHitsTaken >= LASTBOSS_MISSILE_HITS;
  }
  boss.laserHitsTaken += 1;
  return boss.laserHitsTaken >= LASTBOSS_LASER_HITS;
}

// Chaff/flare only fools a missile bearing in from behind, above, or below —
// a dead-ahead (front) shot sees through the decoy and must be shot down
// with the vulcan cannon instead. "Front" is a narrow cone around whichever
// way the target aircraft is facing.
const FRONT_CONE_COS = Math.cos((40 * Math.PI) / 180);
function isFrontalAttack(targetFacesRight: boolean, dx: number, dy: number): boolean {
  const dist = Math.hypot(dx, dy) || 1;
  const dir = targetFacesRight ? 1 : -1;
  return (dx * dir) / dist > FRONT_CONE_COS;
}

export default function AirCombatGame({ dataSource }: { dataSource: DataSourceSetting }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  const [hud, setHud] = useState({
    masuForm: "",
    formLabelJa: "",
    formLabelVn: "",
    streak: 0,
    stage: 1,
    phase: "playing" as Phase,
    missilesLeft: PLAYER_MISSILE_AMMO,
    vulcanAmmo: PLAYER_VULCAN_AMMO_BASE,
    laserAmmo: LASER_AMMO,
    loopCount: 1,
    bossHp: null as { current: number; max: number; label: string } | null,
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
    firingVulcan: boolean;
    phase: Phase;
    flash: { text: string; color: string; until: number } | null;
    playerHitUntil: number;
    playerMissilesLeft: number;
    playerMaxMissiles: number;
    playerVulcanAmmo: number;
    playerMaxVulcanAmmo: number;
    chaffParticles: ChaffParticle[];
    enemyChaffParticles: ChaffParticle[];
    wingman: Wingman | null;
    wingmanBullets: WingmanBullet[];
    wingmanNextAvailableAt: number;
    paused: boolean;
    laserBeams: { y: number; until: number }[];
    laserAmmo: number;
    maxLaserAmmo: number;
    lastLaser: number;
    boss: Boss | null;
    pendingBossKind: "mid" | "final" | null;
    bossBeams: BossBeam[];
    playerBeamHits: number;
    vulcanRangeBonus: number;
    loopCount: number;
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
      // Missiles and vulcan ammo resupply to full every 2 stages cleared
      // (i.e. entering an odd-numbered stage within the loop) — otherwise
      // whatever's left carries over. Laser only refills at the start of a
      // new loop (see the final-boss defeat handling).
      if (stage % 2 === 1) {
        g.playerMissilesLeft = g.playerMaxMissiles;
        g.playerVulcanAmmo = g.playerMaxVulcanAmmo;
      }
      setHud({
        masuForm: verb.masuForm,
        formLabelJa: formMeta.labelJa,
        formLabelVn: formMeta.labelVn,
        streak: 0,
        stage,
        phase: "playing",
        missilesLeft: g.playerMissilesLeft,
        vulcanAmmo: g.playerVulcanAmmo,
        laserAmmo: g.laserAmmo,
        loopCount: g.loopCount,
        bossHp: null,
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
      firingVulcan: false,
      phase: "playing",
      flash: null,
      playerHitUntil: 0,
      playerMissilesLeft: PLAYER_MISSILE_AMMO,
      playerMaxMissiles: PLAYER_MISSILE_AMMO,
      playerVulcanAmmo: PLAYER_VULCAN_AMMO_BASE,
      playerMaxVulcanAmmo: PLAYER_VULCAN_AMMO_BASE,
      chaffParticles: [],
      enemyChaffParticles: [],
      wingman: null,
      wingmanBullets: [],
      wingmanNextAvailableAt: 0,
      paused: false,
      laserBeams: [],
      laserAmmo: LASER_AMMO,
      maxLaserAmmo: LASER_AMMO,
      lastLaser: 0,
      boss: null,
      pendingBossKind: null,
      bossBeams: [],
      playerBeamHits: 0,
      vulcanRangeBonus: 0,
      loopCount: 1,
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
        // A fresh wingman is assigned every time the correct enemy goes
        // down, regardless of cooldown — replaces any wingman already out.
        g.wingman = spawnWingman(g.wingman?.x, g.wingman?.y, performance.now());
        if (g.streak >= STREAK_GOAL) {
          if (g.stage === MID_BOSS_AT_STAGE || g.stage === FINAL_BOSS_AT_STAGE) {
            g.pendingBossKind = g.stage === FINAL_BOSS_AT_STAGE ? "final" : "mid";
            g.phase = "boss-intro";
            setHud((h) => ({ ...h, streak: g.streak, phase: "boss-intro" }));
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

      if ((g.phase === "playing" || g.phase === "boss") && !g.paused) {
        // Player movement (arrow keys) — phím A doubles speed while held.
        const p = g.player;
        const speed = (g.keys["a"] || g.keys["A"]) ? PLAYER_SPEED * 2 : PLAYER_SPEED;
        if (g.keys["ArrowUp"]) p.y -= speed;
        if (g.keys["ArrowDown"]) p.y += speed;
        if (g.keys["ArrowLeft"]) p.x -= speed;
        if (g.keys["ArrowRight"]) p.x += speed;
        p.x = Math.min(PLAYER_BOUNDS.maxX, Math.max(PLAYER_BOUNDS.minX, p.x));
        p.y = Math.min(PLAYER_BOUNDS.maxY, Math.max(PLAYER_BOUNDS.minY, p.y));
        const vulcanRange = VULCAN_RANGE + g.vulcanRangeBonus;

        // Player vulcan auto-fire while held
        if (g.firingVulcan && now - g.lastVulcan > VULCAN_COOLDOWN_MS && g.playerVulcanAmmo > 0) {
          g.lastVulcan = now;
          g.playerVulcanAmmo -= 1;
          g.bullets.push({ x: p.x + 26, y: p.y, vx: VULCAN_SPEED });
          playVulcanShot(audioCtxRef);
          setHud((h) => ({ ...h, vulcanAmmo: g.playerVulcanAmmo }));
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

        // Boss AI: mid-boss sprays vulcan in all directions and fires homing
        // missiles (reusing g.enemyBullets/g.enemyMissiles so all the existing
        // collision/chaff-interception code applies for free); the final boss
        // (kaiju) mostly stands its ground, hops occasionally, and periodically
        // fires an aimed beam at the player instead of missiles.
        if (g.boss) {
          const boss = g.boss;
          if (boss.kind === "mid") {
            if (now > boss.nextVulcanBurstAt) {
              boss.nextVulcanBurstAt = now + BOSS_VULCAN_BURST_INTERVAL_MS;
              for (let i = 0; i < BOSS_VULCAN_BULLET_COUNT; i++) {
                const angle = (Math.PI * 2 * i) / BOSS_VULCAN_BULLET_COUNT;
                g.enemyBullets.push({
                  x: boss.x,
                  y: boss.y,
                  vx: Math.cos(angle) * BOSS_VULCAN_SPEED,
                  vy: Math.sin(angle) * BOSS_VULCAN_SPEED,
                });
              }
              playVulcanShot(audioCtxRef);
            }
            if (now > boss.nextMissileAt && boss.missilesLeft > 0) {
              boss.nextMissileAt = now + BOSS_MISSILE_INTERVAL_MS;
              boss.missilesLeft -= 1;
              g.enemyMissiles.push({ x: boss.x - 40, y: boss.y, vx: -MISSILE_SPEED, vy: 0, homing: "player" });
              playMissileLaunch(audioCtxRef);
            }
          } else {
            // Final boss: jump in place periodically instead of advancing.
            if (now > boss.nextJumpAt) {
              boss.nextJumpAt = now + LASTBOSS_JUMP_INTERVAL_MS;
              boss.jumpStartedAt = now;
            }
            const jumpT = (now - boss.jumpStartedAt) / LASTBOSS_JUMP_DURATION_MS;
            boss.y = jumpT >= 0 && jumpT <= 1 ? boss.baseY - Math.sin(jumpT * Math.PI) * LASTBOSS_JUMP_HEIGHT : boss.baseY;
            if (now > boss.nextBeamAt) {
              boss.nextBeamAt = now + LASTBOSS_BEAM_INTERVAL_MS;
              const dx = p.x - boss.x;
              const dy = p.y - boss.y;
              const dist = Math.hypot(dx, dy) || 1;
              g.bossBeams.push({ x: boss.x, y: boss.y, vx: (dx / dist) * LASTBOSS_BEAM_SPEED, vy: (dy / dist) * LASTBOSS_BEAM_SPEED });
              playMissileLaunch(audioCtxRef);
            }
          }
        }
        for (const beam of g.bossBeams) {
          beam.x += beam.vx;
          beam.y += beam.vy;
        }
        g.bossBeams = g.bossBeams.filter((b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
        if (g.boss && now > g.playerHitUntil) {
          for (let i = g.bossBeams.length - 1; i >= 0; i--) {
            const b = g.bossBeams[i];
            if (Math.hypot(b.x - p.x, b.y - p.y) < HIT_RADIUS) {
              g.bossBeams.splice(i, 1);
              g.playerHitUntil = now + 120;
              g.playerBeamHits += 1;
              playExplosion(audioCtxRef);
              if (g.playerBeamHits >= LASTBOSS_BEAM_HITS_TO_KILL) {
                g.phase = "game-over";
                setHud((h) => ({ ...h, phase: "game-over" }));
              }
              break;
            }
          }
        }

        // Player bullets
        for (const b of g.bullets) b.x += b.vx;
        g.bullets = g.bullets.filter((b) => b.x - (p.x + 26) < vulcanRange && b.x < W);

        // Enemy bullets (the boss's omnidirectional spray uses vy too)
        for (const b of g.enemyBullets) {
          b.x += b.vx;
          if (b.vy) b.y += b.vy;
        }
        g.enemyBullets = g.enemyBullets.filter((b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

        // Wingman (S key, or auto-assigned on every correct kill): wanders
        // on its own (not locked to the player's position) and fires
        // indiscriminately at the nearest enemy within its own vulcan range.
        if (g.wingman) {
          if (now > g.wingman.expiresAt) {
            g.wingman = null;
            g.wingmanNextAvailableAt = now + WINGMAN_COOLDOWN_MS;
          } else {
            const wm = g.wingman;
            if (now > wm.redirectAt) {
              wm.vx = (Math.random() - 0.5) * 1.8;
              wm.vy = (Math.random() - 0.5) * 1.8;
              wm.redirectAt = now + 700 + Math.random() * 1300;
            }
            wm.x += wm.vx;
            wm.y += wm.vy;
            if (wm.x < WINGMAN_BOUNDS.minX || wm.x > WINGMAN_BOUNDS.maxX) wm.vx *= -1;
            if (wm.y < WINGMAN_BOUNDS.minY || wm.y > WINGMAN_BOUNDS.maxY) wm.vy *= -1;
            wm.x = Math.min(WINGMAN_BOUNDS.maxX, Math.max(WINGMAN_BOUNDS.minX, wm.x));
            wm.y = Math.min(WINGMAN_BOUNDS.maxY, Math.max(WINGMAN_BOUNDS.minY, wm.y));

            if (now > wm.nextShotAt && g.enemies.length > 0) {
              let nearest: Enemy | null = null;
              let bestDist = Infinity;
              for (const e of g.enemies) {
                const d = Math.hypot(e.x - wm.x, e.y - wm.y);
                if (d < bestDist) {
                  bestDist = d;
                  nearest = e;
                }
              }
              if (nearest && bestDist <= VULCAN_RANGE) {
                wm.nextShotAt = now + WINGMAN_FIRE_INTERVAL_MS;
                const dx = nearest.x - wm.x;
                const dy = nearest.y - wm.y;
                const dist = Math.hypot(dx, dy) || 1;
                g.wingmanBullets.push({
                  x: wm.x,
                  y: wm.y,
                  vx: (dx / dist) * VULCAN_SPEED,
                  vy: (dy / dist) * VULCAN_SPEED,
                });
                playVulcanShot(audioCtxRef);
              }
            }
          }
        }
        for (const b of g.wingmanBullets) {
          b.x += b.vx;
          b.y += b.vy;
        }
        g.wingmanBullets = g.wingmanBullets.filter((b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

        // Player missiles: home toward their locked enemy, or the boss if
        // one is active (see fireMissile() — regular enemies are always
        // cleared before a boss fight, so this is unambiguous).
        for (const m of g.missiles) {
          const target = g.enemies.find((e) => e.id === m.homing);
          if (target) {
            const dx = target.x - m.x;
            const dy = target.y - m.y;
            const dist = Math.hypot(dx, dy) || 1;
            m.vx = (dx / dist) * MISSILE_SPEED;
            m.vy = (dy / dist) * MISSILE_SPEED;
          } else if (g.boss) {
            const dx = g.boss.x - m.x;
            const dy = g.boss.y - m.y;
            const dist = Math.hypot(dx, dy) || 1;
            m.vx = (dx / dist) * MISSILE_SPEED;
            m.vy = (dy / dist) * MISSILE_SPEED;
          }
          m.x += m.vx;
          m.y += m.vy;
        }
        g.missiles = g.missiles.filter((m) => m.x < W + 20 && m.x > -20 && m.y > -20 && m.y < H + 20);

        // Enemy missiles: home toward the player.
        for (const m of g.enemyMissiles) {
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

        // Chaff/flare particles (phím C): scattered around the player for a
        // short time; any enemy missile that touches one explodes.
        for (const c of g.chaffParticles) {
          c.x += c.vx;
          c.y += c.vy;
        }
        g.chaffParticles = g.chaffParticles.filter((c) => now < c.expiresAt);
        for (let i = g.enemyMissiles.length - 1; i >= 0; i--) {
          const m = g.enemyMissiles[i];
          // Dead-ahead missiles see through the chaff — only vulcan stops those.
          if (isFrontalAttack(true, m.x - p.x, m.y - p.y)) continue;
          const hitParticle = g.chaffParticles.some((c) => Math.hypot(m.x - c.x, m.y - c.y) < HIT_RADIUS);
          if (hitParticle) {
            g.enemyMissiles.splice(i, 1);
            playExplosion(audioCtxRef);
          }
        }

        // The moment a player missile locks onto an enemy, that enemy gets a
        // one-time 25% chance to deploy defensive chaff against it (rolled
        // once per missile — see Missile.chaffRolled).
        for (const m of g.missiles) {
          if (m.chaffRolled || typeof m.homing !== "number" || m.homing < 0) continue;
          m.chaffRolled = true;
          const target = g.enemies.find((e) => e.id === m.homing);
          if (!target || Math.random() >= ENEMY_CHAFF_CHANCE) continue;
          for (let i = 0; i < CHAFF_PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / CHAFF_PARTICLE_COUNT + Math.random() * 0.4;
            const dist = 10 + Math.random() * CHAFF_SCATTER_RADIUS;
            g.enemyChaffParticles.push({
              x: target.x + Math.cos(angle) * dist,
              y: target.y + Math.sin(angle) * dist,
              vx: Math.cos(angle) * 0.4,
              vy: Math.sin(angle) * 0.4,
              expiresAt: now + CHAFF_PARTICLE_LIFETIME_MS,
            });
          }
        }
        for (const c of g.enemyChaffParticles) {
          c.x += c.vx;
          c.y += c.vy;
        }
        g.enemyChaffParticles = g.enemyChaffParticles.filter((c) => now < c.expiresAt);
        for (let i = g.missiles.length - 1; i >= 0; i--) {
          const m = g.missiles[i];
          const target = g.enemies.find((e) => e.id === m.homing);
          // Dead-ahead missiles see through the chaff — only vulcan stops those.
          if (target && isFrontalAttack(false, m.x - target.x, m.y - target.y)) continue;
          const hitParticle = g.enemyChaffParticles.some((c) => Math.hypot(m.x - c.x, m.y - c.y) < HIT_RADIUS);
          if (hitParticle) {
            g.missiles.splice(i, 1);
            playExplosion(audioCtxRef);
          }
        }

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

        // Player weapons vs boss (bullets/missiles/wingman bullets — the
        // laser is instant-hit and resolved directly inside fireLaser()).
        if (g.boss) {
          const boss = g.boss;
          const radius = boss.kind === "final" ? LASTBOSS_RADIUS : BOSS_RADIUS;
          for (let i = g.bullets.length - 1; i >= 0 && g.boss; i--) {
            const b = g.bullets[i];
            if (Math.hypot(b.x - boss.x, b.y - boss.y) < radius) {
              g.bullets.splice(i, 1);
              if (applyBossHit(boss, "vulcan")) {
                playExplosion(audioCtxRef);
                defeatBoss(g, boss);
              }
            }
          }
          for (let i = g.missiles.length - 1; i >= 0 && g.boss; i--) {
            const m = g.missiles[i];
            if (Math.hypot(m.x - boss.x, m.y - boss.y) < radius) {
              g.missiles.splice(i, 1);
              if (applyBossHit(boss, "missile")) {
                playExplosion(audioCtxRef);
                defeatBoss(g, boss);
              }
            }
          }
          for (let i = g.wingmanBullets.length - 1; i >= 0 && g.boss; i--) {
            const b = g.wingmanBullets[i];
            if (Math.hypot(b.x - boss.x, b.y - boss.y) < radius) {
              g.wingmanBullets.splice(i, 1);
              if (applyBossHit(boss, "vulcan")) {
                playExplosion(audioCtxRef);
                defeatBoss(g, boss);
              }
            }
          }
        }

        // Collisions: enemy missiles vs player (instant kill)
        if (now > g.playerHitUntil && (g.phase === "playing" || g.phase === "boss")) {
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
        if (g.phase === "playing" || g.phase === "boss") {
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
      if (e.key === "d" || e.key === "D") summonWingman();
      if (e.key === "s" || e.key === "S") fireLaser();
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
    if (!g || (g.phase !== "playing" && g.phase !== "boss") || g.paused) return;
    const now = performance.now();
    if (now - g.lastMissile < MISSILE_COOLDOWN_MS) return;
    if (g.playerMissilesLeft <= 0) return;

    let homing: number | null = null;
    if (g.boss) {
      // -1 never matches a real enemy id, so the homing update loop falls
      // through to tracking the boss instead (see the main loop).
      const dx = g.boss.x - g.player.x;
      if (dx > 0 && dx <= MISSILE_RANGE && Math.abs(g.boss.y - g.player.y) <= ALIGN_TOLERANCE * 2) homing = -1;
    } else {
      const target = findMissileLock(g.enemies, g.player);
      if (target) homing = target.id;
    }
    if (homing === null) return;

    g.lastMissile = now;
    g.playerMissilesLeft -= 1;
    setHud((h) => ({ ...h, missilesLeft: g.playerMissilesLeft }));
    g.missiles.push({ x: g.player.x + 26, y: g.player.y, vx: MISSILE_SPEED, vy: 0, homing });
    playMissileLaunch(audioCtxRef);
  }

  /** Laser beam (phím S): an instant hitscan shot across the screen at the
   * player's current altitude — up to LASER_HITS_TO_KILL hits destroys a
   * regular enemy, it also chips away at a boss's own laser threshold, and
   * it detonates any enemy missile it passes through in one hit. */
  function fireLaser() {
    const g = gameRef.current;
    if (!g || (g.phase !== "playing" && g.phase !== "boss") || g.paused) return;
    const now = performance.now();
    if (now - g.lastLaser < LASER_COOLDOWN_MS) return;
    if (g.laserAmmo <= 0) return;

    g.lastLaser = now;
    g.laserAmmo -= 1;
    g.laserBeams.push({ y: g.player.y, until: now + LASER_BEAM_FADE_MS });
    playVulcanShot(audioCtxRef);
    setHud((h) => ({ ...h, laserAmmo: g.laserAmmo }));

    const aligned = (y: number) => Math.abs(y - g.player.y) <= ALIGN_TOLERANCE;
    for (const e of [...g.enemies]) {
      if (e.x > g.player.x && aligned(e.y)) {
        e.laserHits += 1;
        if (e.laserHits >= LASER_HITS_TO_KILL) handleHit(e);
      }
    }
    for (let i = g.enemyMissiles.length - 1; i >= 0; i--) {
      const m = g.enemyMissiles[i];
      if (m.x > g.player.x && aligned(m.y)) {
        g.enemyMissiles.splice(i, 1);
        playExplosion(audioCtxRef);
      }
    }
    if (g.boss && g.boss.x > g.player.x && aligned(g.boss.y)) {
      const boss = g.boss;
      if (applyBossHit(boss, "laser")) {
        playExplosion(audioCtxRef);
        defeatBoss(g, boss);
      }
    }
  }

  /** Chaff/flare: always fires immediately on button press (no cooldown) —
   * scatters a burst of short-lived particles around the player; any enemy
   * missile that touches one while it's still burning explodes against it
   * (see the collision check in the main loop). */
  function deployChaff() {
    const g = gameRef.current;
    if (!g || (g.phase !== "playing" && g.phase !== "boss") || g.paused) return;
    const now = performance.now();
    for (let i = 0; i < CHAFF_PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / CHAFF_PARTICLE_COUNT + Math.random() * 0.4;
      const dist = 10 + Math.random() * CHAFF_SCATTER_RADIUS;
      g.chaffParticles.push({
        x: g.player.x + Math.cos(angle) * dist,
        y: g.player.y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 0.4,
        vy: Math.sin(angle) * 0.4,
        expiresAt: now + CHAFF_PARTICLE_LIFETIME_MS,
      });
    }
  }

  /** Wingman: a support jet that shows up for a while and fires at whatever
   * enemy is nearest, indiscriminately (correct or not — same handleHit path
   * as the player's own kills, so it can help or accidentally cost a streak). */
  function summonWingman() {
    const g = gameRef.current;
    if (!g || (g.phase !== "playing" && g.phase !== "boss") || g.paused) return;
    const now = performance.now();
    if (g.wingman || now < g.wingmanNextAvailableAt) return;
    g.wingman = spawnWingman(undefined, undefined, now);
  }

  function togglePause() {
    const g = gameRef.current;
    if (!g || (g.phase !== "playing" && g.phase !== "boss")) return;
    g.paused = !g.paused;
  }

  /** Boss defeated: mid-boss clears the stage as usual; the final boss
   * (kaiju) instead grants permanent weapon upgrades and loops back to
   * stage 1 (see LOOP_* constants). */
  function defeatBoss(g: NonNullable<typeof gameRef.current>, boss: Boss) {
    g.boss = null;
    g.pendingBossKind = null;
    if (boss.kind === "mid") {
      g.phase = "stage-clear";
      setHud((h) => ({ ...h, phase: "stage-clear" }));
      return;
    }
    g.playerMaxMissiles += LOOP_MISSILE_BONUS;
    g.playerMissilesLeft = g.playerMaxMissiles;
    g.maxLaserAmmo += LOOP_LASER_BONUS;
    g.laserAmmo = g.maxLaserAmmo;
    g.vulcanRangeBonus += LOOP_VULCAN_RANGE_BONUS;
    g.playerMaxVulcanAmmo *= 2;
    g.playerVulcanAmmo = g.playerMaxVulcanAmmo;
    g.loopCount += 1;
    g.phase = "game-clear";
    setHud((h) => ({
      ...h,
      phase: "game-clear",
      loopCount: g.loopCount,
      missilesLeft: g.playerMissilesLeft,
      vulcanAmmo: g.playerVulcanAmmo,
      laserAmmo: g.laserAmmo,
    }));
  }

  /** Starts the boss fight queued up by handleHit (see boss-intro overlay). */
  function startBoss() {
    const g = gameRef.current;
    if (!g || g.phase !== "boss-intro" || !g.pendingBossKind) return;
    g.enemies = [];
    g.bullets = [];
    g.missiles = [];
    g.enemyBullets = [];
    g.enemyMissiles = [];
    g.boss = spawnBoss(g.pendingBossKind, performance.now());
    g.phase = "boss";
    setHud((h) => ({ ...h, phase: "boss" }));
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

    // Vulcan ammo count, small, at the player's upper-right.
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#4C3A22";
    ctx.fillText(`${g.playerVulcanAmmo}`, p.x + 16, p.y - 18);

    // Laser ammo bar, small, just below the player.
    const laserPct = Math.max(0, Math.min(1, g.laserAmmo / g.maxLaserAmmo));
    ctx.strokeStyle = "rgba(76,58,34,0.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, p.x - 16, p.y + 20, 32, 5, 2);
    ctx.stroke();
    ctx.fillStyle = "#F05AC8";
    ctx.fillRect(p.x - 15, p.y + 21, 30 * laserPct, 3);

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

    // Chaff/flare particles — bright, fading specks (enemy-deployed chaff in
    // a warmer tint so it reads as distinct from the player's own)
    for (const c of g.chaffParticles) {
      const lifeLeft = (c.expiresAt - now) / CHAFF_PARTICLE_LIFETIME_MS;
      ctx.fillStyle = `rgba(240,240,235,${Math.max(0, Math.min(1, lifeLeft))})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of g.enemyChaffParticles) {
      const lifeLeft = (c.expiresAt - now) / CHAFF_PARTICLE_LIFETIME_MS;
      ctx.fillStyle = `rgba(240,200,180,${Math.max(0, Math.min(1, lifeLeft))})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Range guides (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x + VULCAN_RANGE + g.vulcanRangeBonus, 0);
    ctx.lineTo(p.x + VULCAN_RANGE + g.vulcanRangeBonus, H);
    ctx.stroke();
    ctx.setLineDash([]);

    const lockTarget = g.phase === "playing" || g.phase === "boss" ? findMissileLock(g.enemies, p) : null;

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

    // Boss (mid-boss, or the Godzilla-like kaiju final boss) — a single big,
    // distinct target instead of the usual 4-decoy verb-matching lineup.
    if (g.boss) {
      const boss = g.boss;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      if (boss.kind === "mid") {
        ctx.fillStyle = "#6B3A5A";
        ctx.strokeStyle = "#3A1E30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-60, 0);
        ctx.lineTo(10, -30);
        ctx.lineTo(50, -40);
        ctx.lineTo(30, -10);
        ctx.lineTo(60, -6);
        ctx.lineTo(60, 6);
        ctx.lineTo(30, 10);
        ctx.lineTo(50, 40);
        ctx.lineTo(10, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = "#3E5B3A";
        ctx.strokeStyle = "#20301E";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-70, 40);
        ctx.lineTo(-70, -10);
        ctx.lineTo(-40, -50);
        ctx.lineTo(-25, -20);
        ctx.lineTo(-10, -55);
        ctx.lineTo(5, -20);
        ctx.lineTo(20, -50);
        ctx.lineTo(35, -15);
        ctx.lineTo(70, -20);
        ctx.lineTo(80, 10);
        ctx.lineTo(60, 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#C1443A";
        ctx.beginPath();
        ctx.ellipse(65, -18, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.font = "600 14px 'Klee One', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      if (boss.kind === "mid") {
        const pct = Math.max(0, boss.hp / BOSS_MAX_HP);
        ctx.fillStyle = "#4C3A22";
        ctx.fillText("中ボス HP", boss.x, boss.y - 62);
        ctx.strokeStyle = "#8C6D3F";
        roundRect(ctx, boss.x - 50, boss.y - 58, 100, 10, 4);
        ctx.stroke();
        ctx.fillStyle = "#C1443A";
        ctx.fillRect(boss.x - 48, boss.y - 56, 96 * pct, 6);
      } else {
        ctx.fillStyle = "#4C3A22";
        ctx.fillText(
          `怪獣　バルカン ${boss.vulcanHitsTaken}/${LASTBOSS_VULCAN_HITS}　ミサイル ${boss.missileHitsTaken}/${LASTBOSS_MISSILE_HITS}　ビーム ${boss.laserHitsTaken}/${LASTBOSS_LASER_HITS}`,
          boss.x,
          boss.y - 68
        );
      }
    }

    // Boss beams (the kaiju's own mouth attack) — thick red bolts.
    ctx.fillStyle = "#E23B3B";
    for (const b of g.bossBeams) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillRect(-14, -4, 28, 8);
      ctx.restore();
    }

    // Laser beams (phím S) — pink, spans from the player to the screen edge,
    // fades out quickly.
    for (const beam of g.laserBeams) {
      if (now >= beam.until) continue;
      const alpha = Math.max(0, (beam.until - now) / LASER_BEAM_FADE_MS);
      ctx.strokeStyle = `rgba(240,90,200,${alpha})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x, beam.y);
      ctx.lineTo(W, beam.y);
      ctx.stroke();
    }
    g.laserBeams = g.laserBeams.filter((b) => now < b.until);

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
    if ((g.phase === "playing" || g.phase === "boss") && g.paused) {
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
      ctx.fillText(`僚機 (D): còn ${Math.ceil((g.wingman.expiresAt - now) / 1000)}s`, 12, H - 12);
    } else if (now < g.wingmanNextAvailableAt) {
      ctx.fillStyle = "rgba(76,58,34,0.55)";
      ctx.fillText(`僚機 (D): hồi ${Math.ceil((g.wingmanNextAvailableAt - now) / 1000)}s`, 12, H - 12);
    } else {
      ctx.fillStyle = "#4C3A22";
      ctx.fillText("僚機 (D): sẵn sàng", 12, H - 12);
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
          Màn {hud.stage}/{STAGES_PER_LOOP}（Vòng {hud.loopCount}）
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
        <span className="flex flex-wrap items-center gap-3">
          <span>Vulcan: {hud.vulcanAmmo}</span>
          <span>Tên lửa: {hud.missilesLeft}</span>
          <span>Laser: {hud.laserAmmo}</span>
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

        {hud.phase !== "playing" && hud.phase !== "boss" && (
          <div className="absolute inset-0 flex items-center justify-center bg-sand-50/90">
            <div className="space-y-3 rounded-2xl border border-sand-300 bg-sand-50 p-6 text-center shadow-card">
              <p className="text-lg font-semibold text-sand-700">
                {hud.phase === "stage-clear" && `Qua màn ${hud.stage}!`}
                {hud.phase === "boss-intro" &&
                  (gameRef.current?.pendingBossKind === "final"
                    ? "Quái vật cuối cùng xuất hiện! 🦖"
                    : "Trung boss xuất hiện!")}
                {hud.phase === "game-clear" && "Đánh bại quái vật cuối cùng! Nhận nâng cấp vĩnh viễn! 🎉"}
                {hud.phase === "game-over" && "Máy bay của bạn đã bị bắn hạ…"}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (hud.phase === "stage-clear") initStage(hud.stage + 1);
                  else if (hud.phase === "boss-intro") startBoss();
                  else if (hud.phase === "game-clear") initStage(1);
                  else restart();
                }}
                className="btn-press rounded-full bg-sand-600 px-5 py-2 text-sm font-semibold text-sand-50 shadow hover:brightness-95"
              >
                {hud.phase === "stage-clear" && "Màn tiếp theo →"}
                {hud.phase === "boss-intro" && "Bắt đầu chiến đấu →"}
                {hud.phase === "game-clear" && "Vòng tiếp theo →"}
                {hud.phase === "game-over" && "Chơi lại"}
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
          Di chuyển: ←↑↓→（giữ A để tăng tốc）　Vulcan: giữ X　Tên lửa: Z　Laser: S　Chaff/flare: C　Gọi僚機 hỗ trợ: D　Tạm dừng: Space
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
          <TouchButton label="S" wide onDown={fireLaser} onUp={() => {}} />
          <TouchButton label="C" wide onDown={deployChaff} onUp={() => {}} />
          <TouchButton label="D" wide onDown={summonWingman} onUp={() => {}} />
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
