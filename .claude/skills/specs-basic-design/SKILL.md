---
name: specs-basic-design
description: 基本設計工程の実装詳細(docs/specs/2_basic-design/ のコンポーネント設計・ユースケースのシーケンス図・画面設計・API設計)を作成・更新するための詳細ガイドとテンプレート。baseline の機能設計書を正本として、レイヤー別インターフェース・画面のレイアウト/項目/イベント・APIの入出力を実装レベルまで詳細化する。基本設計工程の実装詳細の作成・改訂時にのみ使用。
allowed-tools: Read, Write
---

# 基本設計工程 実装詳細作成スキル

このスキルは、基本設計工程の**実装詳細**（`docs/specs/2_basic-design/` 配下の4ファイル）を
作成するための詳細ガイドです。

| 成果物 | パス | 役割 |
|---|---|---|
| コンポーネント設計 | `docs/specs/2_basic-design/component-design.md` | レイヤー別（Handler/Service/Domain/Repository/Frontend 等）の責務・インターフェース（擬似コード）・依存関係の詳細 |
| ユースケース図 | `docs/specs/2_basic-design/usecase.md` | 各ユースケースのレイヤー横断シーケンス図フル |
| 画面設計 | `docs/specs/2_basic-design/screen-design.md` | 各画面のレイアウト（ワイヤーフレーム）・画面項目定義・画面イベント |
| API設計 | `docs/specs/2_basic-design/api-design.md` | 各APIの入出力詳細・リクエスト/レスポンス例・エラーレスポンス |

## このスキルの位置づけ（baseline-functional-design との違い）

`docs/baseline/functional-design.md` は**このリポジトリの指標＝正本**で、システム構成図・
データモデル・中核アルゴリズム・**API一覧／画面一覧／ユースケース一覧（カタログ表）**・
モジュール構成図を持つ。これは `baseline-functional-design` スキルが作る。

本スキルが作る `docs/specs/2_basic-design/` の4ファイルは、baseline のカタログ表（ID・名前・概要）を
**実装レベルまで詳細化**したもの。両者の役割は明確に分かれる。

- **正本（一次情報）は baseline 側**（API/画面/UC の ID・名称・データモデル・アルゴリズム仕様）。
- **本成果物はそれを実装詳細として肉付け**する（JSON入出力例・擬似インターフェース・シーケンス図・
  画面レイアウト）。**必要な時にだけ参照すればよい実装レベルの記述**であり、baseline には書かない。
- **齟齬が生じたら baseline を優先**する。ID・名称・データ型は baseline を参照し、ここで再定義しない。

## 前提条件

作成を開始する前に、以下が存在することを確認してください。

- `docs/baseline/functional-design.md`（機能設計書）— システム構成・データモデル・アルゴリズム・
  API一覧・画面設計（一覧＋遷移図）・ユースケース一覧・モジュール構成図の正本

未作成の場合は、先に `baseline-functional-design` スキルで作成する。

## 既存ドキュメントの優先順位

`docs/specs/2_basic-design/` に既存の成果物がある場合、以下の優先順位に従ってください。

1. **既存の4ファイル** — 最優先。プロジェクト固有の設計・命名を維持する。
2. **このスキルのテンプレートとガイド** — 参考資料。新規作成時、または補足として使用。

**新規作成時**: 本スキルのテンプレートとガイドを参照。
**更新時**: 既存ファイルの構造を維持しながら更新する（baseline の ID 採番とは独立に、ファイル内の
記述順は既存構成を尊重する）。

## 出力先

```
docs/specs/2_basic-design/
├── component-design.md    # レイヤー別インターフェース詳細
├── usecase.md              # ユースケースのシーケンス図フル
├── screen-design.md        # 各画面のレイアウト・画面項目定義・画面イベント
└── api-design.md           # 各APIの入出力詳細・JSON例・エラーレスポンス
```

## テンプレートの参照

テンプレートは `./templates/` 配下に用意している。新規作成時はすべて、個別ファイルの更新時は
該当スケルトンのみを参照する。

| 作成/更新するファイル | 参照するスケルトン |
|---|---|
| `docs/specs/2_basic-design/component-design.md` | [`./templates/component-design.md`](./templates/component-design.md) |
| `docs/specs/2_basic-design/usecase.md` | [`./templates/usecase.md`](./templates/usecase.md) |
| `docs/specs/2_basic-design/screen-design.md` | [`./templates/screen-design.md`](./templates/screen-design.md) |
| `docs/specs/2_basic-design/api-design.md` | [`./templates/api-design.md`](./templates/api-design.md) |

> **ファイル単位の更新**: baseline の API一覧／画面一覧／ユースケース一覧に ID を追加・変更したら、
> 対応するファイルだけを追随させる（全体を作り直す必要はない）。

## 作成プロセス（要点）

1. **baseline の機能設計書を読む** — API一覧・画面設計（一覧＋遷移図）・ユースケース一覧・
   モジュール構成図・データモデル・アルゴリズム設計を把握する。ID（API-xx／UC-xx／画面名）を
   本成果物の見出しに対応させる。
2. **component-design.md を作る** — レイヤーごとに責務・擬似インターフェース・依存関係（依存可能／
   依存禁止）を記述する。外部依存を持たない層（ドメインロジック等）は「外部依存なし」を明記し、
   テスト容易性の担保先であることを示す。
3. **usecase.md を作る** — baseline の UC-ID ごとに、レイヤー横断のシーケンス図（mermaid）を書く。
   一覧表（ID・アクター・目的）は再掲せず baseline を参照する。
4. **screen-design.md を作る** — baseline の画面一覧の画面ごとに、レイアウト（ASCII ワイヤーフレーム）・
   画面項目定義（項目・種別・必須・初期値/取得元・入力チェック）・画面イベント（操作→API/遷移）を書く。
5. **api-design.md を作る** — baseline の API一覧の ID ごとに、入出力概要・リクエスト/レスポンス例・
   エラーレスポンスを書く。契約の正本（`openapi.yaml` 等）がある場合はそちらを最優先とし、本書は
   「主要な入出力の要約」に留める。
6. **1ファイルずつユーザーの承認を得る**（プロジェクト CLAUDE.md「ドキュメント作成時」ルール）。

> **小規模プロジェクトの簡略化**: プロジェクト規模が小さい場合は、この4ファイルを作らず
> baseline の `functional-design.md` 1枚に集約してもよい（`baseline-functional-design` スキルの
> 判断に委ねる）。

## 詳細ガイド

さらに詳しい作成手順・品質基準は次のファイルを参照してください: ./guide.md
