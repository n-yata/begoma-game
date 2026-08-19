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
export const IMPACT_DECAY_FACTOR = 3.0;
/** 衝突1回あたりの最低削り量 [rad/s]。かすった衝突でも体力が目に見えて減るように */
export const IMPACT_MIN_DECAY = 5;
/** コマの半径 [m]（物理コライダ・描画・接触判定の正本） */
export const KOMA_RADIUS = 0.11;
/** コマの半高 [m] */
export const KOMA_HALF_HEIGHT = 0.055;
/** 勢い負けノックバック: この回転残量比未満に弱った側が弾き飛ばされ対象になる */
export const WEAK_SPIN_RATIO = 0.55;
/**
 * ノックバックが発生する回転劣勢差（残量比の差）のしきい値。
 * 減衰率が隣接するタイプ間の残量比差は最大でも約 0.067（指数減衰の差の最大値）のため、
 * それを拾える値にしている。同タイプ同士の互角勝負では発生せず、回転停止で決着する
 */
export const KNOCKBACK_MIN_GAP = 0.04;
/** ノックバックで加える追加速度 [m/s]（トコの縁（深さ0.45m）を摩擦込みで越えられる速さ） */
export const KNOCKBACK_SPEED = 5.2;
/** ノックバック判定の接触距離 [m]（コマ2個分 + 余裕） */
export const KNOCKBACK_CONTACT_DIST = KOMA_RADIUS * 2 + 0.02;
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
    decayRate: 0.08,
    attack: 1.3,
  },
  speed: {
    id: 'speed',
    name: '速攻型',
    description: '鋭い回転で削り合いに強い。軽く弾かれやすい',
    mass: 0.028,
    initialSpin: 130,
    decayRate: 0.11,
    attack: 1.6,
  },
  balance: {
    id: 'balance',
    name: 'バランス型',
    description: '重さ・回転・攻めのバランスが良い',
    mass: 0.035,
    initialSpin: 110,
    decayRate: 0.095,
    attack: 1.45,
  },
};

export const KOMA_TYPE_IDS: readonly KomaTypeId[] = ['heavy', 'speed', 'balance'];
