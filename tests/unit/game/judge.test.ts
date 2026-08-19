import { describe, expect, it } from 'vitest';
import type { KomaState } from '../../../src/types/koma';
import {
  isOutOfToko,
  judge,
  updateKomaStatus,
  type KomaObservation,
} from '../../../src/game/judge';
import {
  FALL_MARGIN,
  FLOOR_Y,
  RING_OUT_MARGIN,
  SPIN_STOP_THRESHOLD,
  TOKO_RADIUS,
} from '../../../src/game/komaSpecs';

function koma(overrides: Partial<KomaState> = {}): KomaState {
  return {
    specId: 'balance',
    spin: 100,
    stopped: false,
    ringOut: false,
    touchedToko: true,
    position: { x: 0, y: 0.1, z: 0 },
    ...overrides,
  };
}

function obsAt(x: number, y: number, z: number, touched = false): KomaObservation {
  return { position: { x, y, z }, touchedTokoNow: touched };
}

describe('isOutOfToko', () => {
  it('insideToko_isNotOut', () => {
    expect(isOutOfToko({ x: 0, y: 0.1, z: 0 })).toBe(false);
  });

  it('beyondRadiusPlusMargin_isOut', () => {
    expect(isOutOfToko({ x: TOKO_RADIUS + RING_OUT_MARGIN + 0.01, y: 0.1, z: 0 })).toBe(true);
  });

  it('exactlyAtBoundary_isNotOut', () => {
    expect(isOutOfToko({ x: TOKO_RADIUS + RING_OUT_MARGIN, y: 0.1, z: 0 })).toBe(false);
  });

  it('fallenBelowFloor_isOut', () => {
    expect(isOutOfToko({ x: 0, y: FLOOR_Y - FALL_MARGIN - 0.01, z: 0 })).toBe(true);
  });
});

describe('updateKomaStatus', () => {
  it('ringOut_isIrreversible', () => {
    let state = koma();
    // 場外に出る
    state = updateKomaStatus(state, 100, obsAt(TOKO_RADIUS + 1, 0.1, 0));
    expect(state.ringOut).toBe(true);
    // トコ内に戻っても場外のまま
    state = updateKomaStatus(state, 100, obsAt(0, 0.1, 0));
    expect(state.ringOut).toBe(true);
  });

  it('stopped_isIrreversibleAndSpinFixedToZero', () => {
    let state = koma();
    state = updateKomaStatus(state, SPIN_STOP_THRESHOLD - 1, obsAt(0, 0.1, 0));
    expect(state.stopped).toBe(true);
    expect(state.spin).toBe(0);
    // その後回転値が入っても停止のまま
    state = updateKomaStatus(state, 50, obsAt(0, 0.1, 0));
    expect(state.stopped).toBe(true);
    expect(state.spin).toBe(0);
  });

  it('touchedToko_accumulates', () => {
    let state = koma({ touchedToko: false });
    state = updateKomaStatus(state, 100, obsAt(0, 0.1, 0, true));
    expect(state.touchedToko).toBe(true);
    state = updateKomaStatus(state, 100, obsAt(0, 0.3, 0, false));
    expect(state.touchedToko).toBe(true);
  });
});

describe('judge', () => {
  it('bothAlive_returnsNull', () => {
    expect(judge(koma(), koma())).toBeNull();
  });

  it('cpuRingOut_playerWinsByRingOut', () => {
    const verdict = judge(koma(), koma({ ringOut: true }));
    expect(verdict).toEqual({ outcome: 'playerWin', reason: 'ringOut' });
  });

  it('playerStopped_cpuWinsBySpinStop', () => {
    const verdict = judge(koma({ stopped: true }), koma());
    expect(verdict).toEqual({ outcome: 'cpuWin', reason: 'spinStop' });
  });

  it('playerRingOutWithoutTouchingToko_cpuWinsByFoul', () => {
    const verdict = judge(koma({ ringOut: true, touchedToko: false }), koma());
    expect(verdict).toEqual({ outcome: 'cpuWin', reason: 'foul' });
  });

  it('bothDefeatedSameStep_differentReasons_isDrawWithNullReason', () => {
    const verdict = judge(koma({ ringOut: true }), koma({ stopped: true }));
    expect(verdict?.outcome).toBe('draw');
    expect(verdict?.reason).toBeNull();
  });

  it('bothStoppedSameStep_isDrawWithSpinStopReason', () => {
    const verdict = judge(koma({ stopped: true }), koma({ stopped: true }));
    expect(verdict).toEqual({ outcome: 'draw', reason: 'spinStop' });
  });

  it('bothRingOutSameStep_isDrawWithRingOutReason', () => {
    const verdict = judge(koma({ ringOut: true }), koma({ ringOut: true }));
    expect(verdict).toEqual({ outcome: 'draw', reason: 'ringOut' });
  });

  it('ringOutTakesPriorityOverSpinStop', () => {
    // 同時に場外かつ停止 → 理由は場外
    const verdict = judge(koma(), koma({ ringOut: true, stopped: true }));
    expect(verdict).toEqual({ outcome: 'playerWin', reason: 'ringOut' });
  });
});
