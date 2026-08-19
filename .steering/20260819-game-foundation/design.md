# 設計書

## アーキテクチャ概要

`architecture.md` の3層レイヤードアーキテクチャに従う。結線は `src/main.ts` のみが行う。

```
src/ui/ ──→ src/game/ ←── src/engine/
    │           │              │
    └───────→ src/types/ ←─────┘
```

- `src/game/` は types 以外に依存しない純粋レイヤー（ESLint `no-restricted-imports` で強制）
- `src/ui/` と `src/engine/` は互いに依存しない

## コンポーネント設計

### 1. src/types/（区分値・共有型)

**責務**:
- `KomaTypeId` / `MatchPhase` / `MatchOutcome` / `WinReason` の区分値
- `Vec2` / `Vec3` / `ThrowParams`（投擲パラメータ）/ `KomaState`（位置・回転速度・場外/接地フラグ）等の共有型

**実装の要点**:
- 依存ゼロの最下層。glossary.md の区分値定義と一致させる

### 2. src/game/（中核ロジック・純粋）

**責務**:
- `komaSpecs.ts`: 3種の KomaSpec とバランス定数（DRAG_MIN/MAX, V_MIN/MAX, SPIN_STOP_THRESHOLD, TOKO_RADIUS 等）
- `random.ts`: mulberry32 によるシード注入可能な PRNG
- `throwCalc.ts`: `computeThrow(drag: Vec2, spec: KomaSpec): ThrowParams`
- `spin.ts`: `decaySpin(spin, spec, dt)` / `applyImpactDecay(spin, impactMag, attackerAttack)` / `isStopped(spin)`
- `judge.ts`: `updateKomaStatus`（場外・接地の不可逆更新）と `judge(player, cpu): Verdict | null`
- `cpu.ts`: `decideCpuThrow(rng): { komaId, drag }`（角度±10°・パワー0.6〜0.9 のゆらぎ）
- `MatchStateMachine.ts`: フェーズ遷移（不正遷移は無視ではなく例外）とマッチ状態の保持

**実装の要点**:
- 機能設計書「アルゴリズム設計」の式・エッジケースを正とする
- `Math.random()` / `Date.now()` 禁止。乱数は rng 引数で注入
- 物理エンジンの数値（位置・衝突強度）は引数で受け取り、判定・減衰の決定だけを担う

### 3. src/engine/（物理・描画）

**責務**:
- `PhysicsWorld.ts`: Rapier 初期化（`RAPIER.init()`、ロード失敗は1回リトライ）、椀状トコ（**heightfield コライダ**。trimesh から実装時に変更: 高さ関数 `tokoHeightAt` を描画と共有でき、生成も安価なため）と回転ロックした円柱のコマ剛体を構築。`step()`（固定 dt は内部定数 `FIXED_DT`）で 60Hz 更新し、衝突観測（衝突直前の相対速度ベクトル・大きさ、トコ接触）を返す。コマの回転は物理トルクではなく game 層の spin 値を正とする（減衰・判定の決定権を game 層に置くため）。トコ接触はトコ半径内での接触のみ数える（heightfield が正方形で四隅が円の外に残るため）
- `SceneAssets.ts`: Three.js ジオメトリ生成（トコ=回転放物面ふうの LatheGeometry、コマ=Cone+Cylinder 合成）。外部アセットなし
- `Renderer.ts`: シーン・固定俯瞰カメラ・ライト構築、`sync(bodies)` で物理位置を反映して描画。WebGL2 非対応なら `WebGLUnsupportedError` を throw
- `GameLoop.ts`: rAF ループ。累積時間方式で物理を固定 dt=1/60 更新（追い付き最大3ステップ）、`onStep` コールバックで game 層の減衰・判定を呼ぶ

**実装の要点**:
- Rapier は `@dimforge/rapier3d-compat` を動的 import（コード分割・タイトル先行表示）
- visibilitychange で一時停止/再開

### 4. src/ui/（画面・入力）

**責務**:
- `screens.ts` 方針: 各画面は `TitleScreen.ts` / `KomaSelectScreen.ts` / `BattleScreen.ts` / `ResultScreen.ts`。DOM オーバーレイ（`textContent` のみ、innerHTML 禁止）
- `InputHandler.ts`: Pointer Events でドラッグベクトルを収集し、離した時点で `Vec2` を通知。`aiming` 中のみ有効
- `hud/SpinGauge.ts` / `hud/ThrowGuide.ts`: 回転ゲージ（上下バー）・投擲ガイド（矢印+パワーバー）

**実装の要点**:
- 画面の表示切替は MatchStateMachine の phase 購読で行う
- 色: プレイヤー=青系 / CPU=赤系（cross-cutting.md）

### 5. src/main.ts（結線）

**責務**:
- WebGL 判定 → フォールバック or 初期化、レイヤーの生成と接続、エラーのグローバルハンドリング（タイトル復帰）

## データフロー

### UC-01: 1プレイ

```
1. main: Renderer/PhysicsWorld 初期化 → MatchStateMachine(title)
2. TitleScreen スタート → phase=komaSelect
3. KomaSelectScreen 決定(komaId) → phase=aiming（シーンにコマ配置）
4. InputHandler ドラッグ確定(dragVec) → throwCalc.computeThrow → cpu.decideCpuThrow
   → PhysicsWorld に初速・回転を適用 → phase=battle
5. GameLoop 毎ステップ: PhysicsWorld.step → spin.decay/applyImpact → judge.judge
6. 決着 → phase=result → ResultScreen 表示（勝敗+理由）
7. 「同じコマで再戦」→ phase=aiming / 「コマ選択へ」→ phase=komaSelect（物理リセット）
```

## エラーハンドリング戦略

cross-cutting.md「エラーハンドリング」表を正とする。

- `WebGLUnsupportedError` / `PhysicsLoadError` のカスタムエラークラスを `src/engine/errors.ts` に定義
- main.ts で捕捉し、フォールバック文言 / 再読み込みボタンを表示
- window.onerror / unhandledrejection でタイトル復帰

## テスト戦略

### ユニットテスト（tests/unit/game/）

- throwCalc: クランプ境界（dragMin 未満・dragMax 超・タップ）、方向、spin0 計算
- spin: 自然減衰、衝突減衰、しきい値ちょうどで停止しない、双方同時停止、decayRate=0 で発散しない
- judge: 場外不可逆、双方同時場外=draw、foul（未接地場外）、優先順位 場外>停止
- cpu: 同一シード再現、ゆらぎの範囲
- MatchStateMachine: 遷移図どおりの遷移、不正遷移の拒否
- random: シード再現・分布の範囲

### 統合テスト

- このステアリングではスコープ外（次作業。requirements.md 参照）

## 依存ライブラリ

```json
{
  "dependencies": {
    "three": "~0.169.0",
    "@dimforge/rapier3d-compat": "~0.14.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "@types/three": "~0.169.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## ディレクトリ構造

`repository-structure.md` のとおり。今回作成するのは:

```
index.html  vite.config.ts  tsconfig.json  eslint.config.js  .prettierrc  package.json
src/main.ts
src/types/{koma.ts, match.ts, geometry.ts}
src/game/{komaSpecs.ts, random.ts, throwCalc.ts, spin.ts, judge.ts, cpu.ts, MatchStateMachine.ts}
src/engine/{errors.ts, PhysicsWorld.ts, SceneAssets.ts, Renderer.ts, GameLoop.ts}
src/ui/{TitleScreen.ts, KomaSelectScreen.ts, BattleScreen.ts, ResultScreen.ts, InputHandler.ts, hud/SpinGauge.ts, hud/ThrowGuide.ts}
src/style.css
tests/unit/game/*.test.ts
```

## 実装の順序

1. 雛形（package.json / 設定ファイル / index.html / 空エントリ）→ ツールチェーン成立を確認
2. types → game（テスト同時進行、TDD）
3. engine（Physics → Scene/Renderer → GameLoop）
4. ui + main 結線 → 通しプレイ確認
5. 品質チェック（test / lint / typecheck / build）

## セキュリティ考慮事項

- innerHTML への動的挿入禁止（development-guidelines.md）
- 依存は lockfile 固定。シークレット・外部送信なし

## パフォーマンス考慮事項

- Rapier を動的 import しタイトル表示を先行
- ジオメトリはプリミティブ合成のみ。転送サイズ上限 3MB を超えない

## 将来の拡張性

- CPU 投擲は `ThrowProvider` 型（`(rng) => ThrowDecision`）として定義し、ローカル対戦の人間入力に差し替え可能にする
- ラウンド制は MatchStateMachine にラウンドカウンタを足すだけで拡張できる遷移設計にする
