import type { Vec2 } from './geometry';
import type { KomaTypeId } from './koma';

/** 対戦フェーズ */
export type MatchPhase = 'title' | 'komaSelect' | 'aiming' | 'battle' | 'result';

/** 対戦結果 */
export type MatchOutcome = 'playerWin' | 'cpuWin' | 'draw';

/** 決着理由 */
export type WinReason = 'ringOut' | 'spinStop' | 'foul';

/** 投擲パラメータ（投擲変換の出力） */
export interface ThrowParams {
  /** 正規化パワー 0〜1 */
  power: number;
  /** 水平初速 [m/s]（投擲方向・大きさ込み） */
  velocity: Vec2;
  /** 初期回転速度 [rad/s] */
  initialSpin: number;
}

/** CPU（または将来の対戦相手）の投擲決定 */
export interface ThrowDecision {
  komaId: KomaTypeId;
  /** ドラッグ相当ベクトル（throwCalc に渡す） */
  drag: Vec2;
}

/** 決着情報 */
export interface Verdict {
  outcome: MatchOutcome;
  /**
   * 敗者側の決着理由。draw では双方の理由が一致する場合のみその理由、
   * 異なる場合は null（「同時に決着」とだけ表示する）
   */
  reason: WinReason | null;
}
