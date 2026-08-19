import { beforeAll, describe, expect, it } from 'vitest';
import { PhysicsWorld } from '../../../src/engine/PhysicsWorld';
import { RING_OUT_MARGIN, TOKO_RADIUS } from '../../../src/game/komaSpecs';
import { isDefeated, runBattle } from './harness';

beforeAll(async () => {
  // WASM 初期化を先に済ませる（2回目以降の create は軽い）
  await PhysicsWorld.create();
});

describe('headless battle (physics + game logic)', () => {
  it('normalThrow_alwaysSettles_andRingOutNeverReverts', async () => {
    // 複数シードで通しプレイが必ず決着することを確認する
    for (const seed of [1, 7, 42, 1234, 99999]) {
      const { verdict, ringOutEverReverted, finalStates } = await runBattle(seed, {
        x: 10,
        y: 180,
      });
      expect(ringOutEverReverted).toBe(false);
      // 決着と最終状態の整合: 勝敗に対応する側へ敗北条件フラグが立っている
      if (verdict.outcome === 'playerWin') {
        expect(isDefeated(finalStates.cpu)).toBe(true);
        expect(isDefeated(finalStates.player)).toBe(false);
      } else if (verdict.outcome === 'cpuWin') {
        expect(isDefeated(finalStates.player)).toBe(true);
        expect(isDefeated(finalStates.cpu)).toBe(false);
      } else {
        expect(isDefeated(finalStates.player)).toBe(true);
        expect(isDefeated(finalStates.cpu)).toBe(true);
      }
      if (verdict.outcome !== 'draw') {
        expect(['ringOut', 'spinStop', 'foul']).toContain(verdict.reason);
      }
      // 盤外で回り続けない: 決着時、場外になっていないコマは必ずトコ半径内にいる
      for (const side of ['player', 'cpu'] as const) {
        const s = finalStates[side];
        if (!s.ringOut) {
          expect(Math.hypot(s.position.x, s.position.z)).toBeLessThanOrEqual(
            TOKO_RADIUS + RING_OUT_MARGIN,
          );
        }
      }
    }
  }, 60000);

  it('cpuThrow_neverFouls_acrossManySeeds', async () => {
    // 機能設計書「CPU 投擲」: ゆらぎ最大でも投げ込み失敗（自滅）しないこと
    for (let seed = 0; seed < 30; seed++) {
      const { verdict } = await runBattle(seed, { x: 0, y: 180 });
      const cpuFouled = verdict.outcome === 'playerWin' && verdict.reason === 'foul';
      expect(cpuFouled).toBe(false);
    }
  }, 120000);

  it('backwardFullPowerThrow_playerFliesOut_cpuWinsByFoul', async () => {
    // トコの真後ろへ全力投げ → プレイヤーは接地せず場外 = foul で CPU の勝ち
    // （横方向の弱投げは椀の深さで再捕獲されるため、radial に脱出する条件で検証する）
    const { verdict } = await runBattle(3, { x: 0, y: -240 });
    expect(verdict.outcome).toBe('cpuWin');
    expect(verdict.reason).toBe('foul');
  }, 60000);

  it('sameSeedAndDrag_reproducesSameResult', async () => {
    const a = await runBattle(42, { x: 0, y: 200 });
    const b = await runBattle(42, { x: 0, y: 200 });
    expect(a.verdict).toEqual(b.verdict);
    expect(a.steps).toBe(b.steps);
  }, 60000);
});
