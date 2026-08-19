# API設計（入出力詳細）

> 【分割テンプレート】このファイルは `docs/specs/2_basic-design/api-design.md` に配置する。
> API名・ID・メソッド・パスの正本は `docs/baseline/functional-design.md`「API一覧」。本ファイルは
> 各APIの入出力詳細・リクエスト/レスポンス例・エラーレスポンスなど、**必要な時にだけ参照すればよい
> 実装レベルの記述**のみを置く。API契約の正本がある場合（例: `openapi.yaml`）はそちらを最優先とする。
> データ型は baseline の「データモデル」を参照。

## 例: [エンドポイント名]（API-01）

```
POST /[resource]
```

**リクエスト**:
```json
{
  "[field]": "[value]"
}
```

**レスポンス (201)**:
```json
{
  "id": "uuid",
  "[field]": "[value]"
}
```

## エラーレスポンス

- 400 Bad Request: [条件（バリデーション違反など）]
- 404 Not Found: [条件]
- 409 Conflict: [条件]
- 500 Internal Server Error: [条件]

> エラー分類・表示メッセージは `docs/specs/_shared/cross-cutting.md` の
> 「エラーハンドリング」と対応させる。ステータスコードの選定（422 か 400 か等）はこの場で確定させ、
> 「詳細設計で確定」のような曖昧な先送りを残さない。
