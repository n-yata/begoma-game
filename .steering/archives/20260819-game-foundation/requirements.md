# 要求内容

## 概要

begoma-game の「ゲームの土台」を構築する。プロジェクトの雛形（Vite + TypeScript + テスト環境）から
3層アーキテクチャの骨格、中核ゲームロジック、最小限のプレイアブルな1プレイループまでを実装する。

## 背景

baseline 6ドキュメントが完成し、実装フェーズに入る。最初の作業として、以降のすべての機能追加が
乗る土台（ビルド環境・レイヤー構造・中核ロジック・動くゲームループ）を作る必要がある。
PRD の MVP（FR-1〜FR-5）を最小品質で一気通貫に動く状態にすることで、以降の作業を
「動くものへの追加・調整」にできる。

## 実装対象の機能

### 1. プロジェクト雛形

- Vite + TypeScript + Vitest + ESLint + Prettier のセットアップ
- `repository-structure.md` に従ったディレクトリ構造と依存ルール（ESLint の import 制約）
- three / @dimforge/rapier3d-compat の導入

### 2. 中核ゲームロジック（`src/game/` 純粋レイヤー）

- 区分値・型定義（`KomaTypeId` / `MatchPhase` / `MatchOutcome` / `WinReason`）
- コマ3種の静的定義（komaSpecs）
- シード注入可能な乱数（random）
- 投擲変換（throwCalc）・回転減衰と停止判定（spin）・勝敗判定（judge）・CPU投擲（cpu）
- フェーズ状態機械（MatchStateMachine）
- 上記すべてのユニットテスト（機能設計書のエッジケースを網羅）

### 3. エンジンレイヤー（`src/engine/`）

- Rapier ワールド構築・固定タイムステップ 60Hz（PhysicsWorld）
- Three.js シーン・椀状トコとコマのジオメトリ生成・描画ループ（Renderer / SceneAssets）
- rAF ループと物理追い付き制御（GameLoop）

### 4. UIレイヤー（`src/ui/`）と1プレイループ

- タイトル → コマ選択 → 投擲（ドラッグ） → 対戦 → リザルト → 再戦 の全フェーズ画面（最小品質）
- Pointer Events によるドラッグ入力（PC・スマホ共通）
- 回転ゲージ・投擲ガイドの HUD（最小限）
- WebGL 非対応時のフォールバック表示

## 受け入れ条件

### プロジェクト雛形
- [ ] `npm run dev` で開発サーバーが起動しゲームが表示される
- [ ] `npm run build` が成功し `dist/` に静的ファイルが出力される
- [ ] `npm test` / `npm run lint` / `npm run typecheck` がすべて成功する
- [ ] `src/game/` から three / rapier / DOM を import すると ESLint がエラーにする

### 中核ゲームロジック
- [ ] 機能設計書の4アルゴリズムのエッジケースがすべてテストケース化され、パスする
- [ ] MatchStateMachine が画面遷移図どおりに遷移し、不正遷移を拒否する
- [ ] 同一シードで CPU 投擲が再現される

### 1プレイループ
- [ ] ブラウザでタイトル → コマ選択 → ドラッグ投擲 → 対戦 → リザルト → 再戦が通しでプレイできる
- [ ] 場外・回転停止・投げ込み失敗の3種の決着がいずれも発生しうる
- [ ] 決着から1秒以内に勝敗が表示される

## 成功指標

- 1プレイが最後まで動き、「もう一度遊ぶ」が機能する（UC-01 / UC-03 の成立）
- `src/game/` のカバレッジ 90% 以上

## スコープ外

以下はこのフェーズでは実装しません:

- Playwright E2E テスト（統合・E2E は次の作業で導入）
- GitHub Actions CI/CD・GitHub Pages デプロイ
- 効果音・BGM、ビジュアルの作り込み（最小品質のプリミティブ表示でよい)
- ラウンド制・ローカル対戦・カスタマイズ等の Post-MVP 機能

## 参照ドキュメント

- `docs/baseline/product-requirements.md` - プロダクト要求定義書（FR-1〜FR-5）
- `docs/baseline/functional-design.md` - 機能設計書（アルゴリズム・画面遷移・モジュール構成の正本）
- `docs/baseline/architecture.md` - アーキテクチャ設計書（レイヤー責務・技術選定）
- `docs/baseline/repository-structure.md` - ディレクトリ構造・依存ルール
- `docs/specs/_shared/cross-cutting.md` - UI表示仕様・エラーハンドリング・テスト戦略
