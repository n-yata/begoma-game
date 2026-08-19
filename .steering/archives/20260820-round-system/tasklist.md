# タスクリスト

## 🚨 タスク完全完了の原則

全タスクが `[x]` になるまで作業を継続する。スキップは技術的理由のみ（理由を明記）。

## フェーズ0: 前提確認

- [x] battle-tuning（別セッション）のコミット完了を確認する
      （main にマージ済み・ツリークリーンを確認）
- [x] `main` 最新から `feature/round-system` ブランチを作成する

## フェーズ1: ゲームロジック（MatchStateMachine 拡張）

- [x] ラウンド遷移のユニットテストを追加する（Red）
  - [x] 2-0 / 2-1 でのマッチ決着と matchOutcome
  - [x] 引き分けラウンド（スコア・roundNumber 不変、nextRound 可能）
  - [x] 不正遷移（未決着 rematch / backToSelect、決着後 nextRound）
  - [x] rematch / reset での初期化
- [x] MatchStateMachine にラウンド状態を実装する（Green・全70テストパス）
  - [x] `ROUNDS_TO_WIN` 定数・`roundNumber`・`score`・`matchOutcome`
  - [x] `nextRound()` の追加、`settle` / `rematch` / `backToSelect` / `reset` の変更

## フェーズ2: UI・配線

- [x] ResultScreen をマッチ未決着/決着で出し分け、スコアを表示する
- [x] main.ts に「次のラウンドへ」→ `nextRound()` を配線し、
      ラウンド開始時の物理再初期化を既存 rematch 経路で共通化する
      （aiming 遷移時の共通リセット処理が nextRound でもそのまま働くことを確認）
- [x] 3本勝負の通しフローを動作確認する
      （実装方針変更: ブラウザ自動化ツールが利用不可のため、状態機械＋実物理で
      マッチ決着まで通すヘッドレス統合テスト `roundFlow.test.ts` に置き換えて機械的に検証。
      見た目の確認はシャビの実プレイに委ねる。dev サーバーは localhost:5173 で起動済み）

## フェーズ3: ドキュメント更新

- [x] functional-design.md を改訂する（画面遷移図・Match データモデル・
      ドメイン制約・リザルト画面の要素・UC-01/UC-03）

## フェーズ4: 品質チェック

- [x] `npm test`（全72テストパス）
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run format:check`

## フェーズ5: 仕上げ

- [x] 振り返りを retrospective.md に記録する
- [x] セキュリティレビュー（クルトワ・ハードコーディング検出観点込み。
      Critical 0 / High 0 / Medium 0 / Low 3、ブロッカーなし）
- [x] 対象ファイルを名指しでステージしてコミット → main へマージ → ブランチ削除
      （リモート未設定のため PR はローカルマージで代替。battle-tuning と同じ運用）
