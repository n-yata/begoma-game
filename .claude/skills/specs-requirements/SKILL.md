---
name: specs-requirements
description: 要件定義工程の顧客提出成果物（docs/specs/1_requirements/ の要件定義書と非機能要件定義書）を作成・更新するための詳細ガイドとテンプレート。baseline の PRD/機能設計を正本として、FR/NFR を採番し顧客提出レベルに体系化する。要件定義工程の成果物の作成・改訂時にのみ使用。
allowed-tools: Read, Write
---

# 要件定義工程 成果物作成スキル

このスキルは、要件定義工程の**顧客提出成果物**を作成するための詳細ガイドです。
対象は `docs/specs/1_requirements/` に置く次の2ドキュメントです。

| 成果物 | パス | 役割 |
|---|---|---|
| 要件定義書 | `docs/specs/1_requirements/requirements-definition.md` | 機能要件（FR）を採番し体系化した顧客提出の主成果物 |
| 非機能要件定義書 | `docs/specs/1_requirements/non-functional-requirements.md` | 非機能要件（NFR）を IPA 非機能要求グレードの分類で体系化。測定方法まで付す |

## このスキルの位置づけ（baseline との違い）

`docs/baseline/`（PRD・機能設計書）は**このリポジトリの指標＝正本**であり、同時に顧客成果物の
エッセンスでもある。一方、本スキルが作る `docs/specs/1_requirements/` の2ドキュメントは、
**要件定義工程で顧客レビュー・承認を受ける正式な提出成果物**である。

- **正本（一次情報）は baseline 側**（数値目標・スコープ・データモデル・アルゴリズム）。
- **本成果物はそれを要件定義工程の提出物として体系化・詳細化**し、FR/NFR を採番して以降の工程
  （基本設計・詳細設計・テスト設計・実装・結合テスト）から追跡できるようにする。
- **齟齬が生じたら baseline を優先**する。同じ事実を二重管理しない（baseline にある数値は参照する）。

## 前提条件

作成を開始する前に、以下が存在することを確認してください。

- `docs/baseline/product-requirements.md`（PRD）— 要件・KPI・スコープの正本
- `docs/baseline/functional-design.md`（機能設計書）— データモデル・アルゴリズム・API/画面/UC 一覧の正本

これらが未作成の場合は、先に `baseline-prd` / `baseline-functional-design` スキルで作成する。

## 既存ドキュメントの優先順位

`docs/specs/1_requirements/` に既存の成果物がある場合、以下の優先順位に従ってください。

1. **既存の要件定義書・非機能要件定義書** — 最優先。プロジェクト固有の構造・採番を維持する。
2. **このスキルのテンプレートとガイド** — 参考資料。新規作成時、または補足として使用。

**新規作成時**: 本スキルのテンプレートとガイドを参照。
**更新時**: 既存成果物の構造・FR/NFR 採番を維持しながら更新する（採番済み ID を振り直さない）。

## 出力先

```
docs/specs/1_requirements/
├── requirements-definition.md        # 要件定義書（FR の正本）
└── non-functional-requirements.md    # 非機能要件定義書（NFR の正本）
```

## テンプレートの参照

テンプレートは `./templates/` 配下に用意している。新規作成時は両方、個別更新時は該当スケルトンのみを参照する。

| 作成/更新するファイル | 参照するスケルトン |
|---|---|
| `docs/specs/1_requirements/requirements-definition.md` | [`./templates/requirements-definition.md`](./templates/requirements-definition.md) |
| `docs/specs/1_requirements/non-functional-requirements.md` | [`./templates/non-functional-requirements.md`](./templates/non-functional-requirements.md) |

## 作成プロセス（要点）

1. **PRD と機能設計書を読む** — 要件・KPI・スコープ・データモデル・API/画面/UC 一覧を把握する。
2. **要件定義書を作る** — PRD の機能要件を FR-ID（FR-01…）で採番し、機能一覧＋機能詳細（受け入れ基準）
   に体系化する。中核ロジックの仕様は機能設計書を正本として参照し、重複記述しない。
3. **非機能要件定義書を作る** — PRD の非機能要件・KPI を NFR-ID（NFR-01…）で採番し、IPA 非機能要求
   グレードの大分類で整理する。各要件に**目標・基準＋測定方法**を付す。スコープ外観点は理由付きで明示する。
4. **要件定義書 §5 を別紙参照に整える** — 非機能要件の正本は非機能要件定義書側に置き、要件定義書
   本体は概要表＋参照リンクに留める（二重管理をしない）。
5. **1ファイルずつユーザーの承認を得る**（プロジェクト CLAUDE.md「ドキュメント作成時」ルール）。

> **小規模プロジェクトの簡略化**: 非機能要件がごく少量の場合は、独立文書を作らず要件定義書 §5 に
> NFR-ID 付きの表を直接置いてもよい。その判断はユーザーに確認する。

## 詳細ガイド

さらに詳しい作成手順・品質基準は次のファイルを参照してください: ./guide.md
