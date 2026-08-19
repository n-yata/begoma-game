import type { KomaTypeId } from '../types/koma';
import type { MatchPhase, Verdict } from '../types/match';

/** 不正なフェーズ遷移 */
export class InvalidTransitionError extends Error {
  constructor(from: MatchPhase, event: string) {
    super(`フェーズ ${from} でイベント ${event} は受け付けられない`);
    this.name = 'InvalidTransitionError';
  }
}

export type PhaseListener = (phase: MatchPhase) => void;

/**
 * 対戦フェーズの状態機械。
 * 遷移図（functional-design.md「画面遷移図」）どおりの遷移のみ許可し、
 * 不正遷移は InvalidTransitionError を投げる。
 */
export class MatchStateMachine {
  private _phase: MatchPhase = 'title';
  private _selectedKoma: KomaTypeId | null = null;
  private _verdict: Verdict | null = null;
  private listeners: PhaseListener[] = [];

  get phase(): MatchPhase {
    return this._phase;
  }

  /** 選択中のコマ。komaSelect 完了後に非 null */
  get selectedKoma(): KomaTypeId | null {
    return this._selectedKoma;
  }

  /** 決着情報。result フェーズでのみ非 null */
  get verdict(): Verdict | null {
    return this._verdict;
  }

  onPhaseChange(listener: PhaseListener): void {
    this.listeners.push(listener);
  }

  private transition(to: MatchPhase): void {
    this._phase = to;
    for (const l of this.listeners) l(to);
  }

  /** タイトル: スタート → コマ選択へ */
  start(): void {
    if (this._phase !== 'title') throw new InvalidTransitionError(this._phase, 'start');
    this.transition('komaSelect');
  }

  /** コマ選択: 決定 → 投擲へ */
  selectKoma(komaId: KomaTypeId): void {
    if (this._phase !== 'komaSelect') throw new InvalidTransitionError(this._phase, 'selectKoma');
    this._selectedKoma = komaId;
    this.transition('aiming');
  }

  /** 投擲: ドラッグ確定 → 対戦へ */
  throwKoma(): void {
    if (this._phase !== 'aiming') throw new InvalidTransitionError(this._phase, 'throwKoma');
    this.transition('battle');
  }

  /** 対戦: 決着 → リザルトへ */
  settle(verdict: Verdict): void {
    if (this._phase !== 'battle') throw new InvalidTransitionError(this._phase, 'settle');
    this._verdict = verdict;
    this.transition('result');
  }

  /** リザルト: 同じコマで再戦 → 投擲へ */
  rematch(): void {
    if (this._phase !== 'result') throw new InvalidTransitionError(this._phase, 'rematch');
    if (this._selectedKoma === null) throw new InvalidTransitionError(this._phase, 'rematch');
    this._verdict = null;
    this.transition('aiming');
  }

  /**
   * 任意のフェーズからタイトルへ戻す（エラー復帰用）。
   * 通常の遷移図には無い経路のため、エラーハンドリング以外では使わないこと。
   */
  reset(): void {
    this._selectedKoma = null;
    this._verdict = null;
    this.transition('title');
  }

  /** リザルト: コマ選択へ戻る */
  backToSelect(): void {
    if (this._phase !== 'result') throw new InvalidTransitionError(this._phase, 'backToSelect');
    this._verdict = null;
    this._selectedKoma = null;
    this.transition('komaSelect');
  }
}
