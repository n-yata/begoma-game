# リポジトリ構造定義書 (Repository Structure Document)

作成日: 2026-08-19
工程: 詳細設計 — **技術スタックを反映した具体的なディレクトリ構造**
正本参照: レイヤー責務は [`architecture.md`](./architecture.md)、モジュールの役割は [`functional-design.md`](./functional-design.md)

## プロジェクト構造

```
begoma-game/
├── src/                       # ソースコード
│   ├── ui/                    # UIレイヤー（画面・HUD・入力）
│   ├── game/                  # ゲームロジックレイヤー（純粋。中核ロジック）
│   ├── engine/                # エンジンレイヤー（物理・描画ラッパ）
│   ├── types/                 # レイヤー横断の型定義
│   └── main.ts                # エントリーポイント（レイヤーの結線）
├── public/                    # そのまま配信される静的アセット
├── tests/                     # テストコード
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト（物理込みヘッドレス）
│   └── e2e/                   # E2Eテスト（Playwright）
├── docs/                      # プロジェクトドキュメント（baseline / specs）
├── .steering/                 # 作業単位ドキュメント
├── .claude/                   # Claude Code 設定（kit からのコピー）
├── .github/workflows/         # CI/CD（GitHub Actions）
├── index.html                 # Vite のエントリ HTML
├── vite.config.ts             # Vite / Vitest 設定
├── playwright.config.ts       # Playwright 設定
├── tsconfig.json              # TypeScript 設定
├── eslint.config.js           # ESLint 設定
└── package.json
```

## ディレクトリ詳細

### src/ui/

**役割**: フェーズごとの画面（DOM オーバーレイ）・HUD・Pointer Events による入力受付

**配置ファイル**:
- `*Screen.ts`: 画面コンポーネント（`TitleScreen.ts` / `KomaSelectScreen.ts` / `BattleScreen.ts` / `ResultScreen.ts`）
- `InputHandler.ts`: ドラッグ入力の収集と正規化
- `hud/`: 回転ゲージ・投擲ガイドなどの HUD 部品

**命名規則**:
- 画面は `[画面名]Screen.ts`（PascalCase）。機能設計書「画面一覧」の対応コンポーネント名と一致させる

**依存関係**:
- 依存可能: `src/game/`, `src/types/`
- 依存禁止: `src/engine/`（物理・描画を直接触らない）

### src/game/

**役割**: ゲームの中核ロジック。**外部ライブラリ・DOM に依存しない純粋な TypeScript**

**配置ファイル**:
- `MatchStateMachine.ts`: フェーズ状態機械（`MatchPhase` の遷移管理）
- `throwCalc.ts`: 投擲変換（ドラッグ → 初期状態）
- `spin.ts`: 回転減衰・停止判定
- `judge.ts`: 勝敗判定
- `cpu.ts`: CPU 投擲（シード付き乱数）
- `komaSpecs.ts`: コマ3種の静的定義
- `random.ts`: シード注入可能な乱数

**命名規則**:
- クラスは PascalCase、純粋関数モジュールは camelCase、定数は UPPER_SNAKE_CASE

**依存関係**:
- 依存可能: `src/types/` のみ
- 依存禁止: `src/ui/`, `src/engine/`, three / rapier / DOM API（**import 禁止**。ESLint で強制する）

### src/engine/

**役割**: Rapier / Three.js のラッパ。固定タイムステップ更新と物理→描画の同期

**配置ファイル**:
- `PhysicsWorld.ts`: Rapier ワールド構築・60Hz 固定ステップ・衝突イベント取得
- `Renderer.ts`: Three.js シーン構築・描画ループ
- `SceneAssets.ts`: 床（椀状トコ）・コマのジオメトリ生成
- `GameLoop.ts`: rAF ループと物理追い付き制御（最大3ステップ）

**命名規則**:
- クラスファイルは PascalCase

**依存関係**:
- 依存可能: `src/game/`（状態の読み取り・イベント通知）、`src/types/`、three、rapier
- 依存禁止: `src/ui/`

### src/types/

**役割**: レイヤー横断で使う型・区分値（`KomaTypeId` / `MatchPhase` / `MatchOutcome` / `WinReason` 等）

**依存関係**:
- 依存可能: なし（最下層）
- 依存禁止: すべてのレイヤー

### public/

**役割**: ビルドを経ずそのまま配信する静的ファイル（favicon、OGP 画像など）。
3D アセットはコード生成が基本のため、原則ここには置かない（置く場合は転送サイズ上限 3MB を守る）

### tests/

#### unit/

**役割**: `src/game/` の純粋ロジックのユニットテスト

**構造**:
```
tests/unit/
└── game/
    ├── throwCalc.test.ts
    ├── spin.test.ts
    ├── judge.test.ts
    ├── cpu.test.ts
    └── MatchStateMachine.test.ts
```

**命名規則**: `[テスト対象ファイル名].test.ts`

#### integration/

**役割**: Rapier 込みのヘッドレス統合テスト（描画なし・固定シード）

**構造**:
```
tests/integration/
└── battle/
    ├── settle.test.ts        # 必ず決着すること
    └── ringout.test.ts       # 場外判定が覆らないこと
```

#### e2e/

**役割**: Playwright による E2E テスト

**構造**:
```
tests/e2e/
├── play-through.test.ts      # UC-01: タイトル→決着→リザルト
└── webgl-fallback.test.ts    # UC-04: 非対応フォールバック
```

### docs/

**配置ドキュメント**: `AGENTS.md`「ディレクトリ構造」を正本とする（baseline 6ドキュメント + specs 工程別成果物）

### .github/workflows/

**配置ファイル**:
- `ci.yml`: PR ごとの lint・test・build
- `deploy.yml`: main マージ時の GitHub Pages デプロイ

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| 画面コンポーネント | `src/ui/` | `[画面名]Screen.ts` | `TitleScreen.ts` |
| HUD 部品 | `src/ui/hud/` | PascalCase | `SpinGauge.ts` |
| 純粋ロジック | `src/game/` | camelCase（関数）/ PascalCase（クラス） | `judge.ts`, `MatchStateMachine.ts` |
| エンジンラッパ | `src/engine/` | PascalCase | `PhysicsWorld.ts` |
| 型・区分値 | `src/types/` | camelCase | `match.ts`, `koma.ts` |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | `tests/unit/game/` | `[対象].test.ts` | `judge.test.ts` |
| 統合テスト | `tests/integration/[機能]/` | `[シナリオ].test.ts` | `settle.test.ts` |
| E2Eテスト | `tests/e2e/` | `[シナリオ].test.ts` | `play-through.test.ts` |

### 設定ファイル

| ファイル種別 | 配置先 | 命名規則 |
|------------|--------|---------|
| ツール設定 | プロジェクトルート | `[ツール名].config.ts` / `.js` |
| ゲームバランス定数 | `src/game/komaSpecs.ts` ほか `src/game/` 内 | UPPER_SNAKE_CASE の named export |

## 依存関係のルール

### レイヤー間の依存

```
src/ui/ ──→ src/game/ ←── src/engine/
    │           │              │
    └───────→ src/types/ ←─────┘
```

- `src/game/` は types 以外に依存しない（純粋レイヤー）
- `src/ui/` と `src/engine/` は互いに依存しない。結線は `src/main.ts` が行う

**禁止される依存**:
- `src/game/` → three / rapier / DOM (❌ ESLint `no-restricted-imports` で強制)
- `src/ui/` → `src/engine/` (❌)
- `src/engine/` → `src/ui/` (❌)
- 循環依存 (❌ 全レイヤー)

## スケーリング戦略

### 機能の追加

1. **小規模機能**（ラウンド制など）: 既存モジュールに追記
2. **中規模機能**（ローカル対戦）: `src/game/` に `ThrowProvider` 実装を追加し差し替え
3. **大規模機能**（オンライン対戦）: `src/net/` レイヤーを新設して分離

### ファイルサイズの管理

- 1ファイル 300 行以下を推奨。500 行以上は分割する

## 特殊ディレクトリ

### .steering/

`AGENTS.md`「作業ごとにステアリングを切る」を正本とする。**コミット対象**（作業履歴として残す）。

### .claude/

kit（spec-kit）からのコピー配布物。**手で編集しない**（`/kit-sync` で更新）。

## 除外設定

### .gitignore

- `node_modules/`
- `dist/`
- `coverage/`
- `test-results/`・`playwright-report/`
- `*.log`
- `.DS_Store`

`.steering/` は**除外しない**（コミット対象）。

### リント・フォーマッタの除外

- `dist/`, `node_modules/`, `coverage/`
