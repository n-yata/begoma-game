import type { KomaSpec } from '../types/koma';
import { IMPACT_DECAY_FACTOR, SPIN_STOP_THRESHOLD } from './komaSpecs';

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
