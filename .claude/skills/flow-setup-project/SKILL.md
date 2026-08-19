---
name: flow-setup-project
description: 初回セットアップのワークフロー。docs/baseline/ideas/ を入力に、6つの永続ドキュメント(PRD・機能設計・アーキテクチャ・リポジトリ構造・開発ガイドライン・用語集)を baseline-* スキルを順に使って対話的に作成する。プロジェクトの初期立ち上げ・永続ドキュメント一式の新規作成時に使用する。
allowed-tools: Read, Write, Edit, Glob, Bash, Skill
---

# 初回プロジェクトセットアップ

このスキルは、プロジェクトの6つの永続ドキュメントを対話的に作成します。

## 実行前の確認

`docs/baseline/ideas/` ディレクトリ内のファイルを確認します。
```bash
# 確認
ls docs/baseline/ideas/

# ファイルが存在する場合
✅ docs/baseline/ideas/initial-requirements.md が見つかりました
   この内容を元にPRDを作成します

# ファイルが存在しない場合
⚠️  docs/baseline/ideas/ にファイルがありません
   対話形式でPRDを作成します
```

## 手順

### ステップ0: インプットの読み込み

1. `docs/baseline/ideas/` 内のマークダウンファイルを全て読む
2. 内容を理解し、PRD作成の参考にする

### ステップ1: プロダクト要求定義書の作成

1. **baseline-prdスキル**をロード
2. `docs/baseline/ideas/`の内容を元に`docs/baseline/product-requirements.md`を作成
3. 壁打ちで出たアイデアを具体化：
   - 詳細なユーザーストーリー
   - 受け入れ条件
   - 非機能要件
   - 成功指標
4. ユーザーに確認を求め、**承認されるまで待機**

**以降のステップはプロダクト要求定義書の内容を元にするため、自動的に作成する**

### ステップ2: 機能設計書の作成

1. **baseline-functional-designスキル**をロード
2. `docs/baseline/product-requirements.md`を読む
3. スキルのテンプレートとガイドに従って`docs/baseline/functional-design.md`
   （データモデル〔概念モデル：エンティティ・区分値・ER図〕・中核アルゴリズム・API/画面/
   ユースケースの一覧・モジュール構成図など、プロジェクトの指標としてぶれてはいけない重要点の
   正本）を作成。UI表示仕様/エラーハンドリング/テスト戦略などフェーズ横断の実装詳細は
   `docs/specs/_shared/` に分割する
4. `docs/specs/2_basic-design/`（各画面/API/コンポーネントの実装詳細）と
   `docs/specs/3_detail-design/`（論理データモデル書・テーブル定義書・API/画面詳細設計書）は
   この初回セットアップでは作成しない。実装レベルまで詳細化したくなったタイミングで、別途
   **specs-basic-designスキル**／**specs-detail-designスキル**
   （`/`で明示起動、または該当する会話で自動ロード）を使う。
   データモデルをゼロから設計する場合は、**`/flow-design-database`**（概念→論理→物理を通す
   ワークフロー入口）を使うとフェーズごとの委譲先が示される

### ステップ3: アーキテクチャ設計書の作成

1. **baseline-architecture-designスキル**をロード
2. 既存のドキュメントを読む
3. スキルのテンプレートとガイドに従って`docs/baseline/architecture.md`を作成

### ステップ4: リポジトリ構造定義書の作成

1. **baseline-repository-structureスキル**をロード
2. 既存のドキュメントを読む
3. スキルのテンプレートに従って`docs/baseline/repository-structure.md`を作成

### ステップ5: 開発ガイドラインの作成

1. **baseline-development-guidelinesスキル**をロード
2. 既存のドキュメントを読む
3. スキルのテンプレートに従って`docs/baseline/development-guidelines.md`を作成

### ステップ6: 用語集の作成

1. **baseline-glossaryスキル**をロード
2. 既存のドキュメントを読む
3. スキルのテンプレートに従って`docs/baseline/glossary.md`を作成

## 完了条件

- 6つの永続ドキュメントが全て作成されていること

完了時のメッセージ:
```
「初回セットアップが完了しました!

作成したドキュメント:
✅ docs/baseline/product-requirements.md
✅ docs/baseline/functional-design.md（重要点の正本。フェーズ横断の実装詳細は docs/specs/_shared/ に分割）
✅ docs/baseline/architecture.md
✅ docs/baseline/repository-structure.md
✅ docs/baseline/development-guidelines.md
✅ docs/baseline/glossary.md

これで開発を開始する準備が整いました。

今後の使い方:
- ドキュメントの編集: 普通に会話で依頼してください
  例: 「PRDに新機能を追加して」「architecture.mdを見直して」

- 機能の追加: /flow-add-feature [機能名] を実行してください
  例: /flow-add-feature ユーザー認証

- 基本設計の実装詳細（画面/API/コンポーネント）を詰めたい場合: specs-basic-design スキルを使って
  ください（`docs/specs/2_basic-design/` を作成）

- データモデル（テーブル）をゼロから設計したい場合: /flow-design-database を実行してください
  （概念設計 → 論理設計 → 物理設計 → 検証 → 実装への申し送り を順に進めます）

- ドキュメントレビュー: /flow-review-docs [パス] を実行してください
  例: /flow-review-docs docs/baseline/product-requirements.md
」
```
