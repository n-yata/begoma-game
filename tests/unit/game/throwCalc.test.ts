import { describe, expect, it } from 'vitest';
import { KOMA_SPECS, DRAG_MAX, DRAG_MIN, V_MAX, V_MIN } from '../../../src/game/komaSpecs';
import { computeThrow } from '../../../src/game/throwCalc';

const spec = KOMA_SPECS.balance;

describe('computeThrow', () => {
  it('dragBelowMin_returnsWeakestThrow', () => {
    const result = computeThrow({ x: 0, y: DRAG_MIN - 1 }, spec);
    expect(result).not.toBeNull();
    expect(result?.power).toBe(0);
    expect(Math.hypot(result!.velocity.x, result!.velocity.y)).toBeCloseTo(V_MIN);
  });

  it('dragAboveMax_clampsToPowerOne', () => {
    const result = computeThrow({ x: 0, y: DRAG_MAX * 2 }, spec);
    expect(result?.power).toBe(1);
    expect(Math.hypot(result!.velocity.x, result!.velocity.y)).toBeCloseTo(V_MAX);
  });

  it('zeroDrag_returnsNull', () => {
    expect(computeThrow({ x: 0, y: 0 }, spec)).toBeNull();
  });

  it('midDrag_interpolatesPowerLinearly', () => {
    const mid = (DRAG_MIN + DRAG_MAX) / 2;
    const result = computeThrow({ x: 0, y: mid }, spec);
    expect(result?.power).toBeCloseTo(0.5);
    expect(Math.hypot(result!.velocity.x, result!.velocity.y)).toBeCloseTo((V_MIN + V_MAX) / 2);
  });

  it('velocityDirection_isOppositeOfDrag', () => {
    // 下に引いたら上に飛ぶ
    const result = computeThrow({ x: 0, y: 100 }, spec);
    expect(result!.velocity.y).toBeLessThan(0);
    expect(result!.velocity.x).toBeCloseTo(0);
  });

  it('initialSpin_scalesWithPower', () => {
    const weak = computeThrow({ x: 0, y: DRAG_MIN }, spec)!;
    const strong = computeThrow({ x: 0, y: DRAG_MAX }, spec)!;
    expect(weak.initialSpin).toBeCloseTo(spec.initialSpin * 0.8);
    expect(strong.initialSpin).toBeCloseTo(spec.initialSpin * 1.0);
  });
});
