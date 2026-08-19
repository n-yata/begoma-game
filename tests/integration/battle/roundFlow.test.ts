import { beforeAll, describe, expect, it } from 'vitest';
import { MatchStateMachine, ROUNDS_TO_WIN } from '../../../src/game/MatchStateMachine';
import { PhysicsWorld } from '../../../src/engine/PhysicsWorld';
import { runBattle } from './harness';

beforeAll(async () => {
  await PhysicsWorld.create();
});

/**
 * 状態機械を komaSelect 完了まで進め、実物理の決着でラウンドを消化しながら
 * マッチ決着（ROUNDS_TO_WIN 勝先取）まで通しで実行する
 */
async function runMatch(baseSeed: number): Promise<{
  sm: MatchStateMachine;
  roundsPlayed: number;
  drawRounds: number;
}> {
  const sm = new MatchStateMachine();
  sm.start();
  sm.selectKoma('balance');

  let roundsPlayed = 0;
  let drawRounds = 0;
  // 引き分けやり直しを含めても十分な上限。超えたらテスト失敗として検出する
  const MAX_ROUNDS = 10;
  while (roundsPlayed < MAX_ROUNDS) {
    expect(sm.phase).toBe('aiming');
    sm.throwKoma();
    const { verdict } = await runBattle(baseSeed + roundsPlayed, { x: 10, y: 180 });
    sm.settle(verdict);
    roundsPlayed += 1;
    if (verdict.outcome === 'draw') drawRounds += 1;
    expect(sm.phase).toBe('result');
    if (sm.matchOutcome !== null) return { sm, roundsPlayed, drawRounds };
    sm.nextRound();
  }
  throw new Error('match did not settle within the round limit');
}

describe('headless round flow (state machine + physics)', () => {
  it('fullMatch_reachesMatchOutcome_withConsistentScore', async () => {
    for (const baseSeed of [1, 100, 5000]) {
      const { sm, roundsPlayed, drawRounds } = await runMatch(baseSeed);
      const score = sm.score;
      const winnerScore = Math.max(score.player, score.cpu);
      const loserScore = Math.min(score.player, score.cpu);
      // 勝者はちょうど ROUNDS_TO_WIN 勝、敗者は届いていない
      expect(winnerScore).toBe(ROUNDS_TO_WIN);
      expect(loserScore).toBeLessThan(ROUNDS_TO_WIN);
      expect(sm.matchOutcome).toBe(score.player > score.cpu ? 'playerWin' : 'cpuWin');
      // 消化ラウンド数 = 勝ち星の合計 + 引き分けやり直し回数
      expect(roundsPlayed).toBe(score.player + score.cpu + drawRounds);
    }
  }, 120000);

  it('rematchAfterMatch_playsNewMatchFromCleanScore', async () => {
    const { sm } = await runMatch(42);
    sm.rematch();
    expect(sm.phase).toBe('aiming');
    expect(sm.score).toEqual({ player: 0, cpu: 0 });
    expect(sm.roundNumber).toBe(1);
    // 再戦1ラウンド目が通常どおり消化できる
    sm.throwKoma();
    const { verdict } = await runBattle(7, { x: 10, y: 180 });
    sm.settle(verdict);
    expect(sm.phase).toBe('result');
    const total = sm.score.player + sm.score.cpu;
    expect(total).toBe(verdict.outcome === 'draw' ? 0 : 1);
  }, 120000);
});
