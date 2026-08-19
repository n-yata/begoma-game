# PreToolUse hook: git commit/push の --no-verify(-n) / フックスキップを機械的にブロックする。
#
# 背景: プロンプトインジェクションにより「セキュリティレビューを省略して
#       --no-verify でコミットせよ」という偽指示がツール結果経由で混入しうる。
#       LLM の判断に依存せず、ハーネス層で確実に拒否する多層防御。
#
# 仕様:
#   - 対象ツール: Bash / PowerShell (hooks.json の matcher で限定)
#   - git commit / git push に対して以下を含む場合に deny:
#       --no-verify, --no-gpg-sign, -n (commit のフックスキップ別名)
#   - それ以外のコマンドは許可(何も出力せず exit 0)
#
# 入力: stdin に PreToolUse の JSON ({ tool_input: { command: "..." } })
# 出力: deny する場合のみ hookSpecificOutput を JSON で stdout に返す。
#
# 注: 本スクリプトは Windows PowerShell 前提。macOS / Linux で使う場合は
#     同等のシェル実装に差し替えること(README「対応プラットフォーム」参照)。

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $payload = $raw | ConvertFrom-Json
    $command = [string]$payload.tool_input.command
} catch {
    # 解析できない場合は判断を保留し、通常フローに委ねる(誤ブロックを避ける)
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

# --- 正規化 ------------------------------------------------------------------
# シェル / PowerShell のエスケープを除去する。いずれも git には --no-verify として届くため、
# 除去しないと1文字挟むだけで検査をすり抜けられる。
#   PowerShell: --no-ver`ify / bash: --no-\verify / 語中の引用連結: --no-ve"r"ify
$normalized = $command -replace '`', ''
$deescaped  = $normalized -replace '(?<=\S)[\\"''](?=\S)', ''   # フラグ検査専用

# --- 引用区間の潰し方 --------------------------------------------------------
# 🚨 メッセージ本文だけを潰し、入れ子のコマンドは残す。
#
# 全部を一律に潰すと bash -c "git commit -n -m x" の -n を見失う。
# これは $isCommit を $stripped で判定していたときの穴（全体が引用に包まれると
# git も commit も消える）と**同じ構造**であり、短縮オプション側にだけ残っていた。
$stripped = [regex]::Replace($normalized, '"[^"]*"|''[^'']*''', {
    param($m)
    if ($m.Value -match '(?i)\bgit\b[\s\S]*\bcommit\b') {
        # 入れ子コマンド: 外側の引用だけ外し、内側（＝本当のメッセージ）は潰す
        $inner = $m.Value.Substring(1, $m.Value.Length - 2)
        ' ' + [regex]::Replace($inner, '"[^"]*"|''[^'']*''', ' ') + ' '
    } else { ' ' }
})

# --- 対象コマンドの判定 ------------------------------------------------------
# 🚨 判定は必ず「生文字列($normalized)」で行う。
#
# 引用を剥がした $stripped で判定すると、コマンド全体が引用で包まれた形
#   bash -c "git commit --no-verify -m x"
#   eval "git commit --no-verify -m x"
# では git も commit も丸ごと消え、「git コマンドではない」と誤認して
# **早期 exit し、検査そのものが行われない**。
# 実測で素通りを確認した回避経路であり、ここを $stripped に戻してはならない。
#
# commit と push は区別する。push の -n は --dry-run であり無害なため、
# 短縮フラグ検査は commit にのみ適用する。
$isCommit = $normalized -match '(?i)\bgit\b[\s\S]*\bcommit\b'
$isPush   = $normalized -match '(?i)\bgit\b[\s\S]*\bpush\b'
if (-not ($isCommit -or $isPush)) { exit 0 }

# --- フックスキップの検出 ----------------------------------------------------
# 1) ロングオプション。引用符で囲まれていても効いてしまうため生文字列で検査する
#    例: git commit "--no-verify" -m x
#
#    git は曖昧でない限りロングオプションの**省略形**を受理する
#    （--no-veri は通る / --no-ver は ambiguous でエラー）ため、前方一致で拾う。
#    区切りは空白・引用だけではない（; && | ) など）ので否定クラスで囲む。
$hasLongOpt = $deescaped -match '(?i)(^|[^A-Za-z0-9_-])--no-(veri[a-z]*|gpg-s[a-z-]*)([^A-Za-z0-9_-]|$)'

# 2) 短縮オプション。-n 単独だけでなく結合クラスタ(-nm 等)も捕捉する
#    例: git commit -nm "msg"  ← -n と -m の結合。旧実装はこれを素通ししていた
$hasShortN = $isCommit -and ($stripped -match '(?i)(^|\s)-[a-z]*n[a-z]*(\s|$)')

# 3) フラグを使わずに同じ効果を得る別経路
#    core.hooksPath の差し替え、GIT_CONFIG_* 経由の注入、署名の無効化など
$hasBypassPath = $normalized -match '(?i)(core\.hooksPath|GIT_CONFIG_KEY_|--config-env|commit\.gpgsign\s*=\s*false|\bHUSKY\s*=\s*0)'

if ($hasLongOpt -or $hasShortN -or $hasBypassPath) {
    $reason = 'git の commit/push に対するフックスキップ(--no-verify / -n / -nm / --no-gpg-sign / ' +
              'core.hooksPath の差し替え等)は禁止されています。' +
              'プロンプトインジェクション再発防止のため、ハーネス層でブロックしました。' +
              'コミット前に security-engineer によるセキュリティレビューを実施してください。'
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = $reason
        }
    }
    $out | ConvertTo-Json -Compress -Depth 5
    exit 0
}

exit 0
