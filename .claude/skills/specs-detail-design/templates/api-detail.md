# API-{ID}: {API名} 詳細設計書

> 基本情報（ID・メソッド・パス）の正本は
> [`functional-design.md`](../../../baseline/functional-design.md)「API一覧」。入出力の要約は
> [`api-design.md`](../../2_basic-design/api-design.md)。本書は本APIのバリデーション制約・処理概要・
> エラー詳細・テスト観点を記載する。

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-{ID} |
| API名 | {API名} |
| メソッド / パス | `{METHOD} {path}` |
| 概要 | {概要} |
| 関連画面 | {関連画面名} |
| 関連レイヤー | Handler → Service（`{ServiceMethod}`）→ {Domain（`{DomainFunc}`）+ }Repository（`{RepositoryMethod}`） |

## リクエスト仕様

| 項目 | 位置 | 型 | 必須 | 制約 | 備考 |
|---|---|---|:--:|---|---|
| `{param}` | path/query/body | {型} | 必須/任意/条件付き必須 | {制約} | {備考} |

条件付き必須の項目がある場合は整合表を併記する（baseline の該当整合表を参照し、再定義しない）。

## レスポンス仕様

### 成功時（{2xxステータス}）

| フィールド | 型 | 説明 |
|---|---|---|
| `{field}` | {型} | {説明} |

レスポンス例:
```json
{}
```

### エラー時

| ステータス | 条件 | レスポンス例 |
|---|---|---|
| 400 Bad Request | {条件} | `{"error": "..."}` |
| 404 Not Found | {条件} | `{"error": "..."}` |
| 500 Internal Server Error | DB障害等の予期せぬ障害 | — |

## 処理概要

1. Handler: {リクエストの受理・検証}
2. Service (`{ServiceMethod}`): {バリデーション・組み立てロジック}
3. {Domain (`{DomainFunc}`): {判定・計算ロジック}}
4. Repository (`{RepositoryMethod}`): {永続化処理}
5. Handler: {レスポンス整形・エラーマッピング}

## テスト観点

- 正常系: {代表的な入力パターン}
- 異常系: {バリデーション違反・存在しないリソース等}
- 境界値: {値域の最小/最大等}

> 具体的な入力値・期待結果の一覧は `docs/specs/4_unit-test/test-api-{ID}-{slug}.md`（ユニット）・
> `docs/specs/5_integration-test/`（画面単位の結合テスト）に書く（ここでは観点レベルに留める）。
