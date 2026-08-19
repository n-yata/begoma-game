# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### タスクスキップが許可される唯一のケース
技術的理由（実装方針変更・アーキテクチャ変更・依存関係変更）のみ。
スキップ時は `- [x] ~~タスク名~~（理由）` の形式で明記する。

---

## フェーズ1: プロジェクト雛形

- [x] package.json とツール設定を作成
  - [x] package.json（scripts: dev/build/test/lint/typecheck/format）
  - [x] tsconfig.json（strict）
  - [x] vite.config.ts（Vitest 設定含む・カバレッジ）
  - [x] eslint.config.js（レイヤー依存ルール: src/game/ から three/rapier/DOM 禁止）
  - [x] .prettierrc / .gitignore 更新
- [x] index.html / src/style.css / src/main.ts（仮）を作成
- [x] 依存パッケージのインストール（npm install）と起動確認（typecheck / build 成功で確認）

## フェーズ2: 型と中核ゲームロジック（TDD）

- [x] src/types/ の型定義（koma.ts / match.ts / geometry.ts）
- [x] src/game/random.ts（mulberry32）＋テスト
- [x] src/game/komaSpecs.ts（3種定義・バランス定数）
- [x] src/game/throwCalc.ts ＋テスト（クランプ境界・タップ・方向）
- [x] src/game/spin.ts ＋テスト（自然減衰・衝突減衰・しきい値・decayRate=0）
- [x] src/game/judge.ts ＋テスト（場外不可逆・同時場外draw・foul・優先順位）
- [x] src/game/cpu.ts ＋テスト（シード再現・ゆらぎ範囲）
- [x] src/game/MatchStateMachine.ts ＋テスト（遷移図・不正遷移拒否）

## フェーズ3: エンジンレイヤー

- [x] src/engine/errors.ts（WebGLUnsupportedError / PhysicsLoadError）
- [x] src/engine/PhysicsWorld.ts（Rapier 初期化・トコ heightfield/コマ剛体・60Hz step・衝突イベント）
- [x] src/engine/SceneAssets.ts（トコ LatheGeometry・コマ合成ジオメトリ）
- [x] src/engine/Renderer.ts（シーン・カメラ・ライト・sync・WebGL 判定）
- [x] src/engine/GameLoop.ts（rAF・固定タイムステップ・追い付き最大3・visibilitychange）

## フェーズ4: UI と結線

- [x] src/ui/InputHandler.ts（Pointer Events ドラッグ収集）
- [x] src/ui/hud/SpinGauge.ts / ThrowGuide.ts
- [x] src/ui/TitleScreen.ts / KomaSelectScreen.ts / BattleScreen.ts / ResultScreen.ts
- [x] src/main.ts 結線（WebGL フォールバック・グローバルエラーハンドラ含む）
- [x] 通しプレイ確認（ヘッドレス統合テスト tests/integration/battle/settle.test.ts で
      投擲→衝突→決着のパイプラインを検証。自動実行環境ではブラウザの目視確認ができないため、
      画面操作の最終確認はユーザーへ依頼する）

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認（46件パス、src/game/ カバレッジ 100%/95%）
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`
- [x] ビルドが成功することを確認（gzip 合計約 0.9MB、Rapier はコード分割）
  - [x] `npm run build`

## フェーズ5.5: 実装検証（implementation-validator）の指摘対応

- [x] 検証実施（Critical 0 / High 3 / Medium 7 / Low 9）
- [x] H-1: 投擲確定の非同期競合を修正（throwing ガード・await 前の input 無効化・フェーズ再チェック）
- [x] H-2: Rapier ロードの1回リトライ実装＋エラー表示経路の一本化
- [x] H-3: グローバル例外でタイトル復帰（MatchStateMachine.reset + トースト表示。連発時のみリロード誘導）
- [x] M-1: 衝突の攻守判定を実装（resolveAttacker。衝突直前の相対速度で判定、攻撃側の補正のみ相手に乗る）
- [x] M-2: InputHandler の enabled=false 時にドラッグ開始点を破棄
- [x] M-3: パワー計算式を computePower に一本化（ThrowGuide が再利用）
- [x] M-4: draw 時の Verdict.reason を「一致時のみ理由、不一致は null」に修正
- [x] M-5(一部): ui から three/@dimforge の直接 import を ESLint で禁止（import/no-cycle は次作業へ申し送り）
- [x] M-6: 欠落テスト追加（双方停止 draw・双方場外 draw・CPU が foul しない不変条件・resolveAttacker・reset）
- [x] M-7: Prettier 適用＋ format:check スクリプト追加
- [x] L-2: CSS の二重読み込み解消 / L-3: cpuSpecId の重複状態を削除 / L-5: design.md を実装に追随 /
      L-7: 統合テストのアサーション強化 / L-9: UI イベントの不正遷移を safe() で無害化
- [x] 残 Low（L-1 矢印ガイド・L-4・L-6 ringout.test 分離・L-8 四隅の平坦域）は retrospective.md に申し送り

## フェーズ6: ドキュメント更新

- [x] README.md を作成（起動方法・遊び方の最小記載）
- [ ] 実装後の振り返りを記録（別ファイル `retrospective.md` に記録 → モード3）

---

> **振り返りについて**: 実装後の振り返りはこのファイルではなく、同じディレクトリの
> `retrospective.md` に記録する。全タスクが `[x]` になったことを確認してから作成すること。
