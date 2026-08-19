import type { Vec2 } from '../types/geometry';

export interface InputCallbacks {
  /** ドラッグ中（毎 move）。drag は開始点→現在点の「引っ張りベクトル」 */
  onDragMove: (drag: Vec2) => void;
  /** ドラッグ確定（離した時）。長さ 0 のタップでは呼ばない */
  onDragEnd: (drag: Vec2) => void;
}

/**
 * Pointer Events によるドラッグ入力。マウス・タッチを単一コードパスで扱う。
 * enabled のときだけ入力を受け付ける（aiming フェーズ中のみ有効化する）。
 */
export class InputHandler {
  private _enabled = false;
  private start: Vec2 | null = null;

  /** 無効化時はドラッグ途中の開始点も破棄する（残留状態による誤投擲を防ぐ） */
  set enabled(value: boolean) {
    this._enabled = value;
    if (!value) this.start = null;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  constructor(
    target: HTMLElement,
    private callbacks: InputCallbacks,
  ) {
    target.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.start = { x: e.clientX, y: e.clientY };
      target.setPointerCapture(e.pointerId);
    });

    target.addEventListener('pointermove', (e) => {
      if (!this.enabled || !this.start) return;
      this.callbacks.onDragMove(this.dragFrom(e));
    });

    target.addEventListener('pointerup', (e) => {
      if (!this.enabled || !this.start) return;
      const drag = this.dragFrom(e);
      this.start = null;
      if (drag.x !== 0 || drag.y !== 0) this.callbacks.onDragEnd(drag);
    });

    target.addEventListener('pointercancel', () => {
      this.start = null;
    });
  }

  private dragFrom(e: PointerEvent): Vec2 {
    return { x: e.clientX - (this.start?.x ?? 0), y: e.clientY - (this.start?.y ?? 0) };
  }
}
