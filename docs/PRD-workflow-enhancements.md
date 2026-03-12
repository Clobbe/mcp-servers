# PRD: Workflow Enhancements — LLM-Agnostic Feature Development Automation

**Date**: 2026-02-18
**Source**: Session analysis of ~76 AI-assisted development sessions (Jan–Feb 2026)
**Scope**: `mcp-servers` repository — enhancements to prd-generator, ralph-workflow, and shared workflow documentation
**Target**: Works across Claude Code, OpenCode, Gemini CLI, Cursor, Continue.dev, and any MCP-compatible client

---

## Background

Analysis of 76 development sessions reveals highly consistent but heavily manual workflows. The same 15 messages are typed every feature session, across every LLM client. The friction is not client-specific — it is workflow-specific.

The mcp-servers stack already supports multiple LLM clients via `platform-configs/`. The enhancements in this PRD follow the same pattern: implement once as MCP tools or shared documentation, deploy everywhere via platform config.

**Top friction points (ranked by frequency):**

| Rank | Pattern | Sessions | Type |
|------|---------|----------|------|
| 1 | 4-step kickoff typed manually every session | 25+ | Workflow doc gap |
| 2 | 8–10 manual messages for PR lifecycle | 50+ | Missing MCP tool |
| 3 | Context window exhaustion with no handoff | 10+ | Missing MCP tool |
| 4 | Worktree omission requiring mid-session correction | 5+ | Workflow doc gap |
| 5 | Attribution ("Generated with Claude") in PRs | Several | Config gap |
| 6 | Manual "create follow-up issues for medium/low" | 8+ | Missing MCP tool |

---

## Goals

- Automate the PR lifecycle (commit → push → create PR → CI poll → review → fix → merge → cleanup) into a single MCP tool
- Provide a session handoff tool that survives context window exhaustion
- For task lists > 6 tasks: parallelize independent work across sub-agents to reduce wall-clock time and context pressure
- Capture all workflow best practices in a single shared document any LLM can reference
- Keep platform-specific config files thin: they reference the shared doc, not duplicate it
- No breaking changes to existing tools

## Non-Goals

- Azure/infrastructure-specific automation
- Changing prd-generator's PRD format
- Parallelizing tasks within a single stream (sub-agents work on independent streams, not racing on the same file)

---

## Architecture Principle

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Shared Layer (LLM-agnostic)                      │
│  docs/WORKFLOW.md        — canonical workflow documentation           │
│  ralph-workflow/         — MCP tools:                                │
│    issue_start           — kickoff: worktree + PRD + tasks           │
│    pr_ship               — full PR lifecycle automation              │
│    session_checkpoint    — context handoff / save-state              │
│    ralph_from_prd        — enhanced: emits dependency graph          │
│    ralph_loop            — enhanced: parallel execution mode         │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ referenced by
  ┌────────────────────────┼─────────────────────────────┐
  ▼                        ▼                             ▼
CLAUDE.md              .cursorrules           opencode / gemini config
(thin wrap)            (thin wrap)            (platform-configs/ files)
```

**Parallelization model** (applies when task count > 6):

```
Orchestrator (main agent)
├── analyzes task dependency graph from ralph_from_prd
├── groups independent tasks into streams (no shared file ownership)
│
├── Wave 1: dispatch sub-agents in parallel
│   ├── Sub-agent A → Stream 1 (tasks 1, 4, 7)
│   ├── Sub-agent B → Stream 2 (tasks 2, 5)
│   └── Sub-agent C → Stream 3 (tasks 3, 6)
│
├── collect results, write session_checkpoint between waves
│
└── Wave 2: dependent tasks run after wave 1 completes
    └── Sub-agent D → Stream 4 (tasks 8, 9, 10)  ← depend on wave 1
```

Rules and patterns live **once** in shared documentation and MCP tools. Platform-specific files are thin adapters that point to the shared layer.

---

## Requirements

---

### REQ-1: Shared Workflow Documentation (`docs/WORKFLOW.md`)

**Priority**: P1
**Type**: Documentation
**Replaces**: Rules currently scattered across CLAUDE.md, .cursorrules

Create a single authoritative document at `docs/WORKFLOW.md` that any LLM client can be instructed to read at session start. This document defines the canonical workflow, conventions, and rules — **once** — so all platform adapters stay thin.

**Content sections:**

1. **Default Feature Development Sequence**
   - When asked to work on a GitHub issue, always: create worktree → read issue → run prd-generator → convert to tasks → execute ralph-loop
   - Do not pause for confirmation between setup steps
   - Use `issue_start` MCP tool (REQ-2) if available

2. **Git Worktree Conventions**
   - Branch naming: `feature/issue-{N}-{slug}`
   - Worktree path: `../{repo}-issue-{N}-{slug}`
   - Always notify user of exact path before creating (for permission grants in restricted clients)

3. **PR Lifecycle Sequence**
   - After implementation: use `pr_ship` MCP tool (REQ-3) if available
   - Manual fallback sequence if tool unavailable: stage → commit (conventional format) → push → create PR → poll CI → categorize feedback → fix critical/high → create issues for medium/low → merge → cleanup

4. **Attribution Rules (Hard Rules)**
   - Never include "Generated with [AI tool name]" or equivalent in: commits, PR titles, PR body, issue bodies, markdown files
   - Applies to all LLM clients — this is a universal rule, not Claude-specific

5. **PR Feedback Handling**
   - Critical/High: fix in current PR before merging
   - Medium/Low: create one GitHub issue per item, label `enhancement` + `P3`
   - Never merge with unresolved Critical issues

6. **TDD Approach in ralph-loop**
   - For code tasks: write/update tests before implementing
   - A task is complete only when tests pass
   - Run the project's test suite after each ralph-loop task

7. **Session Handoff**
   - When context is filling up, run `session_checkpoint` MCP tool (REQ-4) before losing state
   - The checkpoint file at `./session-checkpoint.md` contains everything needed to resume

---

### REQ-2: New MCP Tool — `issue_start`

**Priority**: P1
**Server**: `ralph-workflow`
**Replaces**: The 4-step kickoff message typed manually in 25+ sessions

**Tool name**: `issue_start`

**Description**: Unified feature development kickoff. Given a GitHub issue number, this tool:
1. Reads the issue via `gh issue view {N}`
2. Derives a branch name and worktree path from issue title
3. Creates the git worktree
4. Calls `prd_create` (from prd-generator) with the issue content as input
5. Converts the PRD to a ralph tasks file
6. Returns the worktree path, branch name, tasks file path, and suggested resume command

**Input schema**:
```typescript
{
  issue_number: number,           // GitHub issue number
  repo_path?: string,             // defaults to current directory
  start_ralph_loop?: boolean,     // if true, also starts the loop (default: false)
  worktree_base_path?: string,    // defaults to sibling directory of repo
}
```

**Output**: Structured response with paths, branch name, PRD summary, tasks count, and next-step instructions.

**Notes**:
- Does NOT assume `gh` CLI auth — returns clear error if gh is not authenticated
- Works with any GitHub-hosted repo regardless of LLM client
- Worktree validation from existing `worktree-validator.ts` applies
- Conventional error messages (no LLM-specific terminology in responses)

---

### REQ-3: New MCP Tool — `pr_ship`

**Priority**: P1
**Server**: `ralph-workflow`
**Replaces**: 8–10 sequential manual messages per feature session

**Tool name**: `pr_ship`

**Description**: Full PR lifecycle automation. Given a completed worktree, this tool runs the complete sequence:

**Phases** (each reported back as it progresses):

1. **Commit phase**
   - Run `git status` to list changed files
   - Stage specific files (never `git add -A`)
   - Generate a conventional commit message from the diff summary
   - Present to user for approval (with `auto_commit` flag to skip)
   - Commit with the approved message

2. **Push phase**
   - `git push -u origin <branch>`

3. **PR creation phase**
   - Generate PR title (conventional format) and body (summary + test plan)
   - `gh pr create` with the generated content
   - No attribution text in PR body

4. **CI polling phase** (background)
   - Poll `gh pr checks` every 2 minutes, up to `max_wait_minutes` (default: 20)
   - Return early if all checks pass
   - Report which checks failed with direct links

5. **Review feedback phase**
   - `gh pr view --comments` + `gh pr reviews`
   - Parse and categorize feedback: Critical / High / Medium / Low
   - Return structured categorized list

6. **Fix phase** (optional, controlled by `fix_critical_high` flag)
   - Apply Critical and High fixes autonomously
   - Commit each fix separately
   - Push updated branch

7. **Follow-up issues phase** (optional, controlled by `create_followup_issues` flag)
   - For each Medium/Low item: `gh issue create` with label `enhancement` and `P3`
   - Link back to original PR

8. **Merge phase** (optional, controlled by `auto_merge` flag)
   - `gh pr merge --squash` (or `--merge` based on repo config)
   - `git pull origin main` on main branch

9. **Cleanup phase** (optional, controlled by `cleanup_worktree` flag)
   - `git worktree remove <path>` from main repo
   - `git branch -d <branch>`

**Input schema**:
```typescript
{
  worktree_path?: string,         // defaults to current directory
  commit_message?: string,        // optional override; auto-generated if not provided
  auto_commit?: boolean,          // skip commit message approval (default: false)
  max_wait_minutes?: number,      // CI poll timeout (default: 20)
  fix_critical_high?: boolean,    // auto-fix Critical/High review items (default: false)
  create_followup_issues?: boolean, // create GH issues for Medium/Low items (default: true)
  auto_merge?: boolean,           // merge after CI passes (default: false)
  cleanup_worktree?: boolean,     // remove worktree after merge (default: false)
  dry_run?: boolean,              // report what would happen without executing (default: false)
}
```

**Notes**:
- All flags default to the conservative (non-destructive) option
- `dry_run: true` outputs a full plan without executing — useful for verification
- No LLM-specific terminology in output; plain git/gh output with structured summaries
- Works with any GitHub-hosted repo

---

### REQ-4: New MCP Tool — `session_checkpoint`

**Priority**: P2
**Server**: `ralph-workflow`
**Replaces**: Lost state when context window is exhausted mid-ralph-loop

**Tool name**: `session_checkpoint`

**Description**: Writes a structured handoff document to the current worktree so a new session can resume with full context.

**Output file**: `./session-checkpoint.md` in the current directory

**Content**:
1. Current date/time and session summary
2. Repository name, branch, worktree path
3. `git status` snapshot (staged, unstaged, untracked)
4. ralph-loop task file path and current progress (completed / in-progress / pending tasks)
5. Last 5 git commits on this branch
6. Open GitHub PR link (if any)
7. Exact command to resume: `"Open Claude Code / OpenCode / your AI client in <path> and say: 'continue from session-checkpoint.md'"`

**Input schema**:
```typescript
{
  checkpoint_path?: string,       // defaults to ./session-checkpoint.md
  session_summary?: string,       // optional human-provided summary to include
  tasks_file?: string,            // path to ralph tasks.json to capture progress
}
```

**Notes**:
- Output file must be human-readable without AI interpretation
- Resume instruction must be tool-agnostic (no "say this to Claude Code" — say "say this to your AI assistant")

---

### REQ-5: Parallel Execution Mode for ralph-loop

**Priority**: P2
**Server**: `ralph-workflow`
**Touches**: `ralph_from_prd` (enhanced output) + `ralph_loop` (new execution mode)

**Problem**: Task lists > 6 items run sequentially in a single context window, causing:
- Slow wall-clock time (tasks block on each other unnecessarily)
- Context pressure that triggers exhaustion mid-loop
- Single point of failure (one stuck task halts everything)

**Solution**: When task count exceeds a configurable threshold, the orchestrator analyzes task dependencies and file ownership, groups independent tasks into parallel streams, and dispatches sub-agents per stream. Waves execute sequentially; tasks within a wave execute in parallel.

---

#### REQ-5a: Dependency Graph Output from `ralph_from_prd`

`ralph_from_prd` currently emits a flat ordered task list. Enhance it to also emit a dependency graph.

**New fields in task output** (backwards-compatible addition):

```typescript
interface RalphTask {
  id: string,
  title: string,
  description: string,
  // ... existing fields ...

  // NEW: dependency metadata
  depends_on: string[],         // task IDs that must complete before this one starts
  touches_files: string[],      // inferred file paths this task will modify
  stream_hint?: string,         // optional grouping label (e.g. "tests", "api", "infra")
}
```

**Dependency inference rules** (best-effort, not guaranteed accurate):
- Setup/init tasks → no dependencies
- Implementation tasks → depend on setup
- Test tasks → depend on the implementation task they test
- Documentation tasks → depend on what they document
- Integration tasks → depend on all component tasks they integrate
- Final tasks (migration, status update) → depend on everything

**File ownership inference**: Use existing `tech-detector.ts` + task description keywords to predict which files a task will touch. Tasks sharing predicted file paths cannot be in the same parallel stream.

---

#### REQ-5b: Parallel Execution Mode in `ralph_loop`

**New input flag**: `execution_strategy: "sequential" | "parallel" | "auto"` (default: `"auto"`)

**`"auto"` behaviour**:
- Task count ≤ 6 → sequential (existing behaviour, unchanged)
- Task count > 6 → parallel if client supports sub-agents, else sequential with auto-checkpoint

**Parallel execution algorithm**:

```
1. Load task list + dependency graph
2. Build execution waves:
   - Wave N contains all tasks whose dependencies are satisfied by previous waves
   - Within a wave, group tasks into streams by file ownership
     (tasks sharing predicted file paths → same stream, executed sequentially within stream)
3. For each wave:
   a. Write session_checkpoint before dispatching
   b. Dispatch one sub-agent per stream
      - Each sub-agent receives: task list for its stream, repo path, branch, and a
        "context packet" (relevant files, prior wave summary)
   c. Wait for all streams in the wave to complete
   d. Collect results: git diffs, test output, task status per stream
   e. If any stream fails: report failure, offer retry or fallback to sequential
   f. Commit wave results with a conventional commit per completed task
4. After all waves: report summary (completed, failed, skipped tasks)
```

**Sub-agent context packet** (what each sub-agent receives):
- The tasks assigned to its stream
- Current git branch and worktree path
- Summary of what prior waves completed (not full history)
- Relevant project files (detected by `touches_files` from the task list)
- The project's test command

**Input schema additions**:
```typescript
{
  // existing fields unchanged...

  // NEW
  execution_strategy?: "sequential" | "parallel" | "auto",  // default: "auto"
  parallel_threshold?: number,    // min tasks to trigger parallel mode (default: 6)
  max_parallel_streams?: number,  // max sub-agents at once (default: 3)
  checkpoint_between_waves?: boolean, // write session_checkpoint after each wave (default: true)
}
```

**Fallback behaviour**:
- If the client does not support sub-agents → log a warning, fall back to sequential with auto-checkpoint every N tasks
- If a sub-agent exceeds its own context limit → it writes a stream-level checkpoint; orchestrator resumes that stream in a new sub-agent
- If file conflict is detected post-merge → orchestrator reports conflict, does not auto-resolve

---

#### REQ-5c: Client Capability Detection

The orchestrator needs to know whether the current client supports sub-agents before dispatching.

Add a simple capability detection utility:
```typescript
// Returns true if the runtime environment supports spawning sub-agents
function supportsSubAgents(): boolean
```

Detection approach: check for environment variable `CLAUDE_CODE_SUBAGENT_SUPPORT` or equivalent, with a conservative default of `false` (falls back to sequential).

---

### REQ-6: Platform Config Updates

**Priority**: P2
**Type**: Configuration

Update all files in `platform-configs/` to:
1. Reference the new `issue_start`, `pr_ship`, and `session_checkpoint` MCP tools (they live in ralph-workflow, so no new server entry needed)
2. Add an instruction to load `docs/WORKFLOW.md` at session start where the platform supports it

**Files to update**:
- `platform-configs/claude-code-settings.json`
- `platform-configs/opencode-settings.json`
- `platform-configs/gemini-config.json`

---

### REQ-7: Thin Platform Adapter Updates

**Priority**: P2
**Type**: Configuration (non-code)

Update the platform-specific instruction files to be thin wrappers that reference `docs/WORKFLOW.md` rather than duplicating rules.

**Files to update**:
- `.cursorrules` — Add at top: "For workflow conventions, read `docs/WORKFLOW.md` in this repository"
- `~/.claude/CLAUDE.md` — The PRD/Ralph Guardrails section already exists; add reference to `docs/WORKFLOW.md` and the three new MCP tools
- OpenCode equivalent instruction file (if exists) — same pattern

**What NOT to duplicate in platform adapters**:
- Worktree naming conventions (live in WORKFLOW.md)
- PR lifecycle steps (live in WORKFLOW.md + pr_ship tool)
- Attribution rules (live in WORKFLOW.md)
- Feedback triage rules (live in WORKFLOW.md)

**What CAN stay platform-specific**:
- Permission grants for specific paths (Claude Code-specific)
- Keybinding configurations
- Model selection
- Client-specific formatting preferences

---

## Implementation Phases

### Phase 1: Shared Workflow Documentation (REQ-1)
- [ ] Create `docs/WORKFLOW.md` with all 7 sections
- [ ] Update `.cursorrules` to reference `WORKFLOW.md` (thin wrapper)
- [ ] Update `README.md` to mention `WORKFLOW.md` as the workflow reference

### Phase 2: MCP Tool — `session_checkpoint` (REQ-4)
- [ ] Add `src/tools/session-checkpoint.ts` to ralph-workflow
- [ ] Wire into `src/index.ts`
- [ ] Write Playwright tests (`__tests__/session-checkpoint.test.ts`)
- [ ] Build and validate

### Phase 3: MCP Tool — `pr_ship` (REQ-3)
- [ ] Add `src/tools/pr-ship.ts` to ralph-workflow
- [ ] Implement the 9-phase sequence with individual phase flags
- [ ] Add `dry_run` support
- [ ] Wire into `src/index.ts`
- [ ] Write Playwright tests covering each phase and flag combination
- [ ] Build and validate

### Phase 4: MCP Tool — `issue_start` (REQ-2)
- [ ] Add `src/tools/issue-start.ts` to ralph-workflow
- [ ] Integrate with prd-generator via subprocess or shared util
- [ ] Wire into `src/index.ts`
- [ ] Write Playwright tests
- [ ] Build and validate

### Phase 5: Parallel Execution (REQ-5)
- [ ] Enhance `ralph_from_prd`: add `depends_on`, `touches_files`, `stream_hint` fields to task output
- [ ] Write Playwright tests for dependency graph output
- [ ] Add `supportsSubAgents()` capability detection utility to `shared/utils/`
- [ ] Implement wave builder + stream grouper in `ralph-workflow/src/utils/parallel-planner.ts`
- [ ] Add `execution_strategy` and related flags to `ralph_loop`
- [ ] Implement sequential fallback with auto-checkpoint when sub-agents unavailable
- [ ] Write Playwright tests for parallel mode (mock sub-agent dispatch)
- [ ] Build and validate

### Phase 6: Platform Config Updates (REQ-6, REQ-7)
- [ ] Update `platform-configs/opencode-settings.json`
- [ ] Update `platform-configs/gemini-config.json`
- [ ] Update `platform-configs/claude-code-settings.json`
- [ ] Update global `~/.claude/CLAUDE.md` to reference new tools and WORKFLOW.md

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Manual messages per feature session | ~15 | ~4 |
| 4-step kickoff typed per session | Required | `issue_start` tool handles it |
| PR lifecycle manual messages | 8–10 | `pr_ship` handles it (1 tool call) |
| Lost state on context limit | Frequent | `session_checkpoint` saves state |
| Task lists > 6: wall-clock time | Sequential (N tasks × avg time) | Parallel (longest wave × avg time) |
| Task lists > 6: context exhaustion | High risk | Mitigated (sub-agents have isolated contexts) |
| Platform-specific rule duplication | High | Zero — single WORKFLOW.md |
| Attribution in PRs/commits | Occasional | Zero |
| Works in OpenCode | Partial (MCP only) | Full (MCP + shared docs) |

---

## Open Questions

1. **`issue_start` prd-generator integration**: Should `issue_start` call `prd_create` via MCP inter-tool call, or invoke the prd-generator subprocess directly? The latter is simpler but creates coupling.

2. **`pr_ship` CI polling**: Background polling works well in Claude Code's bash background tasks. In OpenCode/Gemini, this may block. Should `pr_ship` support a `polling: "background" | "foreground" | "skip"` mode?

3. **`session_checkpoint` trigger**: Should ralph-loop automatically write a checkpoint between every wave (parallel mode) and every N tasks (sequential mode), or only on explicit invocation?

4. **`WORKFLOW.md` discoverability**: How does an LLM client know to load it? Options:
   - Instruct in each platform adapter (thin reference, already planned)
   - Add a `workflow_docs` field to MCP server config (non-standard)
   - Include in each tool's response as a footer hint

5. **PR body attribution**: OpenCode may inject its own attribution. Should `pr_ship` actively strip known attribution patterns from generated PR body text?

6. **Dependency graph accuracy**: The `ralph_from_prd` dependency inference is best-effort. When the graph is wrong (false dependency or missing dependency), parallel streams may conflict. Should there be a `--verify-deps` dry-run mode that shows the planned wave/stream layout before committing to it?

7. **Sub-agent context packet size**: Sub-agents need enough context to work autonomously but not so much that they hit their own context limits. What's the right scoping — just the task description and touched files, or should prior wave git diffs be included?

8. **Parallel threshold default**: The default of 6 tasks is a guess. Should this be project-configurable (e.g. in a `.ralph-config.json`) so teams can tune it per repo?
