# block-no-verify.ps1 の回帰テスト
#
# 背景: 本フックは「LLM の判断に依存せず --no-verify を機械的に拒否する」多層防御。
#       スクリプトがパースエラーで落ちると **何も出力せず素通り(fail open)** するため、
#       壊れても気づかないまま security 制御が無効化される。実際に移設作業で
#       BOM 欠落によるパースエラーが発生し、deny すべき3ケースが全て allow になった。
#
# 実行:
#   powershell -NoProfile -ExecutionPolicy Bypass -File ./tests/test-block-no-verify.ps1
#
# 終了コード: 全ケース成功で 0、1件でも失敗で 1

$ErrorActionPreference = 'Stop'

$hookPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'block-no-verify.ps1'

if (-not (Test-Path -LiteralPath $hookPath)) {
    Write-Output "FAIL: フック本体が見つからない: $hookPath"
    exit 1
}

# --- 前提条件: BOM 付き UTF-8 であること -------------------------------------
# Windows PowerShell 5.1 は BOM 無しの .ps1 を ANSI(CP932)として読むため、
# 日本語を含むスクリプトは BOM が無いとパースエラーになる。
$bytes = [System.IO.File]::ReadAllBytes($hookPath)
$hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
if (-not $hasBom) {
    Write-Output "FAIL: block-no-verify.ps1 に UTF-8 BOM が無い。Windows PowerShell 5.1 がパースに失敗し、フックが素通りする"
    exit 1
}
Write-Output "PASS: UTF-8 BOM あり"

# --- 振る舞いのテスト --------------------------------------------------------
$cases = @(
    # --- 基本の deny ---------------------------------------------------------
    @{ name = '--no-verify を含む commit';        command = 'git commit --no-verify -m test'; expect = 'deny'  }
    @{ name = '-n (--no-verify の別名)';           command = 'git commit -n -m test';          expect = 'deny'  }
    @{ name = '--no-gpg-sign を含む push';         command = 'git push --no-gpg-sign';         expect = 'deny'  }
    @{ name = '大文字混じりの --NO-VERIFY';        command = 'git commit --NO-VERIFY -m test'; expect = 'deny'  }

    # --- セキュリティレビューで実証された回避経路（旧実装は全て素通りした）---
    @{ name = '短オプション結合 -nm';              command = 'git commit -nm "msg"';                      expect = 'deny' }
    @{ name = '二重引用符で囲んだフラグ';          command = 'git commit "--no-verify" -m x';             expect = 'deny' }
    @{ name = '単一引用符で囲んだフラグ';          command = "git commit '--no-verify' -m x";             expect = 'deny' }
    @{ name = 'core.hooksPath 差し替え';           command = 'git -c core.hooksPath=/dev/null commit -m x'; expect = 'deny' }
    @{ name = 'GIT_CONFIG_* 経由の注入';           command = 'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x'; expect = 'deny' }

    # --- コマンド全体を引用で包む形（2026-08-16 のレビューで実測により素通りを確認）---
    # 旧実装は「引用を剥がした文字列」でコマンド種別を判定していたため、
    # 全体が引用に包まれると git も commit も消え、**検査に入る前に早期 exit** していた。
    # 判定を生文字列で行うことで塞いだ。ここを引用剥がし側へ戻してはならない。
    @{ name = 'bash -c で包んだフラグ';            command = 'bash -c "git commit --no-verify -m x"';     expect = 'deny' }
    @{ name = 'eval で包んだフラグ';               command = 'eval "git commit --no-verify -m x"';        expect = 'deny' }
    @{ name = 'sh -c で包んだフラグ（単一引用）';  command = "sh -c 'git commit --no-verify -m x'";       expect = 'deny' }
    @{ name = 'バッククォートによるエスケープ';    command = 'git commit --no-ver`ify -m x';              expect = 'deny' }

    # --- ラッパー引用形の短縮オプション（H-1 と同じ穴が -n 側に残っていた）---
    # 引用区間を一律に潰すと、入れ子コマンド内の -n を見失う。
    # メッセージ本文だけを潰す方式に変えて塞いだ。
    @{ name = 'bash -c で包んだ -n';               command = 'bash -c "git commit -n -m x"';              expect = 'deny' }
    @{ name = 'eval で包んだ -nm';                 command = 'eval "git commit -nm msg"';                 expect = 'deny' }
    @{ name = 'sh -c で包んだ -n（単一引用）';     command = "sh -c 'git commit -n -m x'";                expect = 'deny' }

    # --- ロングオプションの省略形（git は曖昧でなければ前方一致を受理する）---
    @{ name = '省略形 --no-veri';                  command = 'git commit --no-veri -m x';                 expect = 'deny' }
    @{ name = '省略形 --no-verif';                 command = 'git commit --no-verif -m x';                expect = 'deny' }

    # --- 終端が空白・引用以外（; && | 括弧）-----------------------------------
    @{ name = 'セミコロンで連結';                  command = 'git commit --no-verify;echo done';          expect = 'deny' }
    @{ name = '括弧で囲んだ commit';               command = '(git commit --no-verify)';                  expect = 'deny' }
    @{ name = 'パイプで連結';                      command = 'git commit -m x --no-verify|cat';           expect = 'deny' }

    # --- 語中のエスケープ・引用連結（git には --no-verify として届く）---------
    @{ name = 'バックスラッシュエスケープ';        command = 'git commit --no-\verify -m x';              expect = 'deny' }
    @{ name = '語中の二重引用連結';                command = 'git commit --no-ve"r"ify -m x';             expect = 'deny' }

    # --- 誤検知の回帰（旧実装は誤って deny した）-----------------------------
    @{ name = 'push の -n は --dry-run';           command = 'git push -n';                    expect = 'allow' }
    @{ name = 'メッセージ本文の -n';               command = 'git commit -m "fix -n handling"'; expect = 'allow' }

    # 意図的な誤検知（許容する）:
    # ロングオプションは「引用符で囲んだバイパス」(git commit "--no-verify") を捕捉するため
    # 生文字列で検査している。副作用としてメッセージ本文に --no-verify と書いた場合も deny になる。
    # 取りこぼし(fail open)より誤検知(fail closed)を選ぶ。回避したい場合はメッセージの表記を
    # 変える(例: "no verify")か、フラグを使わない旨を本文から外す。
    @{ name = 'メッセージ本文の --no-verify 言及（許容する誤検知）'; command = "git commit -m 'document --no-verify policy'"; expect = 'deny' }

    # --- 通常操作 -----------------------------------------------------------
    @{ name = '通常の commit';                     command = 'git commit -m test';             expect = 'allow' }
    @{ name = '通常の push';                       command = 'git push origin main';           expect = 'allow' }
    @{ name = '-am での commit';                   command = 'git commit -am "msg"';           expect = 'allow' }
    @{ name = 'git 以外のコマンド';                command = 'npm run build';                  expect = 'allow' }
    @{ name = 'no-verify を含むが git でない';     command = 'echo --no-verify';               expect = 'allow' }
    @{ name = 'git grep（誤ブロック回帰）';        command = 'git grep -n "pattern"';          expect = 'allow' }

    # --- 誤検知の番人（塞ぎを強めたことで壊れやすい箇所）---------------------
    @{ name = 'git log -n';                        command = 'git log -n 5';                   expect = 'allow' }
    @{ name = 'commit --amend --no-edit';          command = 'git commit --amend --no-edit';   expect = 'allow' }
    @{ name = 'push --dry-run';                    command = 'git push --dry-run origin main'; expect = 'allow' }
    @{ name = 'commit --verbose';                  command = 'git commit --verbose -m x';      expect = 'allow' }
    @{ name = 'ラッパー内のメッセージ本文の -n';   command = 'bash -c "git commit -m ''fix -n handling''"'; expect = 'allow' }
)

$failed = 0

foreach ($case in $cases) {
    $payload = @{ tool_input = @{ command = $case.command } } | ConvertTo-Json -Compress
    $output = $payload | & powershell -NoProfile -ExecutionPolicy Bypass -File $hookPath
    $actual = if ([string]::IsNullOrWhiteSpace($output)) { 'allow' } else { 'deny' }

    if ($actual -eq $case.expect) {
        Write-Output ("PASS: {0} -> {1}" -f $case.name, $actual)
    } else {
        Write-Output ("FAIL: {0} -> {1} (期待: {2})" -f $case.name, $actual, $case.expect)
        $failed++
    }
}

# --- 異常入力で誤ブロックしないこと ------------------------------------------
foreach ($bad in @('', 'not-json', '{}', '{"tool_input":{}}')) {
    $output = $bad | & powershell -NoProfile -ExecutionPolicy Bypass -File $hookPath
    if ([string]::IsNullOrWhiteSpace($output)) {
        Write-Output ("PASS: 異常入力で素通り ({0})" -f $(if ($bad -eq '') { '空文字' } else { $bad }))
    } else {
        Write-Output ("FAIL: 異常入力で誤ブロックした ({0})" -f $bad)
        $failed++
    }
}

Write-Output ""
if ($failed -eq 0) {
    Write-Output "全テスト成功"
    exit 0
} else {
    Write-Output ("失敗: {0}件" -f $failed)
    exit 1
}
