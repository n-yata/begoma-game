---
name: specs-integration-test
description: 結合テスト仕様書(docs/specs/5_integration-test/ の画面単位の実DB必須テストケース一覧)を作成・更新するための詳細ガイドとテンプレート。画面が呼び出すAPI群とDBを横断したシナリオを、画面単位(APIごとではない)にまとめる。specs-detail-designのAPI/画面詳細設計とbaseline/cross-cutting.mdのテスト戦略を正本とする。結合テスト仕様書の作成・改訂時にのみ使用。
allowed-tools: Read, Write
---

# 結合テスト仕様書 作成スキル

このスキルは、**画面が呼び出すAPI群とDBを横断した結合テスト**（testcontainers-go + 実PostgreSQL
必須）のテストケース一覧（`docs/specs/5_integration-test/` 配下）を作成するための詳細ガイドです。

| 成果物 | パス | 役割 |
|---|---|---|
| 結合テスト仕様書 | `docs/specs/5_integration-test/test-integration-{screen-slug}.md`（**画面1件=1ファイル**） | 当該画面が呼び出すAPI群を横断し、画面操作の流れに沿ったシナリオ単位で実DB込みのテストケースを列挙する |

## 重要: ファイル分割の単位は「画面」であり「API」ではない

結合テストは、画面が複数のAPIを呼び出して一連の操作を完結させる流れ（例: 習慣を登録→一覧に反映
→編集→アーカイブ）を検証するのが目的。API単位に分割すると、この横断的な流れが表現できず
（各APIが独立したファイルに閉じてしまい）、画面の実際の利用シナリオを見失う。
そのため**本スキルは baseline「画面設計」の画面一覧（1画面=1ファイル）を単位とする**
（`specs-unit-test` の `test-api-{ID}-{slug}.md` のようにAPI単位には分割しない）。

## このスキルの位置づけ

- `docs/baseline/functional-design.md`「画面設計」「モジュール構成図」— 画面とAPIの対応関係の正本
  （画面が呼ぶAPI一覧はここから読み取る）。
- `docs/specs/3_detail-design/screen/screen-{ID}-{slug}.md`・`api/api-{ID}-{slug}.md` — 画面・APIの
  詳細設計（各テストケースが検証すべき仕様の正本）。
- `docs/specs/_shared/cross-cutting.md`「テスト戦略」— テスト種別（ユニット/統合/E2E）の全体像の正本。
- **実DB不要なユニットテスト（Domain純粋関数、フェイクRepository/フェイクServiceでのService/Handler
  テスト）は本スキルの対象外**。`docs/specs/4_unit-test/`（`specs-unit-test` スキル）が担当する。
- **ブラウザを使った真のE2E（Playwright、実際のDOM操作・視覚的な表示確認）も本スキルの対象外**。
  `cross-cutting.md`「E2Eテスト」が担当する（別途Playwrightの結合テストスイートとして実装）。
  本スキルはAPI層までのシミュレーション（Handler→Service→Repository→実DB）に留め、実際のブラウザ・
  DOMは扱わない。

判断基準（あるテストケースが本スキルの対象か）:
- Repository層の実クエリ・DB制約（UNIQUE・CHECK・外部キー）・実データの永続化を検証する → 対象。
- 複数テーブルを跨ぐ整合性確認（例: アーカイブ後も関連レコードが残る）→ 対象。
- 画面が複数APIを順番に呼び出す一連の操作フロー（実DBの状態変化を伴う）→ 対象。
- フェイク/モックで代替できるロジック検証 → 対象外（`specs-unit-test` へ）。
- 実ブラウザでのDOM操作・表示確認 → 対象外（Playwright E2Eへ）。

## 前提条件

作成を開始する前に、以下が存在することを確認してください。

- `docs/baseline/functional-design.md`「画面設計」「モジュール構成図」— 画面とAPIの対応
- `docs/specs/3_detail-design/screen/`・`api/` — 対象画面・関連APIの詳細設計
- `docs/specs/4_unit-test/` — 対応するユニットテスト仕様書（重複を避けるため、先に何が
  ユニットテストで検証済みかを確認する）
- `docs/specs/_shared/cross-cutting.md` — テスト戦略の正本

## 出力先

```
docs/specs/5_integration-test/
└── test-integration-{screen-slug}.md   # baseline「画面設計」の画面一覧と対応（画面1件=1ファイル）
```

`{screen-slug}` は画面名が分かる英語スラッグ（例: `test-integration-habits.md`＝習慣管理画面、
`test-integration-dashboard.md`＝ダッシュボード画面）。baseline「画面設計」の画面一覧の並び順・
名称と対応させる。

## テンプレートの参照

| 作成/更新するファイル | 参照するスケルトン |
|---|---|
| `docs/specs/5_integration-test/test-integration-{screen-slug}.md` | [`./templates/test-integration.md`](./templates/test-integration.md) |

## 作成プロセス（要点）

1. baseline「画面設計」の画面一覧・モジュール構成図から、対象画面が呼び出すAPI一覧を確認する。
2. 対応する `docs/specs/4_unit-test/test-api-{ID}-{slug}.md` を確認し、**ユニットテストで
   既に検証済みのロジック（バリデーション・分岐条件等）は重複させない**。本書では「実データ・
   実DBと組み合わせても正しく動くか」に焦点を絞る。
3. テスト対象表（画面・使用API・DBテーブル）を書く。
4. テストケース一覧を、**画面操作の流れ（シナリオ）単位**で書く。1ケースが複数APIの呼び出しを
   含んでよい（例: 「登録→一覧反映」で `POST` と `GET` の両方を1行に書く）。
   具体的な入力値・実DBの前提状態・期待結果を書く（曖昧な記述禁止、プロジェクトCLAUDE.md
   「テストコード作成時の注意事項」準拠）。
5. Repository層の実制約（UNIQUE・CHECK・カスケード）を検証するケースを必ず含める。
6. 各テストケース行に「完了」チェック欄（`[ ]`）を付ける。
7. 対応する `4_unit-test/` 側のファイルに、本書への参照リンク（「実PostgreSQLを要する結合テストの
   ケースは画面単位の `test-integration-{screen-slug}.md` を参照」）を追記する。

### 共通
- **1ファイルずつユーザーの承認を得る**（プロジェクト CLAUDE.md「ドキュメント作成時」ルール）。
- 未実装の間は各テストケースに「未実装（testcontainers-go導入時に実装予定）」と備考に明記する。

## 詳細ガイド

品質チェックリストは次のファイルを参照してください: ./guide.md
