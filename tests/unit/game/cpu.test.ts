import { describe, expect, it } from 'vitest';
import { decideCpuThrow } from '../../../src/game/cpu';
import {
  CPU_POWER_MAX,
  CPU_POWER_MIN,
  DRAG_MAX,
  DRAG_MIN,
  KOMA_TYPE_IDS,
} from '../../../src/game/komaSpecs';
import { createRng } from '../../../src/game/random';

describe('decideCpuThrow', () => {
  it('sameSeed_reproducesSameDecision', () => {
    const a = decideCpuThrow(createRng(123));
    const b = decideCpuThrow(createRng(123));
    expect(a).toEqual(b);
  });

  it('komaId_isAlwaysValid', () => {
    for (let seed = 0; seed < 100; seed++) {
      const decision = decideCpuThrow(createRng(seed));
      expect(KOMA_TYPE_IDS).toContain(decision.komaId);
    }
  });

  it('dragLength_staysWithinPowerRange', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { drag } = decideCpuThrow(createRng(seed));
      const len = Math.hypot(drag.x, drag.y);
      const minLen = DRAG_MIN + CPU_POWER_MIN * (DRAG_MAX - DRAG_MIN);
      const maxLen = DRAG_MIN + CPU_POWER_MAX * (DRAG_MAX - DRAG_MIN);
      expect(len).toBeGreaterThanOrEqual(minLen - 1e-9);
      expect(len).toBeLessThanOrEqual(maxLen + 1e-9);
    }
  });

  it('dragDirection_staysWithinAngleJitter', () => {
    // 基準は +y 方向（トコ中心の逆向きに引く）。±10° 以内
    for (let seed = 0; seed < 200; seed++) {
      const { drag } = decideCpuThrow(createRng(seed));
      const angleFromY = Math.abs(Math.atan2(drag.x, drag.y));
      expect(angleFromY).toBeLessThanOrEqual((10 * Math.PI) / 180 + 1e-9);
    }
  });
});
