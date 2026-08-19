import { FIXED_DT } from './PhysicsWorld';

/** 1描画フレームで物理を追い付かせる最大ステップ数（スパイラル防止） */
const MAX_CATCHUP_STEPS = 3;

export interface GameLoopCallbacks {
  /** 固定タイムステップ（60Hz）ごとに呼ぶ。物理更新・減衰・判定はここで行う */
  onStep: (dt: number) => void;
  /** 描画フレームごとに呼ぶ */
  onFrame: (dt: number) => void;
}

/**
 * rAF ベースのゲームループ。累積時間方式で物理を固定 60Hz に保ち、
 * 描画フレームレートと分離する。タブ非表示中は自動停止し、復帰時に再開する。
 */
export class GameLoop {
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private rafId = 0;

  constructor(private callbacks: GameLoopCallbacks) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.running) {
        this.resumeTiming();
      }
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resumeTiming();
  }

  stop(): void {
    this.running = false;
    this.pause();
  }

  private pause(): void {
    cancelAnimationFrame(this.rafId);
  }

  private resumeTiming(): void {
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  private tick(now: number): void {
    if (!this.running || document.hidden) return;

    const frameDt = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.accumulator += frameDt;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_CATCHUP_STEPS) {
      this.callbacks.onStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    // 追い付き上限に達したら残りを捨てる（遅延の蓄積を防ぐ）
    if (steps === MAX_CATCHUP_STEPS) this.accumulator = 0;

    this.callbacks.onFrame(frameDt);
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }
}
