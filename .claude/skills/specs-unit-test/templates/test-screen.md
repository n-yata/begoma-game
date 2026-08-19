# 画面: {画面名} 単体テスト仕様書

> 対象画面の詳細設計は [`screen-{ID}-{slug}.md`](../3_detail-design/screen/screen-{ID}-{slug}.md)。
> テスト方針全体は [`cross-cutting.md`](../_shared/cross-cutting.md)「テスト戦略」を正本とする。
> 本書はコンポーネント単位の**ユニットテスト**（実API呼び出し不要、フェッチ部分はモック化）の
> ケースを列挙する。実PostgreSQL/実APIを要する結合テストのケースは
> `docs/specs/5_integration-test/test-integration-{screen-slug}.md`（`specs-integration-test`
> スキル）を参照。

## テスト対象

| コンポーネント | テスト種別 |
|---|---|
| `{ComponentName}` | ユニットテスト（Vitest + Testing Library 等） |

## テストケース一覧

| No | 観点 | 前提・操作 | 期待結果 | 完了 |
|---|---|---|---|:--:|
| 1 | 正常系 | {propsの前提・ユーザー操作} | {表示・呼び出しの期待結果} | [ ] |
| 2 | 異常系 | {エラー状態を渡す} | {エラー表示} | [ ] |

## 備考

- {モック化する依存・特記事項}
