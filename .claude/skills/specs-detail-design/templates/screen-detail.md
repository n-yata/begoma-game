# 画面詳細設計書: {画面名}

> 画面一覧・ルート・対応コンポーネント・画面遷移の正本は
> [`functional-design.md`](../../../baseline/functional-design.md)「画面設計」。レイアウト・画面項目・
> 画面イベントの外部設計は [`screen-design.md`](../../2_basic-design/screen-design.md)。本書は本画面の
> コンポーネント構成（props/state）・状態管理・詳細な画面遷移/イベント処理フロー・例外表示を記載する。

## 基本情報

| 項目 | 内容 |
|---|---|
| 画面名 | {画面名} |
| ルート(FE) | `{route}` |
| 対応コンポーネント | `{PageComponent}` |
| 関連API | `{METHOD} {path}`（API-{ID}）… |
| 関連機能 | {FR-XX等} |

外部設計（レイアウト・画面項目定義・画面イベント一覧）は
[`screen-design.md`](../../2_basic-design/screen-design.md)「画面{N}: {画面名}」を参照。本書は以下の
実装レベル詳細に限定する。

## コンポーネント構成

```
{PageComponent}
├── {ChildComponentA}
└── {ChildComponentB}
```

### props / state 設計

| コンポーネント | props | 内部 state |
|---|---|---|
| `{PageComponent}` | — | — |
| `{ChildComponentA}` | `{propName}: {型}` | {内部stateの説明} |

## 状態管理（クエリキー設計）

| フック | クエリキー | 対応API |
|---|---|---|
| `use{Xxx}()` | `['{resource}', ...]` | API-{ID} |

invalidateのタイミング（どの操作でどのキーを再取得するか）を明記する。

## 画面遷移・イベント処理の詳細フロー

### {イベント名}

1. {ユーザー操作}
2. {API呼び出し・状態更新}
3. {成功時の反映}
4. {失敗時のロールバック・エラー表示}

### 画面遷移イベント

| 操作 | 遷移先 | 備考 |
|---|---|---|
| {操作} | `{route}`（`{PageComponent}`） | {備考} |

## 例外・エラー表示

| ケース | 表示 |
|---|---|
| {APIエラーのケース} | {画面上の表示。共通仕様は cross-cutting.md 参照、本画面固有の扱いのみ記載} |
