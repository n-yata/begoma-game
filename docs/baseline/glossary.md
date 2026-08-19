# プロジェクト用語集 (Glossary)

## 概要

このドキュメントは、begoma-game プロジェクト内で使用される用語の定義を管理します。

**更新日**: 2026-08-19

## ドメイン用語

| 用語（英語表記） | 定義 | 説明・補足 | 関連用語 |
|---|---|---|---|
| ベーゴマ / コマ<br>(Koma) | 対戦で回して戦わせる鉄ゴマ。ゲームの主役となる剛体 | ゲーム内では「コマ」で統一する。プレイヤー側とCPU側の2個が対戦する | コマ種別 / トコ |
| コマ種別<br>(KomaSpec) | コマの性能を決める固定定義。重量型・速攻型・バランス型の3種 | 重さ・初期回転力・回転減衰率・攻撃補正を持つ。`src/game/komaSpecs.ts` の静的定義が正本 | コマ |
| トコ / 床<br>(Toko) | ベーゴマを投げ込む対戦フィールド。中央が窪んだ円形の椀状 | 実物の「樽トコ」（樽に布を張った台）を模す。コマは自然に中央へ集まる | 場外 |
| 投擲<br>(Throw) | ドラッグして離す操作でコマをトコに投げ込むこと | 引いた方向と長さで角度・強さが決まる。詳細は機能設計書「投擲変換」 | ドラッグ投げ / 投げ込み失敗 |
| ドラッグ投げ<br>(Drag Throw) | 引っ張って離す投擲操作方式 | マウス・タッチ共通。Pointer Events で実装 | 投擲 |
| 場外<br>(Ring Out) | コマがトコの外へ弾き出されること。敗北条件のひとつ | 一度成立したら覆らない（跳ね返って戻っても場外） | 勝敗判定 / トコ |
| 回転停止<br>(Spin Stop) | コマの回転速度がしきい値未満になり停止すること。敗北条件のひとつ | 双方場内の場合、先に停止した側の負け | 回転速度 / 勝敗判定 |
| 投げ込み失敗<br>(Foul) | 投擲後、トコに一度も接地せず場外に出る自滅 | 実物ベーゴマの「トコに乗らなかったら負け」に相当 | 投擲 / 勝敗判定 |
| 決着 / 勝敗判定<br>(Judge) | 場外・回転停止・投げ込み失敗から勝敗を確定させること | 優先順位: 場外 > 停止。双方同時成立は引き分け | 場外 / 回転停止 |
| 再戦<br>(Rematch) | リザルトから次の1プレイへ移ること | 「同じコマで再戦」と「コマ選択へ戻る」の2経路 | リザルト |

## 技術用語

| 用語 | 定義 | 本プロジェクトでの用途 | 備考 |
|---|---|---|---|
| Three.js | WebGL の 3D 描画ライブラリ | トコ・コマの 3D シーン描画（`src/engine/Renderer.ts`） | 選定理由は architecture.md |
| Rapier | Rust 製・WASM 配布の物理エンジン | コマの剛体シミュレーション（`src/engine/PhysicsWorld.ts`） | `@dimforge/rapier3d-compat` |
| Vite | フロントエンドのビルドツール | 開発サーバー・静的ビルド | Vitest と設定共有 |
| Vitest | Vite ネイティブのテストランナー | ユニット・統合テスト | — |
| Playwright | ブラウザ自動化による E2E テストツール | UC-01 通し・フォールバック確認 | — |
| Pointer Events | マウス・タッチを統一的に扱う DOM イベント | ドラッグ投げの入力実装 | — |
| 固定タイムステップ<br>(Fixed Timestep) | 物理更新を描画と独立した一定間隔で行う方式 | 60Hz。1描画フレームの追い付きは最大3ステップ | architecture.md が正本 |

## 略語・頭字語

| 略語 | 正式名称 | 意味 | 本プロジェクトでの使用 |
|---|---|---|---|
| PRD | Product Requirements Document | プロダクト要求定義書 | `docs/baseline/product-requirements.md` |
| FR / NFR | Functional / Non-Functional Requirement | 機能要件 / 非機能要件 | PRD の要件採番（FR-1 等） |
| UC | Use Case | ユースケース | 機能設計書の一覧（UC-01 等） |
| HUD | Head-Up Display | ゲーム画面に重ねる情報表示 | 回転ゲージ・投擲ガイド |
| WASM | WebAssembly | ブラウザで動くバイナリ形式 | Rapier の実行形式 |
| rAF | requestAnimationFrame | ブラウザの描画タイミング API | 描画ループ（`GameLoop.ts`） |

## アーキテクチャ用語

| 用語（英語表記） | 定義 | 本プロジェクトでの適用 | 関連コンポーネント |
|---|---|---|---|
| UIレイヤー (UI Layer) | 画面・HUD・入力受付の層 | `src/ui/`。エンジンレイヤーへの直接アクセス禁止 | `*Screen.ts`, `InputHandler` |
| ゲームロジックレイヤー (Game Layer) | ルール・判定・進行の純粋な層 | `src/game/`。three/rapier/DOM の import 禁止 | `MatchStateMachine`, `judge` |
| エンジンレイヤー (Engine Layer) | 物理・描画ライブラリのラッパ層 | `src/engine/`。ゲームルールの実装禁止 | `PhysicsWorld`, `Renderer` |
| ThrowProvider | 投擲パラメータの供給元を抽象化するインターフェース | CPU 投擲の実装。将来ローカル対戦の2人目に差し替え可能 | `cpu.ts` |

## ステータス・状態

### MatchPhase（対戦フェーズ）

| ステータス | 意味 | 遷移条件 | 次の状態 |
|----------|------|---------|---------|
| `title` | タイトル画面 | スタート押下 | `komaSelect` |
| `komaSelect` | コマ選択中 | コマ決定 | `aiming` |
| `aiming` | 投擲操作中 | ドラッグして離す | `battle` |
| `battle` | 自動戦闘中 | 決着成立 | `result` |
| `result` | リザルト表示 | 同じコマで再戦 / コマ選択へ | `aiming` / `komaSelect` |

### MatchOutcome（対戦結果）

| ステータス | 意味 | 遷移条件 | 次の状態 |
|----------|------|---------|---------|
| `playerWin` | プレイヤーの勝ち | CPU側のみ敗北条件成立 | — |
| `cpuWin` | CPU の勝ち | プレイヤー側のみ敗北条件成立 | — |
| `draw` | 引き分け | 双方が同一ステップで敗北条件成立 | — |

### WinReason（決着理由）

| ステータス | 意味 |
|----------|------|
| `ringOut` | 相手を場外へ弾き出した |
| `spinStop` | 相手が先に回転停止した |
| `foul` | 相手が投げ込みに失敗した（自滅） |

## データモデル用語

### KomaSpec（コマ種別）

固定3種のコマ性能定義。

| フィールド | 説明 |
|---|---|
| `id` | 種別ID（`heavy` / `speed` / `balance`） |
| `name` | 表示名（重量型 / 速攻型 / バランス型） |
| `mass` | 重さ。衝突時の押し合いに効く |
| `initialSpin` | 初期回転力 |
| `decayRate` | 回転減衰率（毎秒） |
| `attack` | 攻撃補正。衝突時に相手の回転を削る量 |

### Koma（コマ実体）

対戦中のコマ1個の状態。**関連エンティティ**: KomaSpec ／ **制約**: 回転速度は 0 以上、場外フラグは不可逆

### Match（対戦）

1プレイの状態。**関連エンティティ**: Koma ×2（プレイヤー側・CPU側） ／ **制約**: 結果は `result` フェーズでのみ非 null

## エラー・例外

| エラー | 発生条件 | 対処方法 | 例 |
|---|---|---|---|
| WebGL 非対応（`WebGLUnsupportedError`） | WebGL2 コンテキストが取得できない | フォールバック表示に切替（UC-04） | `renderer.init()` が throw |
| 物理ロード失敗（`PhysicsLoadError`） | Rapier WASM の取得・初期化失敗 | 1回リトライ後、再読み込み案内 | `await RAPIER.init()` が reject |

## 計算・アルゴリズム

| アルゴリズム | 要点／計算式 | 実装箇所 |
|---|---|---|
| 投擲変換 | `p = clamp01((|d|-dragMin)/(dragMax-dragMin))`<br>`v0 = vMin + p*(vMax-vMin)` | `src/game/throwCalc.ts` |
| 回転減衰 | 自然減衰 `spin *= (1 - decayRate*dt)` ＋ 衝突減衰（相手の攻撃補正比例） | `src/game/spin.ts` |
| 勝敗判定 | 場外 > 停止。双方同時は draw。場外は不可逆 | `src/game/judge.ts` |
| CPU 投擲 | 床中心狙い＋シード乱数ゆらぎ（角度±10°、パワー0.6〜0.9） | `src/game/cpu.ts` |

> 各アルゴリズムの正本は [`functional-design.md`](./functional-design.md)「アルゴリズム設計」。
