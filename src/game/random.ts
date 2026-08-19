/** シード注入可能な乱数生成器 */
export interface Rng {
  /** [0, 1) の一様乱数 */
  next(): number;
}

/**
 * mulberry32 による決定的 PRNG を生成する。
 * ゲームロジックでは Math.random() を使わず必ずこれを注入する
 * （テスト再現性と、将来の決定的シミュレーションのため）。
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** [min, max) の一様乱数 */
export function nextInRange(rng: Rng, min: number, max: number): number {
  return min + rng.next() * (max - min);
}
