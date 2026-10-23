param(
    [string]$ClaudeHome = (Join-Path $HOME '.claude'),
    [switch]$DryRun,
    [switch]$SkipEcc,
    # Test hook: run only the ECC trim (no npx), then exit.
    [switch]$TrimOnly
)
$ErrorActionPreference = 'Stop'
$Pkg = $PSScriptRoot
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$EccTrim = Join-Path $ClaudeHome "backups\ecc-trim-$Stamp"
$SeqThinking = '@modelcontextprotocol/server-sequential-thinking@2026.8.31'
$KeepRules = @('common', 'java', 'typescript', 'web', 'react', 'README.md')
$KeepSkills = @('springboot-patterns', 'springboot-security', 'springboot-tdd', 'springboot-verification',
    'jpa-patterns', 'java-coding-standards', 'redis-patterns', 'mysql-patterns', 'postgres-patterns',
    'docker-patterns', 'deployment-patterns', 'tdd-workflow', 'verification-loop', 'security-review',
    'codebase-onboarding', 'context-budget')
$Models = Join-Path $Pkg 'agents\models.json'
$KeepAgents = @((Get-Content -Raw -Encoding UTF8 $Models | ConvertFrom-Json).models.PSObject.Properties | ForEach-Object Name)

# Runs $Action, or only prints $What under -DryRun.
function Step([string]$What, [scriptblock]$Action) {
    if ($DryRun) { Write-Host "[dry-run] $What"; return }
    Write-Host $What
    & $Action
}

function Assert-Exit([string]$What) {
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit $LASTEXITCODE)" }
}

function Copy-Into([string]$Src, [string]$Dest) {
    New-Item -ItemType Directory -Force (Split-Path -Parent $Dest) | Out-Null
    Copy-Item -Force $Src $Dest
}

# Moves children of $Dir not matching any $Keep pattern into $To.
function Move-Unkept([string]$Dir, [string[]]$Keep, [string]$To) {
    if (-not (Test-Path $Dir)) { return }
    foreach ($item in Get-ChildItem $Dir) {
        if ($Keep | Where-Object { $item.Name -like $_ -or $item.BaseName -like $_ }) { continue }
        New-Item -ItemType Directory -Force $To | Out-Null
        Move-Item -Force $item.FullName (Join-Path $To $item.Name)
    }
}

# 1. Warning
Write-Host '새 PC·개인 PC 전용. 회사 PC에서 실행하지 말 것.' -ForegroundColor Yellow
if (Test-Path (Join-Path $ClaudeHome 'rules\ecc\csharp')) {
    Write-Host "중단: $ClaudeHome\rules\ecc\csharp 가 있다(회사 PC의 C# 규칙으로 보임)." -ForegroundColor Red
    exit 1
}

$realHome = [IO.Path]::GetFullPath((Join-Path $HOME '.claude')).TrimEnd('')
$target = [IO.Path]::GetFullPath($ClaudeHome).TrimEnd('')
if (-not $SkipEcc -and -not $TrimOnly -and $target -ne $realHome) {
    Write-Host "중단: npx ecc / claude mcp 는 항상 $realHome 을 바꾼다. 다른 -ClaudeHome 에는 -SkipEcc 를 같이 줘야 한다." -ForegroundColor Red
    exit 1
}

function Invoke-EccTrim {
    Move-Unkept (Join-Path $ClaudeHome 'rules\ecc') $KeepRules (Join-Path $EccTrim 'rules')
    Move-Unkept (Join-Path $ClaudeHome 'skills') ($KeepSkills + 'react-*') (Join-Path $EccTrim 'skills')
    Move-Unkept (Join-Path $ClaudeHome 'agents') $KeepAgents (Join-Path $EccTrim 'agents')
}
if ($TrimOnly) { Invoke-EccTrim; exit 0 }

# 2. Backup
$backup = Join-Path $ClaudeHome "backups\pre-harness-$Stamp"
foreach ($n in 'CLAUDE.md', 'settings.json', 'rules', 'agents', 'hooks') {
    $src = Join-Path $ClaudeHome $n
    if (-not (Test-Path $src)) { continue }
    Step "backup $src -> $backup" {
        New-Item -ItemType Directory -Force $backup | Out-Null
        Copy-Item -Recurse -Force $src (Join-Path $backup $n)
    }
}

# 3. ECC install + trim
if (-not $SkipEcc) {
    Step 'npx ecc-universal@2.2.3 install --profile developer --target claude --modules security,database,devops-infra --enable-hooks' {
        npx ecc-universal@2.2.3 install --profile developer --target claude --modules security,database,devops-infra --enable-hooks
        Assert-Exit 'ecc install'
    }
    Step "trim ecc rules/skills/agents -> $EccTrim" { Invoke-EccTrim }
}

# 4. Copy package files
$hookPath = Join-Path $ClaudeHome 'hooks\block-dangerous.js'
$copies = [ordered]@{
    'CLAUDE.md'                 = Join-Path $ClaudeHome 'CLAUDE.md'
    'rules\override.md'         = Join-Path $ClaudeHome 'rules\override.md'
    'rules\agents.md'           = Join-Path $ClaudeHome 'rules\ecc\common\agents.md'
    'hooks\block-dangerous.js'  = $hookPath
}
foreach ($k in $copies.Keys) {
    $src = Join-Path $Pkg $k
    $dest = $copies[$k]
    Step "copy $k -> $dest" { Copy-Into $src $dest }
}

# 5. Merge settings
$settings = Join-Path $ClaudeHome 'settings.json'
Step "merge settings.json -> $settings" {
    node (Join-Path $Pkg 'lib\merge-settings.js') $settings (Join-Path $Pkg 'settings.json') $hookPath $settings
    Assert-Exit 'merge-settings'
}

# 6. Patch agent models
$agentsDir = Join-Path $ClaudeHome 'agents'
$patch = $null
Step "patch agents in $agentsDir" {
    $script:patch = node (Join-Path $Pkg 'lib\patch-agents.js') $agentsDir $Models | ConvertFrom-Json
    Assert-Exit 'patch-agents'
}

# 7. sequential-thinking MCP
if (-not $SkipEcc) {
    Step "claude mcp add -s user sequential-thinking -- npx -y $SeqThinking (if missing)" {
        if (-not ((claude mcp list) -match 'sequential-thinking')) {
            claude mcp add -s user sequential-thinking -- npx -y $SeqThinking
            Assert-Exit 'claude mcp add'
        }
    }
}

# 8. Report
if ($DryRun) { exit 0 }
function Count([string]$Sub) {
    $p = Join-Path $ClaudeHome $Sub
    if (Test-Path $p) { @(Get-ChildItem $p).Count } else { 0 }
}
Write-Host "rules\ecc: $(Count 'rules\ecc'), skills: $(Count 'skills'), agents: $(Count 'agents')"
if (Test-Path $agentsDir) {
    foreach ($f in Get-ChildItem (Join-Path $agentsDir '*.md')) {
        $m = Select-String -Path $f.FullName -Pattern '^model:\s*(.+)$' | Select-Object -First 1
        $model = if ($m) { $m.Matches[0].Groups[1].Value } else { '(none)' }
        Write-Host "  $($f.BaseName): $model"
    }
}
if ($patch -and @($patch.missing).Count) { Write-Host "missing agents: $($patch.missing -join ', ')" -ForegroundColor Yellow }
exit 0
