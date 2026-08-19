import type { KomaSpec, KomaTypeId } from '../types/koma';

// --- ゲームバランス定数（調整はここに集約する） ---

/** ドラッグ長の下限 [px]。これ未満は p=0 扱い */
export const DRAG_MIN = 20;
/** ドラッグ長の上限 [px]。これ以上は p=1 にクランプ */
export const DRAG_MAX = 260;
/** 投擲の最小初速 [m/s] */
export const V_MIN = 1.2;
/** 投擲の最大初速 [m/s] */
export const V_MAX = 4.0;
/** 回転停止のしきい値 [rad/s]。未満で停止 */
export const SPIN_STOP_THRESHOLD = 8;
/** トコの半径 [m] */
export const TOKO_RADIUS = 1.5;
/** 場外判定のマージン [m] */
export const RING_OUT_MARGIN = 0.25;
/** 床面の高さ [m]（これより一定以上落下で場外） */
export const FLOOR_Y = 0;
/** 落下による場外判定のマージン [m] */
export const FALL_MARGIN = 0.5;
/** 衝突減衰の基本係数（衝突強度 → 回転減衰量の変換） */
export const IMPACT_DECAY_FACTOR = 2.0;
/** CPU 投擲の角度ゆらぎ [rad]（±10°） */
export const CPU_ANGLE_JITTER = (10 * Math.PI) / 180;
/** CPU 投擲のパワー範囲（正規化ドラッグ換算） */
export const CPU_POWER_MIN = 0.6;
export const CPU_POWER_MAX = 0.9;

/** コマ3種の固定定義 */
export const KOMA_SPECS: Record<KomaTypeId, KomaSpec> = {
  heavy: {
    id: 'heavy',
    name: '重量型',
    description: '重く押し負けない。回転の伸びは控えめ',
    mass: 0.045,
    initialSpin: 90,
    decayRate: 0.055,
    attack: 1.3,
  },
  speed: {
    id: 'speed',
    name: '速攻型',
    description: '鋭い回転で削り合いに強い。軽く弾かれやすい',
    mass: 0.028,
    initialSpin: 130,
    decayRate: 0.075,
    attack: 1.6,
  },
  balance: {
    id: 'balance',
    name: 'バランス型',
    description: '重さ・回転・攻めのバランスが良い',
    mass: 0.035,
    initialSpin: 110,
    decayRate: 0.065,
    attack: 1.45,
  },
};

export const KOMA_TYPE_IDS: readonly KomaTypeId[] = ['heavy', 'speed', 'balance'];
