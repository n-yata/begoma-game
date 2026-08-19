# 設計書

## アーキテクチャ概要

既存レイヤード構成を変えない。UI（DOM）→ ゲームロジック（純粋）→ エンジン（Rapier/Three.js）。
床面矢印は「UI がドラッグを main.ts へ通知 → main.ts が game 層で投擲換算 → engine の
描画 API を呼ぶ」既存の投擲フローと同じ経路に乗せる。

## コンポーネント設計

### 1. CSP メタタグ（index.html）

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
connect-src 'self' ws: wss:;
img-src 'self' data:;
object-src 'none'; base-uri 'self'
```

- `'wasm-unsafe-eval'`: Rapier の WASM インスタンス化に必須
- `style-src 'unsafe-inline'` / `connect-src ws:`: Vite 開発サーバー（インジェクト
  スタイル・HMR WebSocket）のため。本番静的配信でも無害
- 効いていることは E2E（UC-01 が CSP 有効で通る）で担保する

### 2. import/no-cycle（eslint.config.js）

- `eslint-plugin-import-x` を devDependencies に追加
- `import-x/no-cycle: 'error'` を src/tests に適用
- 導入時に一時的な循環を注入して lint が落ちることを実測（注入と撤去は git を介さず
  コピー退避で行う。kit 規約「一時的な変更の後片付け」）

### 3. マッチ中断（MatchStateMachine / ResultScreen / main.ts）

- `abandonMatch(): void` を追加。**result フェーズかつマッチ未決着時のみ**許可し、
  全状態（コマ・スコア・verdict）を初期化して `komaSelect` へ遷移
- マッチ決着時は既存の `backToSelect()` が同じ役割を持つため、`abandonMatch` は許可しない
  （導線が二重になるだけ。区別することで「中断」をテレメトリ的にも識別可能に保つ）
- ResultScreen: 未決着表示に `btn--sub` の「マッチを中断してコマ選択へ」を追加
- functional-design.md の画面遷移図・リザルト画面要素を追随更新

### 4. 床面矢印（SceneAssets / Renderer / main.ts）

- engine 層に `ThrowArrow`（Three.js の平面メッシュ or ArrowHelper 相当を床面に配置）を追加
  - API: `renderer.updateThrowGuide(dirX: number, dirZ: number, power: number): void` /
    `renderer.hideThrowGuide(): void`
  - 位置: プレイヤー投入点起点。長さ = 基準長 × (0.5 + 0.5 × power)、色はプレイヤー青系
- main.ts: `onDragMove` で `computeThrow`（game 層）により方向・パワーを算出して
  engine へ渡す。`onDragEnd` / フェーズ遷移で非表示
- 画面座標→ワールド座標の変換は applyThrow と同じ規約（drag.y → world z）

### 5. Playwright E2E（tests/e2e/）

- 構成: `@playwright/test` を devDependencies に追加、`playwright.config.ts` で
  `webServer`（vite preview または dev）起動・chromium のみ（クロスブラウザは CI 拡張時）
- `uc01.spec.ts`: スタート → コマ選択 → canvas 上でマウスドラッグ → リザルト出現を待つ →
  マッチ決着まで「次のラウンドへ」を繰り返し → 最終リザルトの文言を検証（タイムアウト長め）
- `uc04.spec.ts`: `addInitScript` で `HTMLCanvasElement.prototype.getContext` の
  webgl2 を null 化 → フォールバック文言の表示を検証
- 乱数は Date.now シードのため結果は非決定だが、E2E は「決着に到達する」ことだけを検証する
  （勝敗は問わない）。物理の决着性はヘッドレス統合テストが担保済み

### 6. CI/CD（.github/workflows/）

- `ci.yml`: push(main)・pull_request で lint → typecheck → test → build → `npm audit`
  → E2E（Playwright。ブラウザインストール込み）
- `deploy.yml`: main push で CI 成功後（`workflow_run` または同一ワークフローの依存 job）、
  `npm run build` → `actions/deploy-pages`。権限は `GITHUB_TOKEN` の Pages 書き込みのみ
- development-guidelines.md の CI/CD 表に E2E を追記

## テスト戦略

- 中断遷移: MatchStateMachine ユニットテストに追加（未決着で可・決着後は例外・初期化検証）
- 床面矢印: engine 層のため単体は課さない（レイヤー方針どおり）。E2E の UC-01 実行経路で
  例外が出ないことを担保
- E2E: 上記2本。ローカル実行で確認（CI 実行は push 後）

## 実装の順序

1. CSP＋import/no-cycle（小さく独立）
2. マッチ中断（TDD）
3. 床面矢印
4. Playwright E2E（この時点で CSP・矢印・中断も通しで検証される）
5. CI/CD workflow＋ドキュメント追随
6. 品質ゲート → 振り返り → セキュリティレビュー → コミット・マージ

## セキュリティ考慮事項

- CSP はセキュリティ強化そのもの。緩め方向の指定（unsafe-inline は style のみ）を最小に
- workflow の権限は最小権限（contents: read / pages: write / id-token: write）
- 新規依存（eslint-plugin-import-x / @playwright/test）は lockfile 固定・`npm audit` を通す

## パフォーマンス考慮事項

- 矢印はプリミティブ1メッシュ。転送サイズ・描画負荷への影響は無視できる
- CSP メタタグはロード時間に影響しない
