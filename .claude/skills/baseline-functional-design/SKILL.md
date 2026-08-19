---
name: baseline-functional-design
description: 機能設計書(docs/baseline/functional-design.md。データモデル・中核アルゴリズム・API/画面/ユースケースの一覧など、プロジェクトの指標としてぶれてはいけない重要点の正本。UI表示仕様・エラーハンドリング・テスト戦略などフェーズ横断の実装詳細は docs/specs/_shared/ に分割)を作成・更新するための詳細ガイドとテンプレート。PRDの要件を技術的にどう実現するかを設計する。機能設計書の作成・改訂時にのみ使用。画面/API/コンポーネントの実装詳細(docs/specs/2_basic-design/)は specs-basic-design スキルが担当。
allowed-tools: Read, Write
---

# 機能設計書作成スキル

このスキルは、高品質な機能設計書を作成するための詳細ガイドです。

## 前提条件

機能設計書作成を開始する前に、以下を確認してください:

### docs/baseline/product-requirements.md が作成されている

**必須**: PRDが以下の場所に存在する必要があります:

**ファイルパス**: `docs/baseline/product-requirements.md`

機能設計書は、PRDで定義された要件を技術的に実現する方法を詳細化します。

## 既存ドキュメントの優先順位

**重要**: `docs/baseline/functional-design.md`（プロジェクトの指標。フェーズ横断の実装詳細は
`docs/specs/_shared/` に分割）に既存の機能設計書がある場合、以下の優先順位に従ってください:

1. **既存の機能設計書 (`docs/baseline/functional-design.md` ＋ `docs/specs/_shared/`)** - 最優先
   - プロジェクト固有の設計が記載されている
   - このスキルのガイドより優先する

2. **このスキルのガイド** - 参考資料
   - 汎用的なテンプレートと例
   - 既存設計書がない場合、または補足として使用

**新規作成時**: このスキルのテンプレートとガイドを参照
**更新時**: 既存設計書の構造と内容を維持しながら更新

## 本スキルの範囲（specs-basic-design との役割分担）

本スキルが作るのは **`docs/baseline/functional-design.md`（重要点の正本）＋
`docs/specs/_shared/cross-cutting.md`（フェーズ横断の実装詳細）** まで。

**`docs/specs/2_basic-design/`**（各画面のレイアウト・API入出力詳細・レイヤー別インターフェース・
ユースケースのシーケンス図フルなど、この機能設計固有の実装詳細）は、本スキルの範囲**外**。
`docs/baseline/functional-design.md` の作成・更新が完了した後、**`specs-basic-design` スキル**を
別途使って作成する（baseline を正本として参照する別工程）。

理由: baseline（重要点の正本）と、それを実装レベルまで詳細化した specs/2_basic-design（基本設計工程の
実装詳細成果物）は、詰める内容の性質・タイミングが異なるため、別スキルとして分離している
（1スキルが両方を作ると責務が肥大化し、更新時にどちらの粒度で編集すべきか曖昧になる）。

## 出力先

```
docs/baseline/
└── functional-design.md          # 重要点の正本（下記「baseline に書く内容」）
docs/specs/_shared/
└── cross-cutting.md              # フェーズ横断で参照する実装詳細（UI表示仕様・エラーハンドリング・テスト戦略）
```

**baseline に書く内容（`functional-design.md`）**: システム構成図・技術スタック・データモデル
（**ER図・エンティティ・区分値等の概念モデルまで**。キー設計・正規化・削除方針などの論理設計の
判断は `docs/specs/3_detail-design/db/logical-data-model.md` へ、カラム定義・型・物理制約名・
索引名などの物理スキーマは `docs/specs/3_detail-design/db/table-definition.md` へ）・アルゴリズム設計
（中核ロジック）・API一覧（カタログ表）・画面設計（一覧＋遷移図）・ユースケース一覧（表）・
モジュール構成図。**記載漏れやあいまいな未確定事項（「詳細設計で確定」等の曖昧な先送り）を
残してはいけない。**

**`_shared/cross-cutting.md` に書く内容**: UI表示仕様、エラーハンドリング、パフォーマンス最適化、
セキュリティ考慮事項、テスト戦略など、特定フェーズに閉じずフェーズ横断で参照する実装レベルの記述。

> 分割の判断基準（迷ったときの原則）は `CLAUDE.md`「baseline と specs の使い分け」を参照。
> **既存の構成がある場合はそれを維持**し、新規セクションは適切なファイルへ追記する。
> プロジェクト規模が小さい場合は、`_shared` 側のファイルを作らず baseline の `functional-design.md`
> 1枚に集約してもよい。

## テンプレートの参照

テンプレートは `./templates/` 配下に用意している。新規作成時はすべて、個別ファイルの更新時は
該当スケルトンのみを参照する。

| 作成/更新するファイル | 参照するスケルトン |
|---|---|
| `docs/baseline/functional-design.md`（重要点の正本） | [`./templates/functional-design.md`](./templates/functional-design.md) |
| `docs/specs/_shared/cross-cutting.md` | [`./templates/cross-cutting.md`](./templates/cross-cutting.md) |

> `docs/specs/2_basic-design/` 配下（component-design.md・usecase.md・screen-design.md・
> api-design.md）のテンプレートは `specs-basic-design` スキル側にある。

> **ファイル単位の更新**: プロジェクト進行に伴い特定のファイルだけを更新する場合は、
> 対応するスケルトンの構成に沿って追記・修正する（全体を作り直す必要はない）。

## 詳細ガイド

さらに詳しい作成ガイドは次のファイルを参照してください: ./guide.md
