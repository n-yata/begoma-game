import { describe, expect, it } from 'vitest';
import { InvalidTransitionError, MatchStateMachine } from '../../../src/game/MatchStateMachine';
import type { Verdict } from '../../../src/types/match';

const verdict: Verdict = { outcome: 'playerWin', reason: 'ringOut' };

function machineAt(phase: 'title' | 'komaSelect' | 'aiming' | 'battle' | 'result') {
  const m = new MatchStateMachine();
  if (phase === 'title') return m;
  m.start();
  if (phase === 'komaSelect') return m;
  m.selectKoma('heavy');
  if (phase === 'aiming') return m;
  m.throwKoma();
  if (phase === 'battle') return m;
  m.settle(verdict);
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
    m.settle(verdict);
    expect(m.phase).toBe('result');
    expect(m.verdict).toEqual(verdict);
  });

  it('rematch_returnsToAimingKeepingKoma', () => {
    const m = machineAt('result');
    m.rematch();
    expect(m.phase).toBe('aiming');
    expect(m.selectedKoma).toBe('heavy');
    expect(m.verdict).toBeNull();
  });

  it('backToSelect_clearsKomaAndVerdict', () => {
    const m = machineAt('result');
    m.backToSelect();
    expect(m.phase).toBe('komaSelect');
    expect(m.selectedKoma).toBeNull();
    expect(m.verdict).toBeNull();
  });

  it('invalidTransitions_throwInvalidTransitionError', () => {
    expect(() => machineAt('title').selectKoma('heavy')).toThrow(InvalidTransitionError);
    expect(() => machineAt('title').throwKoma()).toThrow(InvalidTransitionError);
    expect(() => machineAt('komaSelect').start()).toThrow(InvalidTransitionError);
    expect(() => machineAt('aiming').settle(verdict)).toThrow(InvalidTransitionError);
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
    }
  });

  it('phaseListener_isNotifiedOnEveryTransition', () => {
    const m = new MatchStateMachine();
    const phases: string[] = [];
    m.onPhaseChange((p) => phases.push(p));
    m.start();
    m.selectKoma('balance');
    m.throwKoma();
    m.settle(verdict);
    expect(phases).toEqual(['komaSelect', 'aiming', 'battle', 'result']);
  });
});
