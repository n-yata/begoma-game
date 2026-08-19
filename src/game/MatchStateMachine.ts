import type { KomaTypeId } from '../types/koma';
import type { MatchOutcome, MatchPhase, Verdict } from '../types/match';

/** マッチ勝利に必要な勝ち星数。3本勝負＝2勝先取 */
export const ROUNDS_TO_WIN = 2;

/** 不正なフェーズ遷移 */
export class InvalidTransitionError extends Error {
  constructor(from: MatchPhase, event: string) {
    super(`フェーズ ${from} でイベント ${event} は受け付けられない`);
    this.name = 'InvalidTransitionError';
  }
}

export type PhaseListener = (phase: MatchPhase) => void;

/** ラウンドの勝ち星 */
export interface RoundScore {
  player: number;
  cpu: number;
}

/**
 * 対戦フェーズの状態機械。
 * 遷移図（functional-design.md「画面遷移図」）どおりの遷移のみ許可し、
 * 不正遷移は InvalidTransitionError を投げる。
 * ラウンド制（ROUNDS_TO_WIN 勝先取）のスコアもここで管理する。
 */
export class MatchStateMachine {
  private _phase: MatchPhase = 'title';
  private _selectedKoma: KomaTypeId | null = null;
  private _verdict: Verdict | null = null;
  private _score: RoundScore = { player: 0, cpu: 0 };
  private listeners: PhaseListener[] = [];

  get phase(): MatchPhase {
    return this._phase;
  }

  /** 選択中のコマ。komaSelect 完了後に非 null */
  get selectedKoma(): KomaTypeId | null {
    return this._selectedKoma;
  }

  /** 直近ラウンドの決着情報。result フェーズでのみ非 null */
  get verdict(): Verdict | null {
    return this._verdict;
  }

  /** 現在の勝ち星（コピーを返す） */
  get score(): RoundScore {
    return { ...this._score };
  }

  /**
   * 現在のラウンド番号（1 始まり）。
   * 引き分けは勝ち星に入らないため、やり直しでは番号が進まない
   */
  get roundNumber(): number {
    return this._score.player + this._score.cpu + 1;
  }

  /** マッチ全体の決着。ROUNDS_TO_WIN 勝到達まで null */
  get matchOutcome(): MatchOutcome | null {
    if (this._score.player >= ROUNDS_TO_WIN) return 'playerWin';
    if (this._score.cpu >= ROUNDS_TO_WIN) return 'cpuWin';
    return null;
  }

  onPhaseChange(listener: PhaseListener): void {
    this.listeners.push(listener);
  }

  private transition(to: MatchPhase): void {
    this._phase = to;
    for (const l of this.listeners) l(to);
  }

  private clearRoundState(): void {
    this._verdict = null;
    this._score = { player: 0, cpu: 0 };
  }

  /** タイトル: スタート → コマ選択へ */
  start(): void {
    if (this._phase !== 'title') throw new InvalidTransitionError(this._phase, 'start');
    this.transition('komaSelect');
  }

  /** コマ選択: 決定 → ラウンド1の投擲へ */
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

  /** 対戦: ラウンド決着 → リザルトへ。勝ち星を加算する（draw は加算なし） */
  settle(verdict: Verdict): void {
    if (this._phase !== 'battle') throw new InvalidTransitionError(this._phase, 'settle');
    this._verdict = verdict;
    if (verdict.outcome === 'playerWin') this._score.player += 1;
    if (verdict.outcome === 'cpuWin') this._score.cpu += 1;
    this.transition('result');
  }

  /** リザルト: 次のラウンドへ → 投擲へ（マッチ未決着時のみ） */
  nextRound(): void {
    if (this._phase !== 'result' || this.matchOutcome !== null)
      throw new InvalidTransitionError(this._phase, 'nextRound');
    this._verdict = null;
    this.transition('aiming');
  }

  /** リザルト: 同じコマで再戦 → 投擲へ（マッチ決着時のみ。スコアを初期化する） */
  rematch(): void {
    if (this._phase !== 'result' || this.matchOutcome === null)
      throw new InvalidTransitionError(this._phase, 'rematch');
    if (this._selectedKoma === null) throw new InvalidTransitionError(this._phase, 'rematch');
    this.clearRoundState();
    this.transition('aiming');
  }

  /**
   * 任意のフェーズからタイトルへ戻す（エラー復帰用）。
   * 通常の遷移図には無い経路のため、エラーハンドリング以外では使わないこと。
   */
  reset(): void {
    this._selectedKoma = null;
    this.clearRoundState();
    this.transition('title');
  }

  /**
   * リザルト: マッチを中断してコマ選択へ戻る（マッチ未決着時のみ。全状態を初期化する）。
   * 決着後は backToSelect が同じ役割を持つため、こちらは許可しない
   */
  abandonMatch(): void {
    if (this._phase !== 'result' || this.matchOutcome !== null)
      throw new InvalidTransitionError(this._phase, 'abandonMatch');
    this._selectedKoma = null;
    this.clearRoundState();
    this.transition('komaSelect');
  }

  /** リザルト: コマ選択へ戻る（マッチ決着時のみ。全状態を初期化する） */
  backToSelect(): void {
    if (this._phase !== 'result' || this.matchOutcome === null)
      throw new InvalidTransitionError(this._phase, 'backToSelect');
    this._verdict = null;
    this._selectedKoma = null;
    this.clearRoundState();
    this.transition('komaSelect');
  }
}
