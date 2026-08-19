import type { Vec3 } from './geometry';

/** コマ種別ID */
export type KomaTypeId = 'heavy' | 'speed' | 'balance';

/** コマ種別（固定3種の性能定義） */
export interface KomaSpec {
  id: KomaTypeId;
  /** 表示名 */
  name: string;
  /** 説明文（コマ選択画面用） */
  description: string;
  /** 重さ [kg]。衝突時の押し合いに効く */
  mass: number;
  /** 初期回転力 [rad/s] */
  initialSpin: number;
  /** 回転減衰率 [1/s] */
  decayRate: number;
  /** 攻撃補正。衝突時に相手の回転を削る係数 */
  attack: number;
}

/** 対戦中のコマ1個の状態 */
export interface KomaState {
  specId: KomaTypeId;
  /** 現在の回転速度 [rad/s]。0 以上 */
  spin: number;
  /** 停止済みか（不可逆） */
  stopped: boolean;
  /** 場外か（不可逆） */
  ringOut: boolean;
  /** トコに一度でも接地したか（foul 判定用） */
  touchedToko: boolean;
  /** 現在位置（物理レイヤーから同期） */
  position: Vec3;
}
