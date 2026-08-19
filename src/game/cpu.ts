import type { ThrowDecision } from '../types/match';
import {
  CPU_ANGLE_JITTER,
  CPU_POWER_MAX,
  CPU_POWER_MIN,
  DRAG_MAX,
  DRAG_MIN,
  KOMA_TYPE_IDS,
} from './komaSpecs';
import { nextInRange, type Rng } from './random';

/** 投擲決定の供給元。将来ローカル対戦では人間入力の実装に差し替える */
export type ThrowProvider = (rng: Rng) => ThrowDecision;

/**
 * CPU の投擲決定。トコ中心方向（CPU 側から見て -y 方向へ引く）を基準に、
 * シード付き乱数で角度・パワーをゆらす。
 * 返す drag は throwCalc.computeThrow にそのまま渡せる「引っ張りベクトル」。
 */
export const decideCpuThrow: ThrowProvider = (rng) => {
  const komaId = KOMA_TYPE_IDS[Math.floor(rng.next() * KOMA_TYPE_IDS.length)] ?? 'balance';

  const angle = nextInRange(rng, -CPU_ANGLE_JITTER, CPU_ANGLE_JITTER);
  const power = nextInRange(rng, CPU_POWER_MIN, CPU_POWER_MAX);
  const len = DRAG_MIN + power * (DRAG_MAX - DRAG_MIN);

  // 基準: CPU はトコ中心へ向けて投げる。引っ張り方向は中心の逆 = +y 方向（CPU 視点）
  const baseAngle = Math.PI / 2 + angle;
  return {
    komaId,
    drag: { x: Math.cos(baseAngle) * len, y: Math.sin(baseAngle) * len },
  };
};
