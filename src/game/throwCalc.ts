import type { Vec2 } from '../types/geometry';
import type { KomaSpec } from '../types/koma';
import type { ThrowParams } from '../types/match';
import { DRAG_MAX, DRAG_MIN, V_MAX, V_MIN } from './komaSpecs';

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * ドラッグベクトルから正規化パワー（0〜1）を算出する。
 * 投擲ガイドの表示もこの関数を使い、実挙動との乖離を防ぐ。
 */
export function computePower(drag: Vec2): number {
  const len = Math.hypot(drag.x, drag.y);
  return clamp01((len - DRAG_MIN) / (DRAG_MAX - DRAG_MIN));
}

/**
 * 投擲変換: ドラッグベクトルからコマの初期状態を算出する。
 * drag は「引っ張った向き」で渡す（投擲方向はその逆）。
 * 長さ 0（タップのみ）は投擲不成立として null を返す。
 */
export function computeThrow(drag: Vec2, spec: KomaSpec): ThrowParams | null {
  const len = Math.hypot(drag.x, drag.y);
  if (len === 0) return null;

  const power = computePower(drag);
  const speed = V_MIN + power * (V_MAX - V_MIN);
  // 投擲方向 = 引っ張り方向の逆
  const dir = { x: -drag.x / len, y: -drag.y / len };

  return {
    power,
    velocity: { x: dir.x * speed, y: dir.y * speed },
    initialSpin: spec.initialSpin * (0.8 + 0.2 * power),
  };
}
