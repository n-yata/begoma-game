# 実装後の振り返り

## 作業概要

累積していた申し送りバックログの一括対応。CSP メタタグ（dev/本番の出し分け込み）、
循環依存検出（import-x/no-cycle）、マッチ途中中断の導線、投擲ガイドの床面矢印、
Playwright E2E（UC-01 通し・中断導線・WebGL フォールバック）、GitHub Actions CI/CD
（ci.yml / deploy.yml）を実装した。

## 実装完了日

2026-08-20

## 対象リポジトリ・コミット

- 対象リポジトリ: 本リポジトリ
- ブランチ: feature/quality-and-ux
- コミット: （マージ後に追記）

## セキュリティレビュー（security-engineer）の結果

- 実施日: 2026-08-20
- 結果: Critical 0件 / High 0件 / Medium 2件 / Low 3件
- Critical / High への対応: 指摘なし
- Medium への対応（**いずれもコミット前に修正済み**）:
  1. deploy.yml の workflow_run が fork PR 由来でも発火しうる → `event == 'push'` と
     `head_repository == 自リポジトリ` のガードを追加。checkout に
     `persist-credentials: false` も追加
  2. dev 用の CSP 緩和（style unsafe-inline / ws:）が本番成果物に出荷される →
     vite.config.ts の `transformIndexHtml`（build 時のみ）で厳格 CSP に差し替え。
     dist/index.html への反映と、厳格 CSP 下での E2E 全パスを実測確認
- Low の扱い:
  1. Actions の SHA ピン留め → 未対応（公式 actions のみ使用。次回改善候補として申し送り）
  2. E2E が dev サーバーのみ対象 → **対応済み**（CI では build + vite preview に切り替え）
  3. npm audit の重大度 → `--audit-level=high` に調整。meta CSP で frame-ancestors が
     効かない件は実害なしと判断し記録のみ

## 計画と実績の差分

**計画と異なった点**:

- **import-x/no-cycle は `import-x/extensions: ['.ts']` が無いと沈黙する**。リゾルバ
  （eslint-import-resolver-typescript / resolver-next）を正しく入れても、拡張子設定が
  無いと .ts を依存グラフとして辿らず、循環があっても何も報告しない。
  違反注入による実測確認をしていなければ「導入したつもり」で終わっていた
- 床面矢印の目視確認はブラウザ自動化ツールが使えないため、E2E の実行経路
  （ドラッグ中に例外が出ない）で代替。矢印の見た目はシャビの実プレイで最終確認
- クルトワの指摘（Medium 2件）を受けて、CSP の dev/本番出し分けと deploy.yml の
  発火ガードを実装に追加した（当初計画には無かった）

**新たに必要になったタスク**:

- CI モードの E2E（build + preview）実行時、ローカルの dev サーバーが 5173 を
  占有していると webServer が起動できない → dev サーバー停止後に実行

**技術的理由でスキップしたタスク**: なし

## 学んだこと

**技術的な学び**:

- **検出系のツールは「導入して緑」では信用しない**。違反を注入して赤くなることまで
  確認して初めて導入完了（no-cycle の沈黙はこの手順が無ければ見逃した）
- **workflow_run の branches フィルタはトリガー元 run の head ブランチ名に効く**ため、
  fork の main からの PR でも発火しうる。`event == 'push'` ＋送信元リポジトリの
  ガードが必要。また `head_sha` を checkout する改修は、ガード無しでは fork コードを
  書き込み権限下で実行する脆弱性に直結する（ガードとセットでのみ可）
- **メタタグ CSP は index.html 1枚が dev と本番で共用される**ため、dev 専用の緩和は
  ビルド時差し替え（transformIndexHtml, apply: 'build'）で本番から除く
- E2E は「非決定な結果を検証しない」割り切りが要る。決着到達・画面遷移・導線だけを
  検証し、物理の性質はヘッドレス統合テスト（固定シード）に任せる

**プロセス上の改善点**:

- セキュリティレビューを「コミット直前」ではなく実装の節目で挟んだことで、
  Medium 2件を同一ブランチ内で修正でき、手戻りが小さかった
- 並行セッションの回避策として最初から worktree で開始し、今回は巻き込み事故ゼロ

## 次回への改善提案

- 申し送り:
  - GitHub リポジトリ作成・リモート登録・push・Pages 有効化（外部公開のためシャビの
    判断で実施。workflow はローカルに準備済み）
  - Actions の SHA ピン留め（deploy.yml 優先）
  - ヒット演出・効果音（impact-damage の申し送り、未着手のまま）
  - 床面矢印・中断ボタンの見た目はシャビの実プレイで確認
- spec-kit へ還元済み: フック誤検知の修正（PR #13）・worktree 分離と改行変換の規約
