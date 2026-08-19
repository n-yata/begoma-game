---
name: specs-detail-design
description: 詳細設計工程の成果物(docs/specs/3_detail-design/ のテーブル定義書・API詳細設計書・画面詳細設計書)を作成・更新するための詳細ガイドとテンプレート。baseline の機能設計書と2_basic-designの実装詳細を正本として、物理レベル・API単位・画面単位まで詳細化する。詳細設計工程の成果物の作成・改訂時にのみ使用。テストケース仕様書は specs-unit-test / specs-integration-test スキルが担当。
allowed-tools: Read, Write
---

# 詳細設計工程 成果物作成スキル

このスキルは、詳細設計工程の成果物（`docs/specs/3_detail-design/` 配下）を作成するための詳細ガイドです。
`db/` `api/` `screen/` の3区分で構成する。テストケース仕様書（単体・結合）は工程が異なるため、
それぞれ `specs-unit-test`・`specs-integration-test` スキルが担当する
（`docs/specs/4_unit-test/`・`docs/specs/5_integration-test/`）。

| 成果物             | パス                                                                         | 役割                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| テーブル定義書     | `docs/specs/3_detail-design/db/table-definition.md`                          | 物理スキーマ（カラム定義・型・NULL可否・デフォルト・物理制約名・索引名）と設計メモ                                                                    |
| 論理データモデル書 | `docs/specs/3_detail-design/db/logical-data-model.md`                        | **本スキルの対象外**（`flow-design-database` スキルが担当）。概念モデルと物理スキーマの間の判断（キー設計・正規化・削除方針・区分値の表現）とその理由 |
| API詳細設計書      | `docs/specs/3_detail-design/api/api-{ID}-{slug}.md`(API1件=1ファイル)        | 当該APIのリクエスト/レスポンス仕様(型・必須・制約・バリデーション)・処理概要(レイヤー別フロー)・テスト観点                                            |
| 画面詳細設計書     | `docs/specs/3_detail-design/screen/screen-{ID}-{slug}.md`(画面1件=1ファイル) | 当該画面のコンポーネント構成(props/state)・状態管理(クエリキー設計)・詳細な画面遷移/イベント処理フロー・例外表示                                      |

## このスキルの位置づけ（baseline / 2_basic-design / テスト工程との違い）

- `docs/baseline/functional-design.md` は**このリポジトリの指標＝正本**。エンティティ・区分値・
  ER図（概念モデル）、API一覧・画面一覧（ID・名称・概要のカタログ）、中核アルゴリズムを持つ。
- `docs/specs/2_basic-design/` は baseline のカタログを**実装レベルまで詳細化**したもの
  （全APIまとめて `api-design.md`、全画面まとめて `screen-design.md` の1ファイルずつ）。
- 本スキルが作る `docs/specs/3_detail-design/` は、**API/画面を1件ずつ独立したファイルに分割**し、
  さらに実装直前の粒度（バリデーション制約の全項目・コンポーネントのprops/state）まで踏み込む。
  `db/` はデータモデルの物理スキーマを同様に詳細化する。
- ただし `db/` の**論理設計**（キー設計・正規化・関連の解決・区分値の表現方法・削除/履歴方針・
  個人情報の識別・命名規約といった**判断とその理由**）は本スキルの対象外。同じ `db/` ディレクトリの
  `logical-data-model.md` として `flow-design-database` スキルが担当する。本スキルはその判断を
  **物理へ落とす**役割であり、判断の理由を設計メモに再掲しない。
- 具体的なテストケース一覧（単体テスト仕様書・結合テスト仕様書）は本スキルの対象外。
  `docs/specs/4_unit-test/`・`docs/specs/5_integration-test/` として別工程・別スキルが担当する
  （`specs-unit-test`・`specs-integration-test`）。本スキルの各ファイル「テスト観点」は
  見出しレベルの概要に留め、詳細なケース一覧はそちらに委譲する。

正本の順序: **baseline（概念・カタログ）→ 2_basic-design（API/画面まとめた実装詳細）→
3_detail-design（API/画面単位・物理単位の最終詳細）→ 4_unit-test/5_integration-test
（テストケース単位の詳細）**。齟齬が生じたら上位（baseline側）を優先し、本成果物で
概念・カタログを再定義しない。

データモデルに限っては、`3_detail-design/db/` の中でさらに
**`logical-data-model.md`（論理＝判断と理由）→ `table-definition.md`（物理＝型・制約・索引）**
の順になる。テーブル・カラムを追加・変更するときは、**概念（baseline）→ 論理 → 物理**の順で
更新すること（物理だけを直して上流を置き去りにしない）。

## 前提条件

作成を開始する前に、以下が存在することを確認してください。

- `docs/baseline/functional-design.md`（機能設計書）— エンティティ・区分値・ER図・API一覧・画面一覧・
  中核アルゴリズムの正本
- `docs/specs/2_basic-design/api-design.md`・`screen-design.md`・`component-design.md` — API/画面の
  実装詳細（本成果物はこれをAPI/画面単位に分割・詳細化する）
- `db/table-definition.md` を作る場合のみ: `docs/specs/3_detail-design/db/logical-data-model.md`
  （論理データモデル書）— キー設計・正規化・関連の解決・区分値の表現方法・削除/履歴方針・
  命名規約の正本

未作成の場合は、先に `baseline-functional-design` → `specs-basic-design` スキルで作成する。
論理データモデル書が未作成の場合は `flow-design-database` スキル（`/flow-design-database`）の
フェーズ2で作成する。**論理設計を飛ばして物理スキーマを起こすと、キー方式や削除方針の判断が
テーブル定義書の設計メモに埋もれる**ため、先に論理を確定させること。

## 既存ドキュメントの優先順位

`docs/specs/3_detail-design/` に既存の成果物がある場合、以下の優先順位に従ってください。

1. **既存のファイル群** — 最優先。プロジェクト固有の命名・粒度を維持する。
2. **このスキルのテンプレートとガイド** — 参考資料。新規作成時、または補足として使用。

**新規作成時**: 本スキルのテンプレートとガイドを参照。
**更新時**: 既存ファイルの構造・命名規則を維持しながら更新する。API/画面は新規追加分のみ
ファイルを追加すればよく、既存ファイル群を作り直す必要はない。

## 出力先

```
docs/specs/3_detail-design/
├── db/
│   ├── logical-data-model.md        # 論理設計（判断と理由）※flow-design-database スキルの担当
│   └── table-definition.md          # 物理スキーマ（カラム定義・型・制約・索引）＋設計メモ
├── api/
│   └── api-{ID}-{slug}.md            # API 1件ごとの詳細設計（baseline の API一覧の ID と対応）
└── screen/
    └── screen-{ID}-{slug}.md         # 画面 1件ごとの詳細設計（baseline の画面一覧の名称と対応）
```

ファイル名の `{ID}` は baseline の API一覧（`API-01`等）・画面一覧の並び順に対応させる。
`{slug}` は内容が分かる英語スラッグ（例: `api-02-habits-create.md`、`screen-01-dashboard.md`）。

## テンプレートの参照

| 作成/更新するファイル                                     | 参照するスケルトン                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/specs/3_detail-design/db/table-definition.md`       | [`./templates/table-definition.md`](./templates/table-definition.md) |
| `docs/specs/3_detail-design/api/api-{ID}-{slug}.md`       | [`./templates/api-detail.md`](./templates/api-detail.md)             |
| `docs/specs/3_detail-design/screen/screen-{ID}-{slug}.md` | [`./templates/screen-detail.md`](./templates/screen-detail.md)       |

## 作成プロセス（要点）

### db/（テーブル定義書）

1. baseline の機能設計書「データモデル」を読み、エンティティ・区分値・ER図・ドメイン上の制約を把握する。
2. `db/logical-data-model.md`（論理データモデル書）を読み、属性・キー設計・正規化・関連の解決・
   区分値の表現方法・削除/履歴方針・命名規約を把握する。**これらは確定済みの入力**であり、
   ここで決め直さない。
3. テーブルごとにカラム定義表（物理名・論理名・型・NULL可否・デフォルト・説明）を書く。
4. 制約・インデックスを物理名付きで列挙する。索引は「どのクエリのため」を根拠付きで決める。
5. 設計メモ（確定事項）を書く。「詳細設計で確定」のような先送りをここに残さない。
   **論理設計の判断（キー方式の理由・正規化の崩し方・削除方針）は再掲しない**
   （正本は `logical-data-model.md`）。ここに書くのは物理的な実装判断のみ。

### api/（API詳細設計書、API単位）

1. `docs/specs/2_basic-design/api-design.md` の該当API概要と、baseline「API一覧」のIDを読む。
2. リクエスト仕様（全パラメータの型・必須・制約・バリデーションルール）を表にする。
3. レスポンス仕様（成功時全フィールド・エラー時のステータス別レスポンス例）を書く。
4. 処理概要（Handler→Service→Domain/Repositoryの処理フロー、呼び出す関数名）を箇条書きにする。
5. テスト観点（正常系・異常系・境界値の概要）を書く。**具体的な入力値・期待結果の一覧は
   `docs/specs/4_unit-test/`・`5_integration-test/`（`specs-unit-test`・`specs-integration-test`
   スキル）に委譲**し、ここでは重複させない。

### screen/（画面詳細設計書、画面単位）

1. `docs/specs/2_basic-design/screen-design.md` の該当画面レイアウト・項目・イベントと、
   `component-design.md` のフロントエンド責務を読む。
2. コンポーネント構成（ツリー）とprops/state設計を書く。screen-design.mdの「詳細設計への申し送り」
   で委譲されているコンポーネント分割・状態管理（TanStack Queryのキー設計等）はここで確定させる。
3. 画面遷移・イベント処理の詳細フロー（操作→API呼び出し・状態更新の手順）を書く。
4. 例外・エラー表示のケースを書く。

### 共通

- **1ファイルずつユーザーの承認を得る**（プロジェクト CLAUDE.md「ドキュメント作成時」ルール）。
  ただし db/api/screen のように大量の同種ファイルを作る場合は、先にテンプレート・記載粒度を
  ユーザーと合意してから一括作成し、まとめてレビューを受ける運用でもよい（実運用ではこの合意形成
  ステップが重要）。
- 相対リンクのパス階層に注意する（`3_detail-design/api/*.md` から baseline へは `../../../baseline/...`、
  `2_basic-design/` へは `../../2_basic-design/...`）。

> **小規模プロジェクトの簡略化**: API数・画面数が少ない場合は、api/screenをAPI/画面単位に
> 分割せず、2_basic-designの4ファイルにテスト観点を書き足すだけで済ませてもよい
> （`specs-basic-design` スキルの判断に委ねる）。

## 詳細ガイド

さらに詳しい作成手順・品質基準は次のファイルを参照してください: ./guide.md
