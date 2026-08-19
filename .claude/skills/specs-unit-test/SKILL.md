---
name: specs-unit-test
description: 単体テスト仕様書(docs/specs/4_unit-test/ のAPI/画面ごとの実DB不要なテストケース一覧)を作成・更新するための詳細ガイドとテンプレート。specs-detail-designのAPI/画面詳細設計とbaseline/cross-cutting.mdのテスト戦略を正本として、Domain/Service/Handler層(またはコンポーネント)の具体的な入力値・期待結果を列挙する。単体テスト仕様書の作成・改訂時にのみ使用。
allowed-tools: Read, Write
---

# 単体テスト仕様書 作成スキル

このスキルは、API/画面それぞれの**実DB不要なユニットテスト**のテストケース一覧
（`docs/specs/4_unit-test/` 配下）を作成するための詳細ガイドです。

| 成果物 | パス | 役割 |
|---|---|---|
| API単体テスト仕様書 | `docs/specs/4_unit-test/test-api-{ID}-{slug}.md`（API1件=1ファイル） | 当該APIのDomain/Service/Handler層の具体的なテストケース一覧（前提・入力・期待結果・完了チェック欄） |
| 画面単体テスト仕様書 | `docs/specs/4_unit-test/test-screen-{ID}-{slug}.md`（画面1件=1ファイル） | 当該画面のコンポーネント単位の具体的なテストケース一覧 |

## このスキルの位置づけ

- `docs/specs/3_detail-design/`（`specs-detail-design` スキル）のAPI/画面詳細設計書が、
  各テストケースが検証すべき仕様（バリデーション制約・処理概要・レイアウト等）の正本。
  本スキルはそれを**実DB不要な具体的テストケース**まで落とし込む。
- テストの種類・使用フレームワーク・対象レイヤーの方針は
  `docs/specs/_shared/cross-cutting.md`「テスト戦略」が正本。
- **実PostgreSQLを要する結合テスト（Repository層の永続化・制約検証、複数API/画面を横断する
  シナリオ）はこのスキルの対象外**。`docs/specs/5_integration-test/`
  （`specs-integration-test` スキル）が担当する。判断基準:
  - Domain層の純粋関数、Service層をフェイクRepository/フェイクServiceでテストできるケース、
    Handler層をhttptest＋フェイクServiceでテストできるケース、フロントのコンポーネントを
    APIモック＋Testing Libraryでテストできるケース → 本スキル（ユニット）。
  - Repository層の実クエリ・DB制約（UNIQUE・CHECK・外部キー）・実データの永続化を検証する
    ケース、画面操作からAPI・DBまでを結合して検証するシナリオ → `specs-integration-test`。

## 前提条件

作成を開始する前に、以下が存在することを確認してください。

- `docs/specs/3_detail-design/api/api-{ID}-{slug}.md`・`screen/screen-{ID}-{slug}.md` —
  対象API/画面の詳細設計（本成果物の直接の入力）
- `docs/specs/_shared/cross-cutting.md` — テスト戦略の正本

未作成の場合は、先に `specs-detail-design` スキルで作成する。

## 既存ドキュメントの優先順位

`docs/specs/4_unit-test/` に既存の成果物がある場合、以下の優先順位に従ってください。

1. **既存のファイル群** — 最優先。プロジェクト固有の命名・粒度を維持する。
2. **このスキルのテンプレートとガイド** — 参考資料。新規作成時、または補足として使用。

## 出力先

```
docs/specs/4_unit-test/
├── test-api-{ID}-{slug}.md       # api/ と1対1対応する単体テスト仕様書（実DB不要）
└── test-screen-{ID}-{slug}.md    # screen/ と1対1対応する単体テスト仕様書（実API不要）
```

## テンプレートの参照

| 作成/更新するファイル | 参照するスケルトン |
|---|---|
| `docs/specs/4_unit-test/test-api-{ID}-{slug}.md` | [`./templates/test-api.md`](./templates/test-api.md) |
| `docs/specs/4_unit-test/test-screen-{ID}-{slug}.md` | [`./templates/test-screen.md`](./templates/test-screen.md) |

## 作成プロセス（要点）

1. 対応する `docs/specs/3_detail-design/api/`・`screen/` ファイルと
   `docs/specs/_shared/cross-cutting.md`「テスト戦略」を読む。
2. テスト対象（レイヤー・関数名／コンポーネント名・テスト種別）を表にする。**「統合テスト」は
   記載しない**（該当ケースは `specs-integration-test` 側に書く）。
3. テストケース一覧を書く。**具体的な入力値と期待結果を書く**（「正しく動作すること」のような
   曖昧な記述は禁止。プロジェクトCLAUDE.mdの「テストコード作成時の注意事項」に準拠）。
   境界値・異常系を必ず含める。
4. 各テストケース行に「完了」チェック欄（`[ ]`）を付ける。実施後に `[x]` へ手動で書き換えて
   進捗管理する。
5. Domain層など複数API/画面から参照される中核アルゴリズムのテストケースは、最初に参照する
   API/画面のファイルにまとめ、他ファイルからは「〜を参照」で重複を避ける。
6. 実DBが必要なケースを見つけたら、このファイルには書かず、対応する画面の結合テスト仕様書
   （`docs/specs/5_integration-test/test-integration-{screen-slug}.md`）に回す。ケース番号は
   通し番号を維持し、両ファイル間に相互参照リンクを付ける。

### 共通
- **1ファイルずつユーザーの承認を得る**（プロジェクト CLAUDE.md「ドキュメント作成時」ルール）。
  ただし大量の同種ファイルを作る場合は、先にテンプレート・記載粒度をユーザーと合意してから
  一括作成し、まとめてレビューを受ける運用でもよい。

## 詳細ガイド

網羅すべき観点・禁止事項・品質チェックリストは次のファイルを参照してください: ./guide.md
