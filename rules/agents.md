# 서브에이전트

서브에이전트는 새 컨텍스트에서 시작하고 지금까지의 대화를 모른다. 호출 시점은 `rules/override.md`의 역할 분담 표를 따른다.

## 쓸 때 / 쓰지 않을 때
| 쓸 때 | 쓰지 않을 때 |
|---|---|
| 결과만 필요한 대규모 탐색 | 파일 1~2개 수정 |
| 내가 쓴 코드의 독립 리뷰 | 메인이 이미 맥락을 다 가진 작업 |
| 서로 독립인 작업 병렬 처리 | 순차 의존 작업(A 결과가 B 입력) |
| 싼 모델로 충분한 반복 작업(문서, 검색) | "철저히" 정도의 이유 |

## 모델
| model | 에이전트 |
|---|---|
| opus | planner, architect, security-reviewer |
| sonnet | code-reviewer, java-reviewer, typescript-reviewer, react-reviewer, database-reviewer, java-build-resolver, react-build-resolver, build-error-resolver, silent-failure-hunter, tdd-guide |
| haiku | code-explorer, doc-updater, refactor-cleaner |

## 위임 프롬프트
다섯 줄을 준다. 스택과 버전(예: Java 21 / Spring Boot 3, MySQL)은 제약에 적는다.
```
[목적] 왜 필요한가
[대상] 어디를 보는가
[질문] 무엇을 찾는가
[제약] 읽기만, 스택·버전
[출력] 반환 형식과 길이
```
결과는 바로 믿지 않고 빈 곳을 되묻는다(최대 3회).

## 끝까지 거두기
위임했으면 결과를 받아 통합한 뒤 턴을 끝낸다. "기다리는 중"으로 끝내면 결과가 고아가 된다.

## 비용
- 에이전트 1회는 시스템 프롬프트·규칙·탐색 비용을 새로 낸다. 병렬 리뷰 3개면 컨텍스트 3개다.
- 메인이 이미 읽은 파일은 메인이 처리한다. 다시 읽히면 이중으로 낸다.
- 루프·팀 계열(`gan-*`, `santa-loop`, `loop-*`, `orch-*`, `multi-*`)은 토큰을 수 배 쓰므로 고가치 작업에만 쓴다.
