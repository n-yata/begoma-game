# 画面: {画面名} 結合テスト仕様書

> 対象画面の詳細設計は [`screen-{ID}-{slug}.md`](../3_detail-design/screen/screen-{ID}-{slug}.md)。
> 使用するAPIの詳細設計は {関連する `api-{ID}-{slug}.md` へのリンクを列挙}。
> テスト方針全体は [`cross-cutting.md`](../_shared/cross-cutting.md)「テスト戦略」を正本とする。
> 本書は**{画面名}が呼び出すAPI群を横断した結合テスト**（testcontainers-go + 実PostgreSQL必須）を、
> 画面操作の流れに沿ったシナリオ単位で列挙する。実DB不要のユニットテストは
> [`docs/specs/4_unit-test/`](../4_unit-test/) を参照。ブラウザ経由の真のE2E（Playwright）は
> `cross-cutting.md`「E2Eテスト」を参照（本書はAPI層までのシミュレーションに留め、実際のDOM操作は
> 検証しない）。

## テスト対象

| 画面 | 使用API | DBテーブル |
|---|---|---|
| {画面名}（{ComponentName}） | {`GET /xxx`（API-XX）等、画面が呼ぶAPIを列挙} | {関連テーブルを列挙} |

## テストケース一覧

| No | シナリオ | 操作の流れ | 期待結果 | 完了 |
|---|---|---|---|:--:|
| 1 | {画面操作の観点} | {実DBへの前提投入 → API呼び出しの順序} | {実データに基づく具体的な期待結果} | [ ] |

## 備考

- {実DBでなければ検証できない理由（制約・カスケード・実SQLの正しさ・複数APIを跨ぐ整合性等）を明記する}
- 対応するユニットテスト仕様書（`docs/specs/4_unit-test/test-api-{ID}-{slug}.md` 等）で
  検証済みのロジックは重複させず、「実データ・実DBと組み合わせても正しく動くか」に焦点を絞る。
- 未実装の場合は「未実装（testcontainers-go導入時に実装予定）」と明記する。
