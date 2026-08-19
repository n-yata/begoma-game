# タスクリスト

## 🚨 タスク完全完了の原則

全タスクが `[x]` になるまで作業を継続する。スキップは技術的理由のみ（理由を明記）。

## フェーズ1: 小さく独立した対応

- [x] index.html に CSP メタタグを追加（`'wasm-unsafe-eval'` 込み）
- [x] eslint-plugin-import-x を導入し `import-x/no-cycle` を有効化
      （`import-x/extensions: ['.ts']` が必須 — 無いと .ts を辿らず沈黙する。要注意）
- [x] 循環を一時注入して lint が落ちることを実測（検出2件を確認・コピー退避で撤去）

## フェーズ2: マッチ中断導線

- [x] 中断遷移のユニットテストを追加（Red）: 未決着 result で可 / 決着後・他フェーズは例外 /
      全状態初期化
- [x] `MatchStateMachine.abandonMatch()` を実装（Green・21テストパス）
- [x] ResultScreen 未決着表示に「マッチを中断してコマ選択へ」を追加し main.ts へ配線
- [x] functional-design.md の遷移図・リザルト画面要素を追随更新

## フェーズ3: 投擲ガイドの床面矢印

- [x] engine 層に ThrowArrow を実装（`updateThrowGuide` / `hideThrowGuide`）
- [x] main.ts の onDragMove / onDragEnd / フェーズ遷移に配線
- [x] 動作確認（E2E の UC-01 でドラッグ経路が例外なく通ることを確認。
      矢印の見た目・向きの最終確認はシャビの実プレイに委ねる）

## フェーズ4: Playwright E2E

- [x] @playwright/test 導入・playwright.config.ts 作成（webServer 起動込み）
- [x] uc01.spec.ts: 1マッチ通し＋マッチ中断導線（決着到達とリザルト表示の検証）
- [x] uc04.spec.ts: WebGL 非対応フォールバック
- [x] ローカルで E2E 全パス（3件 / 47秒）

## フェーズ5: CI/CD

- [x] .github/workflows/ci.yml（lint → typecheck → format:check → test → build → audit → E2E）
- [x] .github/workflows/deploy.yml（workflow_run 連鎖・Pages デプロイ・最小権限）
- [x] development-guidelines.md の CI/CD 表を追随更新

## フェーズ6: 品質チェック

- [x] `npm test`（76件）/ `npm run lint` / `npm run typecheck` / `npm run build` /
      `npm run format:check` 全パス
- [x] `npm run test:e2e` 全パス（3件）

## フェーズ7: 仕上げ

- [x] 振り返りを retrospective.md に記録
- [x] セキュリティレビュー（クルトワ。Critical 0 / High 0 / Medium 2 / Low 3。
      Medium 2件＝deploy 発火ガード・本番 CSP 出し分けはコミット前に修正済み）
- [x] 名指しステージでコミット → main へマージ → ブランチ削除
