import { describe, expect, it } from 'vitest';
import {
  InvalidTransitionError,
  MatchStateMachine,
  ROUNDS_TO_WIN,
} from '../../../src/game/MatchStateMachine';
import type { Verdict } from '../../../src/types/match';

const playerWin: Verdict = { outcome: 'playerWin', reason: 'ringOut' };
const cpuWin: Verdict = { outcome: 'cpuWin', reason: 'spinStop' };
const draw: Verdict = { outcome: 'draw', reason: null };

function machineAt(phase: 'title' | 'komaSelect' | 'aiming' | 'battle' | 'result') {
  const m = new MatchStateMachine();
  if (phase === 'title') return m;
  m.start();
  if (phase === 'komaSelect') return m;
  m.selectKoma('heavy');
  if (phase === 'aiming') return m;
  m.throwKoma();
  if (phase === 'battle') return m;
  m.settle(playerWin);
  return m;
}

/** aiming にいる状態機械で1ラウンドを消化し result まで進める */
function playRound(m: MatchStateMachine, verdict: Verdict): void {
  m.throwKoma();
  m.settle(verdict);
}

/** プレイヤーの2連勝でマッチ決着済みの result 状態を作る */
function machineAtDecidedResult(): MatchStateMachine {
  const m = machineAt('aiming');
  playRound(m, playerWin);
  m.nextRound();
  playRound(m, playerWin);
  return m;
}

describe('MatchStateMachine', () => {
  it('initialPhase_isTitle', () => {
    expect(new MatchStateMachine().phase).toBe('title');
  });

  it('fullFlow_followsTransitionDiagram', () => {
    const m = new MatchStateMachine();
    m.start();
    expect(m.phase).toBe('komaSelect');
    m.selectKoma('speed');
    expect(m.phase).toBe('aiming');
    expect(m.selectedKoma).toBe('speed');
    m.throwKoma();
    expect(m.phase).toBe('battle');
    m.settle(playerWin);
    expect(m.phase).toBe('result');
    expect(m.verdict).toEqual(playerWin);
  });

  it('invalidTransitions_throwInvalidTransitionError', () => {
    expect(() => machineAt('title').selectKoma('heavy')).toThrow(InvalidTransitionError);
    expect(() => machineAt('title').throwKoma()).toThrow(InvalidTransitionError);
    expect(() => machineAt('komaSelect').start()).toThrow(InvalidTransitionError);
    expect(() => machineAt('aiming').settle(playerWin)).toThrow(InvalidTransitionError);
    expect(() => machineAt('battle').selectKoma('speed')).toThrow(InvalidTransitionError);
    expect(() => machineAt('result').throwKoma()).toThrow(InvalidTransitionError);
    expect(() => machineAt('battle').rematch()).toThrow(InvalidTransitionError);
  });

  it('reset_returnsToTitleFromAnyPhase_clearingState', () => {
    for (const phase of ['title', 'komaSelect', 'aiming', 'battle', 'result'] as const) {
      const m = machineAt(phase);
      m.reset();
      expect(m.phase).toBe('title');
      expect(m.selectedKoma).toBeNull();
      expect(m.verdict).toBeNull();
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.roundNumber).toBe(1);
      expect(m.matchOutcome).toBeNull();
    }
  });

  it('phaseListener_isNotifiedOnEveryTransition', () => {
    const m = new MatchStateMachine();
    const phases: string[] = [];
    m.onPhaseChange((p) => phases.push(p));
    m.start();
    m.selectKoma('balance');
    m.throwKoma();
    m.settle(playerWin);
    expect(phases).toEqual(['komaSelect', 'aiming', 'battle', 'result']);
  });

  describe('ラウンド制（2勝先取）', () => {
    it('initialRoundState_isRound1_zeroZero', () => {
      const m = machineAt('aiming');
      expect(m.roundNumber).toBe(1);
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.matchOutcome).toBeNull();
    });

    it('settle_playerWin_incrementsPlayerScoreOnly', () => {
      const m = machineAt('aiming');
      playRound(m, playerWin);
      expect(m.score).toEqual({ player: 1, cpu: 0 });
      expect(m.matchOutcome).toBeNull();
    });

    it('straightWins_decideMatchAtTwoZero', () => {
      const m = machineAtDecidedResult();
      expect(m.score).toEqual({ player: 2, cpu: 0 });
      expect(m.matchOutcome).toBe('playerWin');
    });

    it('fullThreeRounds_decideMatchAtTwoOne', () => {
      const m = machineAt('aiming');
      playRound(m, cpuWin);
      m.nextRound();
      expect(m.roundNumber).toBe(2);
      playRound(m, playerWin);
      m.nextRound();
      expect(m.roundNumber).toBe(3);
      playRound(m, cpuWin);
      expect(m.score).toEqual({ player: 1, cpu: 2 });
      expect(m.matchOutcome).toBe('cpuWin');
    });

    it('drawRound_keepsScoreAndRoundNumber_andAllowsNextRound', () => {
      const m = machineAt('aiming');
      playRound(m, draw);
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.matchOutcome).toBeNull();
      m.nextRound();
      expect(m.phase).toBe('aiming');
      expect(m.roundNumber).toBe(1);
    });

    it('nextRound_returnsToAiming_keepingKomaAndScore', () => {
      const m = machineAt('aiming');
      playRound(m, playerWin);
      m.nextRound();
      expect(m.phase).toBe('aiming');
      expect(m.selectedKoma).toBe('heavy');
      expect(m.score).toEqual({ player: 1, cpu: 0 });
      expect(m.roundNumber).toBe(2);
      expect(m.verdict).toBeNull();
    });

    it('nextRound_afterMatchDecided_throws', () => {
      expect(() => machineAtDecidedResult().nextRound()).toThrow(InvalidTransitionError);
    });

    it('nextRound_outsideResult_throws', () => {
      expect(() => machineAt('aiming').nextRound()).toThrow(InvalidTransitionError);
      expect(() => machineAt('battle').nextRound()).toThrow(InvalidTransitionError);
    });

    it('rematch_beforeMatchDecided_throws', () => {
      // machineAt('result') は 1-0（未決着）
      expect(() => machineAt('result').rematch()).toThrow(InvalidTransitionError);
    });

    it('backToSelect_beforeMatchDecided_throws', () => {
      expect(() => machineAt('result').backToSelect()).toThrow(InvalidTransitionError);
    });

    it('rematch_afterMatchDecided_resetsRoundStateKeepingKoma', () => {
      const m = machineAtDecidedResult();
      m.rematch();
      expect(m.phase).toBe('aiming');
      expect(m.selectedKoma).toBe('heavy');
      expect(m.verdict).toBeNull();
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.roundNumber).toBe(1);
      expect(m.matchOutcome).toBeNull();
    });

    it('backToSelect_afterMatchDecided_clearsAllState', () => {
      const m = machineAtDecidedResult();
      m.backToSelect();
      expect(m.phase).toBe('komaSelect');
      expect(m.selectedKoma).toBeNull();
      expect(m.verdict).toBeNull();
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.roundNumber).toBe(1);
      expect(m.matchOutcome).toBeNull();
    });

    it('roundsToWin_isTwo', () => {
      // 3本勝負（2勝先取）の前提が変わったらテストごと見直すこと
      expect(ROUNDS_TO_WIN).toBe(2);
    });

    it('abandonMatch_beforeMatchDecided_clearsAllStateAndReturnsToSelect', () => {
      // machineAt('result') は 1-0（未決着）
      const m = machineAt('result');
      m.abandonMatch();
      expect(m.phase).toBe('komaSelect');
      expect(m.selectedKoma).toBeNull();
      expect(m.verdict).toBeNull();
      expect(m.score).toEqual({ player: 0, cpu: 0 });
      expect(m.roundNumber).toBe(1);
      expect(m.matchOutcome).toBeNull();
    });

    it('abandonMatch_afterMatchDecided_throws', () => {
      // 決着後は backToSelect が同じ役割を持つため、中断は許可しない
      expect(() => machineAtDecidedResult().abandonMatch()).toThrow(InvalidTransitionError);
    });

    it('abandonMatch_outsideResult_throws', () => {
      expect(() => machineAt('title').abandonMatch()).toThrow(InvalidTransitionError);
      expect(() => machineAt('komaSelect').abandonMatch()).toThrow(InvalidTransitionError);
      expect(() => machineAt('aiming').abandonMatch()).toThrow(InvalidTransitionError);
      expect(() => machineAt('battle').abandonMatch()).toThrow(InvalidTransitionError);
    });
  });
});
