import type RAPIER_NS from '@dimforge/rapier3d-compat';
import type { Vec2, Vec3 } from '../types/geometry';
import type { KomaSpec } from '../types/koma';
import { FLOOR_Y, KOMA_HALF_HEIGHT, KOMA_RADIUS, TOKO_RADIUS } from '../game/komaSpecs';
import { PhysicsLoadError } from './errors';

export type KomaSide = 'player' | 'cpu';

/**
 * トコ（椀）の窪みの深さ [m]。SceneAssets の描画形状と一致させること。
 * 縁の傾斜（最大 約25°）が摩擦角を上回り、コマが必ず中央へ滑り寄る値にしている
 */
export const TOKO_DEPTH = 0.45;
// コマの寸法の正本は game 層（komaSpecs.ts）。接触判定の距離定数と一致させるため
export { KOMA_HALF_HEIGHT, KOMA_RADIUS };
/** トコ表面の摩擦。摩擦角（約3°）< 斜面勾配 とし、静止摩擦で止まらないようにする */
const TOKO_FRICTION = 0.05;
/** トコ表面の反発。跳ねすぎると場外が出やすくなる */
const TOKO_RESTITUTION = 0.15;
/** コマの摩擦 */
const KOMA_FRICTION = 0.05;
/** コマ同士の反発。高すぎると初回衝突で即場外になり、ぶつかり合いが楽しめない */
const KOMA_RESTITUTION = 0.7;
/** コマの線形減衰。強すぎると中央へ滑り寄る前に止まる */
const KOMA_LINEAR_DAMPING = 0.06;
/** 物理の固定タイムステップ [s]（60Hz） */
export const FIXED_DT = 1 / 60;

/** 椀状トコの高さ関数: 中心が最も低い回転放物面。描画（SceneAssets）と共有する */
export function tokoHeightAt(r: number): number {
  const clamped = Math.min(r, TOKO_RADIUS);
  return FLOOR_Y - TOKO_DEPTH * (1 - (clamped / TOKO_RADIUS) ** 2);
}

/** コマ同士の衝突の観測値 */
export interface KomaImpact {
  /** 衝突直前の相対速度の大きさ */
  magnitude: number;
  /** 衝突直前の相対速度（player − cpu、水平面 x/z） */
  relativeVelocity: { x: number; z: number };
}

/** 1物理ステップの観測結果 */
export interface PhysicsStepResult {
  koma: Record<
    KomaSide,
    {
      position: Vec3;
      /** このステップでトコに接触したか */
      touchedTokoNow: boolean;
    }
  >;
  /** コマ同士の衝突。無衝突なら null */
  komaImpact: KomaImpact | null;
}

interface KomaBody {
  body: RAPIER_NS.RigidBody;
  colliderHandle: number;
}

/**
 * Rapier ワールドのラッパ。
 * コマは回転ロックした円柱剛体として扱い、回転（スピン）はゲームロジック側の値を正とする
 * （減衰・停止の決定権を src/game/ に置くため、物理トルクでは回さない）。
 */
export class PhysicsWorld {
  private world: RAPIER_NS.World;
  private eventQueue: RAPIER_NS.EventQueue;
  private tokoColliderHandle: number;
  private komaBodies = new Map<KomaSide, KomaBody>();

  private constructor(private RAPIER: typeof RAPIER_NS) {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.eventQueue = new RAPIER.EventQueue(true);
    this.tokoColliderHandle = this.buildToko();
  }

  /**
   * Rapier を動的 import して初期化する（コード分割でタイトル表示を先行させる）。
   * 一時的なネットワーク不調に備えて1回だけリトライする（cross-cutting.md のエラー方針）。
   */
  static async create(): Promise<PhysicsWorld> {
    const RETRY = 1;
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY; attempt++) {
      try {
        const RAPIER = (await import('@dimforge/rapier3d-compat')).default;
        await RAPIER.init();
        return new PhysicsWorld(RAPIER);
      } catch (e) {
        lastError = e;
      }
    }
    throw new PhysicsLoadError(lastError);
  }

  /** 椀状トコを heightfield コライダとして構築する。範囲外は奈落（落下→場外判定） */
  private buildToko(): number {
    const n = 40;
    const size = TOKO_RADIUS * 2;
    const heights = new Float32Array((n + 1) * (n + 1));
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = (i / n - 0.5) * size;
        const z = (j / n - 0.5) * size;
        heights[j * (n + 1) + i] = tokoHeightAt(Math.hypot(x, z));
      }
    }
    const body = this.world.createRigidBody(this.RAPIER.RigidBodyDesc.fixed());
    const collider = this.world.createCollider(
      this.RAPIER.ColliderDesc.heightfield(n, n, heights, { x: size, y: 1, z: size })
        .setFriction(TOKO_FRICTION)
        .setRestitution(TOKO_RESTITUTION),
      body,
    );
    collider.setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);
    return collider.handle;
  }

  /** コマ剛体を配置する（既存があれば置き換える） */
  spawnKoma(side: KomaSide, spec: KomaSpec, position: Vec3): void {
    this.removeKoma(side);
    const body = this.world.createRigidBody(
      this.RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .lockRotations()
        .setLinearDamping(KOMA_LINEAR_DAMPING),
    );
    const collider = this.world.createCollider(
      this.RAPIER.ColliderDesc.cylinder(KOMA_HALF_HEIGHT, KOMA_RADIUS)
        .setMass(spec.mass)
        .setFriction(KOMA_FRICTION)
        .setRestitution(KOMA_RESTITUTION),
      body,
    );
    collider.setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);
    this.komaBodies.set(side, { body, colliderHandle: collider.handle });
  }

  private removeKoma(side: KomaSide): void {
    const existing = this.komaBodies.get(side);
    if (existing) {
      this.world.removeRigidBody(existing.body);
      this.komaBodies.delete(side);
    }
  }

  /** 両コマを取り除く（再戦時のリセット） */
  reset(): void {
    this.removeKoma('player');
    this.removeKoma('cpu');
  }

  /** 水平初速を与える（投擲）。velocity は水平面ベクトル（x, z） */
  applyThrow(side: KomaSide, velocity: Vec2): void {
    const koma = this.komaBodies.get(side);
    if (!koma) return;
    koma.body.setLinvel({ x: velocity.x, y: 0, z: velocity.y }, true);
  }

  /**
   * 水平方向の追加速度を与える（勢い負けノックバック用）。
   * direction は正規化不要（内部で正規化する）。ゼロベクトルなら何もしない
   */
  addHorizontalVelocity(side: KomaSide, direction: { x: number; z: number }, deltaV: number): void {
    const koma = this.komaBodies.get(side);
    if (!koma) return;
    const len = Math.hypot(direction.x, direction.z);
    if (len === 0) return;
    const v = koma.body.linvel();
    koma.body.setLinvel(
      {
        x: v.x + (direction.x / len) * deltaV,
        y: v.y,
        z: v.z + (direction.z / len) * deltaV,
      },
      true,
    );
  }

  /** 1固定ステップ進め、観測結果を返す */
  step(): PhysicsStepResult {
    const player = this.komaBodies.get('player');
    const cpu = this.komaBodies.get('cpu');

    // 衝突強度は「衝突直前」の相対速度で測る（step 後は反発で減衰済みのため）
    const preRelVel =
      player && cpu
        ? {
            x: player.body.linvel().x - cpu.body.linvel().x,
            y: player.body.linvel().y - cpu.body.linvel().y,
            z: player.body.linvel().z - cpu.body.linvel().z,
          }
        : null;

    this.world.timestep = FIXED_DT;
    this.world.step(this.eventQueue);

    const touched: Record<KomaSide, boolean> = { player: false, cpu: false };
    let komaImpact: KomaImpact | null = null;

    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const involves = (koma: KomaBody | undefined): boolean =>
        koma !== undefined && (h1 === koma.colliderHandle || h2 === koma.colliderHandle);
      const involvesToko = h1 === this.tokoColliderHandle || h2 === this.tokoColliderHandle;

      if (involves(player) && involvesToko) touched.player = true;
      if (involves(cpu) && involvesToko) touched.cpu = true;
      if (player && cpu && involves(player) && involves(cpu) && preRelVel) {
        komaImpact = {
          magnitude: Math.hypot(preRelVel.x, preRelVel.y, preRelVel.z),
          relativeVelocity: { x: preRelVel.x, z: preRelVel.z },
        };
      }
    });

    const posOf = (side: KomaSide): Vec3 => {
      const koma = this.komaBodies.get(side);
      if (!koma) return { x: 0, y: 0, z: 0 };
      const t = koma.body.translation();
      return { x: t.x, y: t.y, z: t.z };
    };

    // heightfield は正方形のため、円形のトコ半径の外（四隅）での接地は「トコ接触」に数えない
    const touchedInsideToko = (side: KomaSide): boolean => {
      if (!touched[side]) return false;
      const p = posOf(side);
      return Math.hypot(p.x, p.z) <= TOKO_RADIUS;
    };

    return {
      koma: {
        player: { position: posOf('player'), touchedTokoNow: touchedInsideToko('player') },
        cpu: { position: posOf('cpu'), touchedTokoNow: touchedInsideToko('cpu') },
      },
      komaImpact,
    };
  }
}
