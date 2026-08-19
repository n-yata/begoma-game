# 機能設計書作成ガイド

このガイドは、プロダクト要求定義書(PRD)に基づいて機能設計書（baseline の重要点の正本＋
フェーズ横断の実装詳細）を作成するための実践的な指針を提供します。

> **成果物の配置**: 機能設計書は **`docs/baseline/functional-design.md`（プロジェクトの指標として
> ぶれてはいけない重要点の正本）＋ `docs/specs/_shared/cross-cutting.md`（フェーズ横断の実装詳細）**
> の2箇所で構成する。どのセクションをどちらに書くか、および各ファイルのスケルトンは
> `SKILL.md`「テンプレートの参照」と `templates/` を参照。本ガイドの各セクションの解説（下記）は、
> その中身を書くための手法。
>
> **`docs/specs/2_basic-design/`**（各画面のレイアウト・API入出力詳細・レイヤー別インターフェース・
> ユースケースのシーケンス図フルなど、この機能設計固有の実装詳細）は本スキルの範囲外。
> baseline の作成・更新が完了したら、**`specs-basic-design` スキル**を別途使って作成する。

### 本ガイドのステップと配置先の対応

本ガイドの各ステップで作った内容は、以下に配置する（正本の対応は `SKILL.md`「テンプレートの参照」）。
**baseline は重要点（一覧・カタログ・正本表・中核ロジック）のみ。各画面/API/コンポーネントの実装詳細
（JSON例・擬似インターフェース・シーケンス図フル・画面レイアウト）は `specs-basic-design` スキルへ。**

| 本ガイドのステップ | 配置先 |
|---|---|
| ステップ2 システム構成図／技術スタック | `docs/baseline/functional-design.md` |
| ステップ3 データモデル（エンティティ・区分値・ER図の概念モデルまで） | `docs/baseline/functional-design.md`（論理設計の判断は `flow-design-database` スキル、物理スキーマは `specs-detail-design` スキルの範囲） |
| ステップ4 アルゴリズム設計（中核ロジック） | `docs/baseline/functional-design.md` |
| ステップ5 ユースケース一覧 | `docs/baseline/functional-design.md`（シーケンス図フルは `specs-basic-design` スキルの範囲） |
| ステップ6 画面設計（画面一覧・遷移図） | `docs/baseline/functional-design.md`（各画面のレイアウト・項目定義・イベントは `specs-basic-design` スキルの範囲） |
| ステップ7 モジュール構成図 | `docs/baseline/functional-design.md` |
| ステップ8 UI設計／ステップ10 エラーハンドリング | `docs/specs/_shared/cross-cutting.md` |
| ステップ9 ファイル構造 | 保存形式は `docs/baseline/functional-design.md`「データモデル」、物理配置は `docs/baseline/repository-structure.md` |

## 機能設計書の目的

機能設計書は、PRDで定義された「何を作るか」を「どう実現するか」に落とし込むドキュメントです。

**主な内容**:
- システム構成図
- データモデル
- アルゴリズム設計（該当する場合）
- 画面・ユースケース・モジュール構成の一覧
- UI設計
- エラーハンドリング

## 作成の基本フロー

### ステップ1: PRDの確認

機能設計書を作成する前に、必ずPRDを確認します。

```
Claude CodeにPRDから機能設計書を作成してもらう際のプロンプト例:

PRDの内容に基づいて機能設計書を作成してください。
特に優先度P0(MVP)の機能に焦点を当ててください。
```

### ステップ2: システム構成図の作成

#### Mermaid記法の使用

システム構成図はMermaid記法で記述します。

**基本的な3層アーキテクチャの例**:
```mermaid
graph TB
    User[ユーザー]
    CLI[CLIレイヤー]
    Service[サービスレイヤー]
    Data[データレイヤー]

    User --> CLI
    CLI --> Service
    Service --> Data
```

**より詳細な例**:
```mermaid
graph TB
    User[ユーザー]
    CLI[CLIインターフェース]
    Commander[Commander.js]
    TaskManager[TaskManager]
    PriorityEstimator[PriorityEstimator]
    FileStorage[FileStorage]
    JSON[(tasks.json)]

    User --> CLI
    CLI --> Commander
    Commander --> TaskManager
    TaskManager --> PriorityEstimator
    TaskManager --> FileStorage
    FileStorage --> JSON
```

### ステップ3: データモデル定義

#### TypeScript型定義で明確に

データモデルはTypeScriptのインターフェースで定義します。

**基本的なTask型の例**:
```typescript
interface Task {
  id: string;                    // UUID v4
  title: string;                 // 1-200文字
  description?: string;          // オプション、Markdown形式
  status: TaskStatus;            // 'todo' | 'in_progress' | 'completed'
  priority: TaskPriority;        // 'high' | 'medium' | 'low'
  estimatedPriority?: TaskPriority;  // 自動推定された優先度
  dueDate?: Date;                // 期限
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
  statusHistory?: StatusChange[]; // ステータス変更履歴
}

type TaskStatus = 'todo' | 'in_progress' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';

interface StatusChange {
  from: TaskStatus;
  to: TaskStatus;
  changedAt: Date;
}
```

**重要なポイント**:
- 各フィールドにコメントで説明を追加
- 制約（文字数、形式など）を明記
- オプションフィールドには`?`を付ける
- 型エイリアスで可読性を向上

#### ER図の作成

複数のエンティティがある場合、ER図で関連を示します。

```mermaid
erDiagram
    TASK ||--o{ SUBTASK : has
    TASK ||--o{ TAG : has
    USER ||--o{ TASK : creates

    TASK {
        string id PK
        string title
        string status
        datetime createdAt
    }
    SUBTASK {
        string id PK
        string taskId FK
        string title
    }
```

> **配置先**: 本ステップで作るのは概念モデル（TypeScript型定義・ER図）まで。以降は本ガイドの範囲外。
> baseline のデータモデルが確定したら、**`/flow-design-database`（`flow-design-database` スキル）**を
> 入口として論理設計 → 物理設計へ進む。
>
> - **論理設計**（キー設計・正規化・関連の解決・区分値の表現方法・削除/履歴方針・個人情報の識別・
>   命名規約といった**判断とその理由**）→ `docs/specs/3_detail-design/db/logical-data-model.md`
> - **物理スキーマ**（カラムの物理型・NULL可否・デフォルト・物理制約名・索引名）→
>   `specs-detail-design` スキルで `docs/specs/3_detail-design/db/table-definition.md`

### ステップ4: アルゴリズム設計（該当する場合）

複雑なロジック（例: 優先度自動推定）は詳細に設計します。中核ロジックの仕様は baseline に置き
（プロジェクトの指標としてぶれてはいけない重要点）、レイヤー別の実装インターフェース（擬似コード）は
`specs-basic-design` スキルの `component-design.md` に委ねる。

#### 優先度自動推定アルゴリズムの例

**目的**: タスクの期限、作成日時、ステータスから優先度を自動推定

**計算ロジック**:

##### ステップ1: 期限スコア計算（0-100点）
```
- 期限超過: 100点（最高）
- 期限まで0-3日: 90点
- 期限まで4-7日: 70点
- 期限まで8-14日: 50点
- 期限まで14日以上: 30点
- 期限設定なし: 20点
```

**計算式**:
```typescript
function calculateDeadlineScore(dueDate?: Date): number {
  if (!dueDate) return 20;

  const now = new Date();
  const daysRemaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 100;  // 期限超過
  if (daysRemaining <= 3) return 90;
  if (daysRemaining <= 7) return 70;
  if (daysRemaining <= 14) return 50;
  return 30;
}
```

##### ステップ2: 経過時間スコア計算（0-100点）
```
- 作成から30日以上: 100点（最高）
- 作成から21-30日: 80点
- 作成から14-21日: 60点
- 作成から7-14日: 40点
- 作成から7日未満: 20点
```

**計算式**:
```typescript
function calculateAgeScore(createdAt: Date): number {
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysOld >= 30) return 100;
  if (daysOld >= 21) return 80;
  if (daysOld >= 14) return 60;
  if (daysOld >= 7) return 40;
  return 20;
}
```

##### ステップ3: ステータススコア計算（0-100点）
```
- 進行中 (in_progress): 100点（最高優先）
- 未着手 (todo): 50点
- 完了 (completed): 0点
```

**計算式**:
```typescript
function calculateStatusScore(status: TaskStatus): number {
  if (status === 'in_progress') return 100;
  if (status === 'todo') return 50;
  return 0;  // completed
}
```

##### ステップ4: 総合スコア計算

**加重平均**:
```
総合スコア = (期限スコア × 50%) + (経過時間スコア × 20%) + (ステータススコア × 30%)
```

**計算式**:
```typescript
function calculateTotalScore(task: Task): number {
  const deadlineScore = calculateDeadlineScore(task.dueDate);
  const ageScore = calculateAgeScore(task.createdAt);
  const statusScore = calculateStatusScore(task.status);

  return (deadlineScore * 0.5) + (ageScore * 0.2) + (statusScore * 0.3);
}
```

##### ステップ5: 優先度分類

**閾値による分類**:
```
- 70点以上: high（高優先度）
- 40-70点: medium（中優先度）
- 40点未満: low（低優先度）
```

**計算式**:
```typescript
function estimatePriority(task: Task): TaskPriority {
  const score = calculateTotalScore(task);

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

**完全な実装例**:
```typescript
class PriorityEstimator {
  estimate(task: Task): TaskPriority {
    const deadlineScore = this.calculateDeadlineScore(task.dueDate);
    const ageScore = this.calculateAgeScore(task.createdAt);
    const statusScore = this.calculateStatusScore(task.status);

    const totalScore = (deadlineScore * 0.5) + (ageScore * 0.2) + (statusScore * 0.3);

    if (totalScore >= 70) return 'high';
    if (totalScore >= 40) return 'medium';
    return 'low';
  }

  private calculateDeadlineScore(dueDate?: Date): number {
    if (!dueDate) return 20;

    const now = new Date();
    const daysRemaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return 100;
    if (daysRemaining <= 3) return 90;
    if (daysRemaining <= 7) return 70;
    if (daysRemaining <= 14) return 50;
    return 30;
  }

  private calculateAgeScore(createdAt: Date): number {
    const now = new Date();
    const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOld >= 30) return 100;
    if (daysOld >= 21) return 80;
    if (daysOld >= 14) return 60;
    if (daysOld >= 7) return 40;
    return 20;
  }

  private calculateStatusScore(status: TaskStatus): number {
    if (status === 'in_progress') return 100;
    if (status === 'todo') return 50;
    return 0;
  }
}
```

### ステップ5: ユースケース一覧

主要なユースケースを **一覧表**（ID・アクター・目的・関連画面）として
`docs/baseline/functional-design.md`「ユースケース一覧」に定義する（一覧は小さく、プロジェクトの
指標として重要点にあたるため baseline に置く）。

**ユースケース一覧（例）**:

| ID | ユースケース | アクター | 目的 | 関連画面 |
|---|---|---|---|---|
| UC-01 | タスク追加 | ユーザー | 新しいタスクを登録する | タスク一覧 |

> **配置先**: 各ユースケースのレイヤー横断シーケンス図（システム挙動の詳細）は本ガイドの範囲外。
> baseline の一覧の ID（UC-01 等）が確定したら、**`specs-basic-design` スキル**で
> `docs/specs/2_basic-design/usecase.md` に詳細化する。

### ステップ6: 画面設計（GUIの場合）

画面を持つアプリでは、**画面一覧**と**画面遷移図**を `docs/baseline/functional-design.md`
「画面設計」に定義する（一覧・遷移図はどちらも小さく、プロジェクトの指標として重要点にあたるため
baseline に置く）。本節の画面一覧を画面命名の正本とし、各画面が呼ぶ API を「主なAPI」列で対応づける。

**画面一覧（例）**:

| 画面名 | ルート(FE) | 対応コンポーネント | 目的 | 主な要素 | 主なAPI |
|---|---|---|---|---|---|
| ダッシュボード | `/` | `DashboardPage` | 当日の状況を一望する | サマリー、当日リスト | `GET /dashboard` |

**画面遷移図**:
```mermaid
stateDiagram-v2
    [*] --> Dashboard
    Dashboard --> Detail: 項目を選択
    Detail --> Dashboard: 戻る
```

> ノード名は画面一覧の対応コンポーネント（`Dashboard`＝`DashboardPage` 等）に対応させる。
> UI の表示仕様の詳細（色・状態表現など）は
> `docs/specs/_shared/cross-cutting.md`（後述のステップ8）に書く。

> **配置先**: 各画面の詳細（レイアウト・画面項目定義・画面イベント）は本ガイドの範囲外。
> baseline の画面一覧・遷移図が確定したら、**`specs-basic-design` スキル**で
> `docs/specs/2_basic-design/screen-design.md` に詳細化する。

### ステップ7: モジュール構成図（画面 × API × バックエンド）

画面・API・バックエンドモジュールの対応関係を **API で紐づける俯瞰図**を、
`docs/baseline/functional-design.md`「モジュール構成図」に置く（プロジェクト全体の俯瞰図であり
重要点にあたるため baseline に置く）。データの正本は各節（画面＝「画面設計」、API＝「API一覧」、
責務＝`specs-basic-design` スキルが作る `docs/specs/2_basic-design/component-design.md` の各層）に
置き、本図は対応の可視化に徹する（二重管理をしない）。

```mermaid
flowchart LR
    subgraph FE["画面"]
      S1["ダッシュボード<br/>DashboardPage"]
    end
    subgraph API["API"]
      A1["API-01 集計取得"]
    end
    subgraph BE["バックエンド"]
      B1["dashboard_handler<br/>→ dashboard_service"]
    end
    S1 --> A1 --> B1
```

> API を追加・変更したら、baseline「API一覧」を更新したうえで本図のノード・矢印も追随させる。
> （API 入出力詳細は `specs-basic-design` スキルが作る `api-design.md`。）

### ステップ8: UI設計（該当する場合）

CLIツールの場合、テーブル表示やカラーコーディングを定義します。

#### テーブル表示

```
┌──────────┬──────────────────┬────────────┬──────────┬───────────────┐
│ ID       │ タイトル          │ ステータス   │ 優先度    │ 期限           │
├──────────┼──────────────────┼────────────┼──────────┼───────────────┤
│ 7a5c6ff0 │ 牛乳を買って帰る.   │ 未着手      │ 高       │ 2025-11-05    │
│          │                  │            │          │ (あと1日)      │
└──────────┴──────────────────┴────────────┴──────────┴───────────────┘
```

#### カラーコーディング

**ステータスの色分け**:
- 完了 (completed): 緑
- 進行中 (in_progress): 黄
- 未着手 (todo): 白

**優先度の色分け**:
- 高 (high): 赤
- 中 (medium): 黄
- 低 (low): 青

### ステップ9: ファイル構造（該当する場合）

データの保存形式を定義します。

**例: CLIツールのデータ保存**:
```
.devtask/
├── tasks.json      # タスクデータ
└── config.json     # 設定データ
```

**tasks.json の例**:
```json
{
  "tasks": [
    {
      "id": "7a5c6ff0-5f55-474e-baf7-ea13624d73a4",
      "title": "牛乳を買って帰る",
      "description": "",
      "status": "todo",
      "priority": "high",
      "estimatedPriority": "medium",
      "dueDate": "2025-11-05T00:00:00.000Z",
      "createdAt": "2025-11-04T10:00:00.000Z",
      "updatedAt": "2025-11-04T10:00:00.000Z"
    }
  ]
}
```

### ステップ10: エラーハンドリング

エラーの種類と処理方法を定義します。

| エラー種別 | 処理 | ユーザーへの表示 |
|-----------|------|-----------------|
| 入力検証エラー | 処理を中断、エラーメッセージ表示 | "タイトルは1-200文字で入力してください" |
| ファイル読み込みエラー | 空の初期データで継続 | "データファイルが見つかりません。新規作成します" |
| タスクが見つからない | 処理を中断、エラーメッセージ表示 | "タスクが見つかりません (ID: xxx)" |

## 機能設計書のレビュー

### レビュー観点

Claude Codeにレビューを依頼します:

```
この機能設計書を評価してください。以下の観点で確認してください:

1. PRDの要件を満たしているか
2. データモデルは具体的か
3. アルゴリズムは実装可能なレベルまで詳細化されているか
4. 画面・ユースケース・モジュール構成の一覧が過不足なく揃っているか
5. エラーハンドリングは網羅されているか
```

### 改善の実施

Claude Codeの指摘に基づいて改善します。

## まとめ

機能設計書作成の成功のポイント:

1. **PRDとの整合性**: PRDで定義された要件を正確に反映
2. **Mermaid記法の活用**: 図表で視覚的に表現
3. **TypeScript型定義**: データモデルを明確に
4. **詳細なアルゴリズム設計**: 複雑なロジックは具体的に
5. **重要点に絞る**: 一覧・カタログ・正本表・中核ロジックのみを baseline に置き、実装詳細は
   `docs/specs/_shared/`（フェーズ横断）と `specs-basic-design` スキル（`docs/specs/2_basic-design/`）に委ねる
6. **実装可能なレベル**: 開発者が迷わず実装できる詳細度（baseline は骨格、specs は肉付け）
