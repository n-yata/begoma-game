import type { KomaSpec } from '../types/koma';
import {
  IMPACT_DECAY_FACTOR,
  KNOCKBACK_CONTACT_DIST,
  KNOCKBACK_MIN_GAP,
  KNOCKBACK_SPEED,
  SPIN_STOP_THRESHOLD,
  WEAK_SPIN_RATIO,
} from './komaSpecs';

/**
 * 自然減衰: 1物理ステップ分の回転減衰を適用した回転速度を返す。
 * spin' = spin * (1 - decayRate * dt)。0 未満にはならない。
 */
export function decaySpin(spin: number, spec: KomaSpec, dt: number): number {
  return Math.max(0, spin * (1 - spec.decayRate * dt));
}

/**
 * 衝突減衰: 衝突強度と相手の攻撃補正に応じて回転を削る。
 * spin' = spin - impactMag * IMPACT_DECAY_FACTOR * attackerAttack。0 未満にはならない。
 */
export function applyImpactDecay(spin: number, impactMag: number, attackerAttack: number): number {
  return Math.max(0, spin - impactMag * IMPACT_DECAY_FACTOR * attackerAttack);
}

/** 停止判定: しきい値「未満」で停止（ちょうどは停止しない） */
export function isStopped(spin: number): boolean {
  return spin < SPIN_STOP_THRESHOLD;
}

/** 勢い負けノックバックの算出結果 */
export interface Knockback {
  /** 吹き飛ばされる側 */
  target: 'player' | 'cpu';
  /** 相手から離れる方向へ加える追加速度 [m/s] */
  deltaV: number;
}

/**
 * 勢い負けノックバック: 回転残量比が WEAK_SPIN_RATIO 未満に弱った側は、
 * 相手と接触していると弾き飛ばされる（実物のベーゴマで弱った側が弾き出される決着の再現）。
 * 衝突イベントではなく接触距離で判定する（接触したまま押し合う状況でも決着がつくように）。
 * spinRatio は 現在spin / 初期spin（0〜1）。
 */
export function computeKnockback(
  distance: number,
  playerSpinRatio: number,
  cpuSpinRatio: number,
): Knockback | null {
  if (distance > KNOCKBACK_CONTACT_DIST) return null;
  const low = Math.min(playerSpinRatio, cpuSpinRatio);
  const high = Math.max(playerSpinRatio, cpuSpinRatio);
  if (low >= WEAK_SPIN_RATIO) return null;
  if (high - low < KNOCKBACK_MIN_GAP) return null;
  return {
    target: playerSpinRatio < cpuSpinRatio ? 'player' : 'cpu',
    deltaV: KNOCKBACK_SPEED,
  };
}

/** 攻守判定で「どちらでもない」とみなす相対速度成分のしきい値 */
const ATTACKER_EPSILON = 1e-6;

/**
 * 衝突時の攻撃側を相対速度ベクトルの向きで判定する（機能設計書「回転減衰と停止判定」）。
 * relativeVelocity は player − cpu の水平相対速度、位置は両コマの水平座標。
 * 相手に向かって進んでいる側が攻撃側。判別できない場合は null（対称衝突）。
 */
export function resolveAttacker(
  relativeVelocity: { x: number; z: number },
  playerPos: { x: number; z: number },
  cpuPos: { x: number; z: number },
): 'player' | 'cpu' | null {
  const toCpu = { x: cpuPos.x - playerPos.x, z: cpuPos.z - playerPos.z };
  const dot = relativeVelocity.x * toCpu.x + relativeVelocity.z * toCpu.z;
  if (dot > ATTACKER_EPSILON) return 'player';
  if (dot < -ATTACKER_EPSILON) return 'cpu';
  return null;
}
