> **회사 PC에서는 실행하지 말 것.** 개인 PC 또는 새 환경 전용이다. `~/.claude`의 CLAUDE.md, settings.json, rules, agents, hooks를 덮어쓰고 ECC를 설치한다.

# ynnh-harness

Claude Code 개인 설정 묶음. Java 17 / Spring Boot 3, TypeScript, React 기준이다.

| 경로 | 내용 |
|---|---|
| `CLAUDE.md`, `rules/override.md` | 작업 크기별 역할 분담(ponytail / superpowers / ECC 에이전트), ECC 규칙 덮기 |
| `settings.json` | 모델(opus), ECC hook 비활성 목록, 플러그인·마켓플레이스, permissions |
| `agents/models.json` | ECC 에이전트별 모델과 스택 줄 (`lib/patch-agents.js`가 적용) |
| `hooks/block-dangerous.js` | 위험 명령 차단 hook |
| `install.ps1` | 위 항목 설치, ECC 설치·정리, MCP 등록 |

## 사전 요구
node(npx 포함), git, Claude Code(`claude` 명령).

## 설치
머신 정책이 스크립트 실행을 막으므로 반드시 아래 형식으로 실행한다.

```powershell
# 1. 먼저 DryRun: 아무것도 바꾸지 않고 할 일만 출력
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -DryRun
# 2. 실제 설치
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
```

| 파라미터 | 의미 |
|---|---|
| `-ClaudeHome <경로>` | 대상 디렉터리 (기본 `~/.claude`). 다른 경로를 주면 `-SkipEcc`도 같이 줘야 한다 (npx ecc / claude mcp는 항상 실제 홈을 바꾸기 때문) |
| `-DryRun` | 변경 없이 단계만 출력 |
| `-SkipEcc` | ECC 설치와 MCP 등록 건너뜀 |
| `-TrimOnly` | 테스트 전용(ECC 정리만 실행). 직접 쓰지 않는다 |

설치 후 Claude Code를 재시작하면 플러그인 설치 제안이 뜬다. 승인해야 설치된다.

## 되돌리기
- 기존 설정: `~/.claude\backups\pre-harness-<시각>\`의 항목(CLAUDE.md, settings.json, rules, agents, hooks)을 `~/.claude`로 복사해 원복.
- ECC에서 정리된 항목: `~/.claude\backups\ecc-trim-<시각>\`.

## 주의
- `permissions.deny`(.env, secrets 읽기, 강제 push, `curl`)는 **실수 방지층**이지 보안 경계가 아니다. 우회 가능하다.
- 샌드박스는 네이티브 Windows에서 돌지 않는다. 쓰려면 WSL2 안에서 Claude Code를 실행한다.
- `settings.json`의 `ECC_DISABLED_HOOKS`(세션 메모리 관련 hook ID)는 로컬에 설치된 ECC 기준으로 정했다. 첫 실제 설치 후 `~/.claude/hooks/hooks.json`의 ID와 대조해 다르면 고친다.

## 테스트
```powershell
node --test
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Pester test\install.Tests.ps1"
```
(Pester 테스트는 임시 `-ClaudeHome`을 쓰지만 회사 PC에서는 돌리지 않는다.)

## 검증 기록
새 환경에서 설치 후 채운다 (설계 7절).

- [ ] 새 세션 `/context` 상주 토큰 (설치 전: ____ / 후: ____)
- [ ] "이 함수 오타 고쳐줘" -> 질문 없이 바로 수정
- [ ] "알림 기능 추가하고 싶어" -> 질문부터
- [ ] 6개 파일 변경 후 리뷰 요청 -> 에이전트 호출
- [ ] `cat .env` 요청 거부
- [ ] 위험 삭제 명령이 hook으로 차단
- [ ] `/agents`에서 모델 표시 확인

실패 시 설계 3절대로 플러그인 hook 조정을 새 작업으로 올린다.
