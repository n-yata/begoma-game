# 要求内容

## 概要

累積していた申し送りバックログの一括対応。品質基盤（E2E・CI/CD・CSP・循環依存検出）と
UX 改善（投擲ガイドの床面矢印・マッチ途中離脱導線）をまとめて実装する。
シャビの指示（2026-08-20「1,2の対応をお願い」）による。

## 背景

20260819-game-foundation 以降、各ステアリングの振り返りに申し送りが積み上がっていた。
振り返りの棚卸し（アーカイブ）に伴い、タスクとして残っていたものを消化する。

## 実装対象の機能

### 1. CSP メタタグ（20260819 からの申し送り）

- index.html に Content-Security-Policy メタタグを追加する
- Rapier の WASM 用に `script-src` へ `'wasm-unsafe-eval'` が必須
- Vite の開発サーバー（HMR の WebSocket・インラインスタイル）を壊さないこと

### 2. 循環依存の機械的検出（import/no-cycle）

- `eslint-plugin-import-x` を導入し `import-x/no-cycle` を有効化する

### 3. マッチ途中離脱の導線（クルトワ Low-2）

- マッチ未決着のリザルト画面に「マッチを中断してコマ選択へ」を追加する
- 状態機械に中断遷移を追加し、スコア・コマ選択を初期化する（不正遷移は従来どおり例外）

### 4. 投擲ガイドの床面矢印（cross-cutting.md の HUD 仕様）

- ドラッグ中、床面上に投擲方向・強さを示す矢印を表示する（現状はパワーバーのみ）
- レイヤー規約を守る: UI → main.ts 経由で engine の描画 API を呼ぶ（UI から engine 直接参照禁止）

### 5. Playwright E2E（UC-01 通し・WebGL フォールバック）

- UC-01: タイトル→コマ選択→ドラッグ投擲→対戦→リザルト（マッチ決着まで）の1本通し
- UC-04: WebGL 非対応環境でフォールバック文言が表示されること

### 6. GitHub Actions CI/CD

- `ci.yml`: PR・main push で `npm ci` → lint → typecheck → test → build → `npm audit`（＋E2E）
- `deploy.yml`: main push（CI 成功後）で GitHub Pages へデプロイ
- development-guidelines.md の CI/CD 表と整合させる（E2E を加える場合は表も更新）

## 受け入れ条件

- [ ] CSP 有効状態でゲームが起動・プレイできる（E2E で担保）
- [ ] 循環依存を含むコードで lint が失敗する（導入時に違反注入で実測確認）
- [ ] マッチ未決着リザルトから中断でコマ選択へ戻れ、スコアが初期化される
- [ ] 未決着以外での中断など不正遷移は `InvalidTransitionError`
- [ ] ドラッグ中に床面矢印が方向・強さを反映して表示され、離すと消える
- [ ] E2E がローカルで全パスする（UC-01・UC-04）
- [ ] 既存テスト全パス＋品質ゲート（test / lint / typecheck / build / format:check）
- [ ] CI/CD の workflow が push 可能な状態で作成されている（GitHub リポジトリ作成・push は
      外部公開を伴うためシャビの判断で実施）

## スコープ外

- GitHub リポジトリの作成・リモート登録・実際の Pages 公開（シャビの承認後に別途）
- ヒット演出・効果音（impact-damage の申し送り。別ステアリング）
- コミットフックの誤検知修正（spec-kit 側 PR で対応中）

## 参照ドキュメント

- `docs/specs/_shared/cross-cutting.md` - HUD 仕様（投擲ガイド＝床面矢印＋パワーバー）
- `docs/baseline/development-guidelines.md` - CI/CD 構成の正本
- `docs/baseline/architecture.md` - レイヤー規約・E2E 方針
- `.steering/archives/` 各振り返り - 申し送りの出典
