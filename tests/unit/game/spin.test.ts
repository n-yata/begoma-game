import { describe, expect, it } from 'vitest';
import { KOMA_SPECS, SPIN_STOP_THRESHOLD } from '../../../src/game/komaSpecs';
import { applyImpactDecay, decaySpin, isStopped, resolveAttacker } from '../../../src/game/spin';

const spec = KOMA_SPECS.balance;

describe('decaySpin', () => {
  it('naturalDecay_reducesSpin', () => {
    const next = decaySpin(100, spec, 1 / 60);
    expect(next).toBeLessThan(100);
    expect(next).toBeCloseTo(100 * (1 - spec.decayRate / 60));
  });

  it('zeroDecayRate_keepsSpinUnchanged', () => {
    const noDecay = { ...spec, decayRate: 0 };
    expect(decaySpin(100, noDecay, 1 / 60)).toBe(100);
  });

  it('neverGoesNegative', () => {
    const extreme = { ...spec, decayRate: 120 };
    expect(decaySpin(10, extreme, 1)).toBe(0);
  });
});

describe('applyImpactDecay', () => {
  it('impactReducesSpinProportionally', () => {
    const before = 100;
    const after = applyImpactDecay(before, 1, spec.attack);
    expect(after).toBeLessThan(before);
  });

  it('strongerAttack_removesMoreSpin', () => {
    const weak = applyImpactDecay(100, 1, KOMA_SPECS.heavy.attack);
    const strong = applyImpactDecay(100, 1, KOMA_SPECS.speed.attack);
    expect(strong).toBeLessThan(weak);
  });

  it('zeroAttack_removesNothing', () => {
    expect(applyImpactDecay(100, 5, 0)).toBe(100);
  });

  it('neverGoesNegative', () => {
    expect(applyImpactDecay(1, 1000, spec.attack)).toBe(0);
  });
});

describe('resolveAttacker', () => {
  const playerPos = { x: 0, z: 1 };
  const cpuPos = { x: 0, z: -1 };

  it('playerMovingTowardCpu_playerIsAttacker', () => {
    // 相対速度（player − cpu）が CPU 方向（-z）を向いている
    expect(resolveAttacker({ x: 0, z: -2 }, playerPos, cpuPos)).toBe('player');
  });

  it('cpuMovingTowardPlayer_cpuIsAttacker', () => {
    expect(resolveAttacker({ x: 0, z: 2 }, playerPos, cpuPos)).toBe('cpu');
  });

  it('perpendicularRelativeVelocity_isNeutral', () => {
    expect(resolveAttacker({ x: 3, z: 0 }, playerPos, cpuPos)).toBeNull();
  });

  it('zeroRelativeVelocity_isNeutral', () => {
    expect(resolveAttacker({ x: 0, z: 0 }, playerPos, cpuPos)).toBeNull();
  });
});

describe('isStopped', () => {
  it('belowThreshold_isStopped', () => {
    expect(isStopped(SPIN_STOP_THRESHOLD - 0.001)).toBe(true);
  });

  it('exactlyAtThreshold_isNotStopped', () => {
    expect(isStopped(SPIN_STOP_THRESHOLD)).toBe(false);
  });

  it('aboveThreshold_isNotStopped', () => {
    expect(isStopped(SPIN_STOP_THRESHOLD + 1)).toBe(false);
  });
});
