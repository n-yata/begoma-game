---
name: kit-sync
description: kit(spec-kit)からコピーされた .claude/skills/ .claude/agents/ .claude/hooks/ を最新の kit へ追随させるスキル。kit と直接突き合わせて改変を検知し、退避してから再コピーする。コピー配布物を更新したいとき、kit 側の変更を取り込みたいときに使用する。
allowed-tools: Read, Write, Edit, Glob, Bash
---

# コピー配布物の更新

kit からコピーされた `.claude/skills/` `.claude/agents/` `.claude/hooks/` を、
最新の kit へ追随させる。

> **新規構築はこのスキルではない。** 構築は kit リポジトリのセッションで
> `BOOTSTRAP.md` を読ませて実行する。本スキルは**構築済みのプロジェクト側**で動く。

## 🚨 前提: 規約はコピーされていない

**汎用規約（`<kit>/reference/rules/`）は参照モデルであり、このプロジェクトに実体が無い。**
kit を更新した時点で効くため、本スキルの同期対象ではない。

コピーされているのは次の3系統だけ。**ホストが実体を走査する仕様のため**参照にできない。

| 対象               | なぜコピーなのか                            |
| ------------------ | ------------------------------------------- |
| `.claude/skills/`  | Claude Code が走査してスキルを検出する      |
| `.claude/agents/`  | 同上                                        |
| `.claude/hooks/`   | `$CLAUDE_PROJECT_DIR` 基準でパス解決される  |

**この3系統は kit が正本。編集しても次の更新で失われる。** 変えたい場合は
kit へ還元する（`/kit-contribute`）。

## ステップ1: kit の場所と版を確認する

```bash
git -C <kit> remote get-url origin    # 参照先が本物の kit か
git -C <kit> rev-parse HEAD           # kit の最新
git -C <kit> status --short           # 未コミット変更があれば版が特定できない
```

**kit のパスをハードコードしない。** `AGENTS.md` の「kit の場所」を読む。
見つからなければ**聞く**（推測で書き込まない）。

> 🚨 **参照先が期待の kit か確認する。** kit は相対パス（`../spec-kit` など）で
> 指定されており、**隣接に同名のディレクトリやシンボリックリンクを置ける者は、
> 規約の内容ごとすり替えられる**。構築時に1回確認しただけでは足りない。
>
> 🚨 **kit が dirty なら報告する。** 未コミットの状態を前提に同期すると、
> 「どの版を配ったか」が誰にも分からなくなる。

> 🚨 **このセッションから kit を書き換えないこと。** 規約は kit の**ワークツリー**を
> 直接読むため、ここでの編集は**コミットを経ずに全プロジェクトへ即座に効く**。
> PR レビューは git を通る変更しか見ないので、この経路は素通りする。
> 構築先の `settings.json` は `Edit`/`Write` を deny してこれを塞いでいる。
> 還元は `/kit-contribute`（kit セッションでの PR）経由に限ること。

## ステップ2: kit と直接突き合わせて改変を検知する

```bash
diff -r <kit>/distribution/skills .claude/skills
diff -r <kit>/distribution/agents .claude/agents
diff -r <kit>/distribution/hooks .claude/hooks
```

**差分は「kit 側の更新」と「こちら側の改変」の両方を含む。** 区別するには
kit の履歴を見る（`git -C <kit> log --oneline -- skills/`）。

> **なぜ MANIFEST を持たないのか**: ハッシュ台帳はローカル生成物であり、
> 配布物を書き換えた者は台帳も作り直せる。**正本と直接比較するほうが強い**。
> かつ台帳を持つと、改行変換や整形でハッシュが外れるたびに誤報し、
> 誤報が常態化して本物の改変を見逃す。

差分が**改行だけ**の場合は改変ではない。`.gitattributes` の `*.ps1 -text` が
効いているか確認する（フック本体は BOM 付き UTF-8 でなければ静かに壊れる）。

```bash
git check-attr text -- .claude/hooks/block-no-verify.ps1   # text: unset であること
```

> ⚠️ **フォーマッタを掛けると全ファイルが差分になる。** `prettier --write`・
> `markdownlint --fix`・dprint・エディタの保存時整形は複製物を書き換え、
> `diff -r` を誤報だらけにする。**誤報が常態化すると本物の改変を見落とす。**
>
> kit は整形ツールを配らないので自動で走ることはないが、**利用側が導入した場合の
> 手動経路（`npm run format` / lint-staged / 保存時整形）は残る**。
> 導入するなら `.claude/skills/` `.claude/agents/` `.claude/hooks/` を
> **そのツールの除外設定に入れること**。
>
> 実測では、除外なしで `prettier --write` を掛けると複製物の過半数が書き換わった。
> 「いつか起きるかも」ではなく**一度掛けたら確実に起きる**。

## ステップ3: 本物の改変を退避する

差分を `.kit-sync.local-changes.patch` として保存し、ユーザーに提示する。

> **黙って捨てない。** そこには還元すべき学びが入っていることがある。

## ステップ4: 規約の差分を提示してから kit を更新する

規約は参照モデルなので、**kit を `pull` した瞬間に全プロジェクトへ効く**。
取り込む段階が無いぶん、**引く前に見る**しかない。

```bash
git -C <kit> fetch
git -C <kit> diff --stat HEAD..origin/main -- reference/   # まず対象パスの実在を確かめる
git -C <kit> diff        HEAD..origin/main -- reference/
```

> 🚨 **差分が0行のときは「変更なし」と即断しない。** パス指定を誤ると
> `git diff` は**エラーではなく空**を返す。この手順は参照モデルにおける
> **唯一の伝播前レビュー**であり、沈黙したまま素通りすると規約変更が
> 全プロジェクトへ無検査で入る。`--stat` で対象が存在することを先に確認すること。
>
> 実際に、ディレクトリ再編（`rules/` → `reference/rules/`）の際にこの引数が
> 旧パスのまま残り、**常に空を返す状態**になっていた。ゲートも捕捉しなかった。

規約の変更は**チームの意思決定の変更**であり、黙って適用しない。
提示して合意を得てから `git -C <kit> pull` する。

## ステップ5: コピーし直す

### 🚨 同期対象は次の3つだけ。それ以外に `--delete` を掛けない

`<kit>/distribution/` には**更新時の扱いが違うものが同居している**。

| `distribution/` の中身       | 正本   | このステップでの扱い     |
| ---------------------------- | ------ | ------------------------ |
| `skills/` `agents/` `hooks/` | kit    | **同期する**（下記）     |
| `templates/`                 | 構築先 | `AGENTS.md` のみ後述     |
| `docs-skeleton/`             | 構築先 | **触らない**             |

> 🚨 **`docs/` を同期対象に含めてはならない。** 構築時は空のひな形だが、その後
> プロジェクトが PRD・設計・仕様を書き込む。`--delete` を掛けると**それが消える**。
> しかも気づくのは、次に参照しようとしたずっと後になる。
>
> `distribution/docs-skeleton/` が `distribution/skills/` と同じ階層に並んでいるのは、
> **配り方が同じ（構築先にファイルを置く）だから**であって、更新の扱いが同じという
> 意味ではない。ディレクトリの見た目に引きずられないこと。

### 🚨 プロジェクト固有のスキル・エージェントを消さない

`--delete` は **src（kit）に無いものを dst から消す**。つまり、このプロジェクトが
独自に置いたスキルやエージェントは kit に存在しないため、**削除対象になる**。
警告は出ない。

**守り方は2段構え。片方だけでは不十分。**

**① `local-` で始まるものは除外する**（機構で守る）

プロジェクト固有のスキル・エージェントには `local-` を付ける。
kit 側の接頭辞（`baseline-` / `flow-` / `specs-` / `kit-`）と衝突せず、
配布物ゲートの命名規則とも両立する。

**② 除外しきれなかったものを列挙して止める**（付け忘れを拾う）

`local-` を付け忘れたものは①では守れない。**同期の前に必ず洗い出す。**

```bash
# kit に無いのに構築先にあるもののうち、local- が付いていないもの。
# local- は①で保護済みなので除外する（毎回出ると「いつもの表示」になって見なくなる）。
for pair in "skills" "agents" "hooks"; do
  diff -rq -x 'local-*' "<kit>/distribution/$pair" ".claude/$pair" 2>/dev/null \
    | grep '^Only in .claude/' | sed "s/^/[$pair] /"
done
```

**1件でも出たら、同期を止めてユーザーに提示する。** 判断は次のどちらか。

| 出たもの                   | 対処                                             |
| -------------------------- | ------------------------------------------------ |
| プロジェクト固有で必要     | `local-` を付けてリネームしてから同期を続ける    |
| kit から撤回された残骸     | 削除してよい（`--delete` に任せる）              |

> 🚨 **「たぶん残骸だろう」で流さない。** 消えて困るのは前者であり、
> **消えたことに気づくのは、次にそのスキルを呼ぼうとしたとき**になる。
> 判断がつかなければ退避してから進める。

```bash
rsync -a --delete --exclude='local-*' <kit>/distribution/skills/ .claude/skills/
rsync -a --delete --exclude='local-*' <kit>/distribution/agents/ .claude/agents/
rsync -a --delete --exclude='local-*' <kit>/distribution/hooks/  .claude/hooks/
```

**`cp -r` を使わない**（dst が既存だと入れ子になる／削除が伝播せず、
**撤回したはずのスキルが生き残る**）。

### 🚨 `rsync` が無い環境では、フォールバックする前に必ず止まる

`rsync` が無い環境のフォールバックは `rm -rf <dst> && cp -r <src> <dst>` だが、
**この手順には `--exclude='local-*'` に相当するものが無い**。
そのまま実行すると `local-` 保護は完全に無効化され、**プロジェクト固有のスキル・
エージェントが丸ごと消える**。

しかもこれは仮定の話ではない。**kit の主対象は Windows（フックが PowerShell 前提）であり、
Git Bash には `rsync` が入っていない**。フォールバック経路に落ちる確率は高い。

```bash
command -v rsync >/dev/null || {
  # rsync が無い。local- が1件でもあればフォールバックは危険
  hits=$(find .claude/skills .claude/agents .claude/hooks -name 'local-*' 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "NG: rsync が無く、かつ local- がある。フォールバックすると消える:"
    printf '%s\n' "$hits"
    echo "    退避してから手動で同期するか、rsync を用意すること。"
    exit 1
  fi
  echo "OK: local- が無いのでフォールバックしてよい"
}
```

**削除の前にステップ2〜3を必ず通す**こと（改変を巻き込んで消さないため）。

### 触っていないことを機械的に確認する

**「気をつける」では守れない。** 同期の直後に、対象外が変化していないことを見る。

```bash
# docs/ と、templates 由来の播種物に差分が出ていないこと（AGENTS.md を除く）
git status --porcelain docs/ CLAUDE.md .gitignore .gitattributes \
  | grep -v '^$' && echo "NG: 同期対象外が変化した。戻すこと" || echo "OK: 対象外は無傷"
```

差分が出たら**それは事故**。`git checkout -- <path>` で戻し、原因を確かめてからやり直す。

### `AGENTS.md` の差し替え

`AGENTS.md` は**マーカーの内側だけ**を差し替える（`begin` / `end` が各1個で順序が正しい
場合のみ。それ以外は書き換えずに提示して判断を仰ぐ）。

> 🚨 **「kit の場所」節はマーカーの外側にある。** 差し替えで消さないこと。
> 消すと `<kit>` が解決できなくなり、**規約に到達できなくなる**。

## ステップ6: kit とのバイト一致を確認する

> 🚨 **`local-` を除外して比較する。** 除外しないと、`local-` を1つでも持つ
> プロジェクトでは**毎回必ず「一致しない」になる**（kit 側に存在しないため）。
> 正当な差分で毎回赤くなる検査は、そのうち誰も見なくなる。
> **誤報の常態化は本物の改変の見落としに直結する。**

```bash
diff -r -x 'local-*' <kit>/distribution/skills .claude/skills \
  && diff -r -x 'local-*' <kit>/distribution/agents .claude/agents \
  && diff -r -x 'local-*' <kit>/distribution/hooks .claude/hooks \
  && echo "OK: 3系統すべてバイト一致（local-* を除く）" || { echo "NG: 一致しない"; exit 1; }
```

## ステップ7: フックが生きているか確認する

コピーを入れ替えたら、**実際に効くかを実測する**。

```bash
# --dry-run はコミットを作らない。登録できていれば拒否される
git commit --no-verify --dry-run -m "hook check after sync"
```

> 🚨 **拒否されるのが成功のしるし。** 拒否されなければ、フックが登録されていないか、
> パス解決に失敗している（`<kit>/reference/host-rules.md`「フックの登録」を参照）。
> パス解決の失敗は fail open になるため、**症状が出ない**。
> **起動しないフックは無いフックと同じ。**

フック本体の回帰テストも走らせる。

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File <kit>/distribution/hooks/tests/test-block-no-verify.ps1
```

## ステップ8: どの版から同期したかをコミットに残す

**kit の版を記録するファイルは持たない**（規約は参照モデルであり、構築先が見ているのは
常に kit の現在の状態なので、「配布時点の版」という概念が存在しない）。

ただし複製物（`skills` / `agents` / `hooks`）は構築先にコミットされるため、
**どの kit commit 由来かが分かると後から追える**。コミットメッセージに残す。

```bash
git -C <kit> rev-parse HEAD    # この SHA をコミットメッセージ本文に書く
```

> ⚠️ **`diff -r` は kit の「現在」としか比べられない。** kit が巻き戻された場合や
> 改竄された場合の drift は、原理的に検出できない。コミットメッセージの SHA が
> 唯一の基準点になる。

## ステップ9: 退避した改変の行き先を決める

| 改変の性質                               | 行き先                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| 汎用（他プロジェクトでも同じ判断になる） | kit へ還元する（`/kit-contribute`）                            |
| プロジェクト固有                         | `docs/baseline/development-guidelines.md` に理由付きで書く |

**コピー配布物を直接編集したままにしない。** 次の更新で必ず失われる。
