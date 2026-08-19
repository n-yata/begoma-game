/** WebGL2 が利用できない環境で投げるエラー（UC-04 フォールバック用） */
export class WebGLUnsupportedError extends Error {
  constructor() {
    super('WebGL2 コンテキストを取得できない');
    this.name = 'WebGLUnsupportedError';
  }
}

/** 物理エンジン（Rapier WASM）のロード・初期化失敗 */
export class PhysicsLoadError extends Error {
  constructor(cause?: unknown) {
    super('物理エンジンの読み込みに失敗した');
    this.name = 'PhysicsLoadError';
    this.cause = cause;
  }
}
