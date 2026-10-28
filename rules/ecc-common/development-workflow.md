# Development Workflow

> This file extends [common/git-workflow.md](./git-workflow.md) with the full feature development process that happens before git operations.

The Feature Implementation Workflow describes the development pipeline: research, planning, TDD, code review, and then committing to git.

## Feature Implementation Workflow

0. **Research & Reuse**
   - Before writing new code, check whether the codebase, the standard library, an installed dependency, or a well-maintained package already covers it. Confirm version-specific API behavior in the vendor docs (Context7) rather than from memory.

1. **Plan First** (new features only; see `rules/override.md`)
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach** (when the project has tests)
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)

3. **Code Review**
   - Agent review only when `rules/override.md` calls for it
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format
   - See [git-workflow.md](./git-workflow.md) for commit message format and PR process

5. **Pre-Review Checks**
   - Verify all automated checks (CI/CD) are passing
   - Resolve any merge conflicts
   - Ensure branch is up to date with target branch
   - Only request review after these checks pass
