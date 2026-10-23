$script = Join-Path (Split-Path -Parent $PSScriptRoot) 'install.ps1'

function Invoke-Install([string]$home_, [switch]$DryRun) {
    $a = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $script, '-ClaudeHome', $home_, '-SkipEcc')
    if ($DryRun) { $a += '-DryRun' }
    & powershell @a | Out-Null
}

function New-Home([string]$name) {
    $h = Join-Path $TestDrive $name
    New-Item -ItemType Directory -Force $h | Out-Null
    $h
}

Describe 'install.ps1' {
    It 'stops on csharp rules' {
        $h = New-Home 'csharp'
        New-Item -ItemType Directory -Force (Join-Path $h 'rules\ecc\csharp') | Out-Null
        Invoke-Install $h
        $LASTEXITCODE | Should Be 1
        Test-Path (Join-Path $h 'settings.json') | Should Be $false
    }

    It 'dry run writes nothing' {
        $h = New-Home 'dry'
        Set-Content (Join-Path $h 'settings.json') '{"theme":"dark"}'
        $before = (Get-ChildItem -Recurse $TestDrive | ForEach-Object FullName) -join '|'
        Invoke-Install $h -DryRun
        $after = (Get-ChildItem -Recurse $TestDrive | ForEach-Object FullName) -join '|'
        $LASTEXITCODE | Should Be 0
        $after | Should Be $before
    }

    It 'backs up existing settings' {
        $h = New-Home 'backup'
        [IO.File]::WriteAllText((Join-Path $h 'settings.json'), '{"theme":"dark"}')
        Invoke-Install $h
        $LASTEXITCODE | Should Be 0
        @(Get-ChildItem (Join-Path $h 'backups\pre-harness-*\settings.json')).Count | Should Be 1
        (Get-Content -Raw (Join-Path $h 'settings.json') | ConvertFrom-Json).theme | Should Be 'dark'
    }

    It 'second run identical' {
        $h = New-Home 'twice'
        Invoke-Install $h
        $first = Get-Content -Raw (Join-Path $h 'settings.json')
        Invoke-Install $h
        $LASTEXITCODE | Should Be 0
        Get-Content -Raw (Join-Path $h 'settings.json') | Should Be $first
    }

    It 'installs files' {
        $h = New-Home 'files'
        Invoke-Install $h
        $LASTEXITCODE | Should Be 0
        foreach ($f in 'CLAUDE.md', 'rules\override.md', 'rules\ecc\common\agents.md', 'hooks\block-dangerous.js') {
            Test-Path (Join-Path $h $f) | Should Be $true
        }
    }
}
