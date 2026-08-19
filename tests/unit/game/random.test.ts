import { describe, expect, it } from 'vitest';
import { createRng, nextInRange } from '../../../src/game/random';

describe('createRng', () => {
  it('sameSeed_producesIdenticalSequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('differentSeed_producesDifferentSequence', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('next_alwaysInZeroToOne', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('nextInRange', () => {
  it('valuesStayWithinRange', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = nextInRange(rng, -5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(5);
    }
  });
});
