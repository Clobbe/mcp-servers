# Parallel Work Guidelines

## For Multiple AI Agents Working Simultaneously

This document provides guardrails for when multiple AI agents are working on the same project at the same time.

## Critical Rules for Parallel Work

### 1. Work Isolation (MANDATORY)

**Each agent MUST work on separate, non-overlapping parts of the codebase.**

✅ **SAFE - Can work in parallel:**
```
Agent A: Working on changelog-manager/src/tools/new-tool-1.ts
Agent B: Working on changelog-manager/src/tools/new-tool-2.ts
```

❌ **UNSAFE - Will cause conflicts:**
```
Agent A: Working on changelog-manager/src/index.ts
Agent B: Working on changelog-manager/src/index.ts (SAME FILE)
```

### 2. File Ownership During Work (MANDATORY)

**Before starting work on a file, agent MUST:**

1. **Announce intent:**
   ```
   "I will be working on src/tools/changelog-diff.ts"
   ```

2. **Wait for confirmation** that no other agent is working on:
   - The same file
   - Related files that would cause conflicts
   - The same feature area

3. **Reserve the file** until work is complete

### 3. Coordination Points (MANDATORY)

**Certain files require coordination when multiple agents need them:**

#### High-Conflict Files (One agent at a time):
- `src/index.ts` - MCP server entry point (wiring)
- `package.json` - Dependencies
- `README.md` - Main documentation
- `src/utils/types.ts` - Shared types

**Rule:** Only ONE agent can modify these files at a time.

**Workflow:**
```
Agent A: "I need to modify src/index.ts to register my tool"
Agent B: "Acknowledged, I will wait"
Agent A: [completes work and commits]
Agent A: "src/index.ts is now free"
Agent B: "Pulling latest changes, proceeding with my work"
```

### 4. Branch Strategy for Parallel Work (MANDATORY)

**Each agent MUST work in their own feature branch:**

```bash
# Agent A
git checkout -b agent-a/feature/add-diff-tool

# Agent B
git checkout -b agent-b/feature/add-export-tool
```

**Branch naming convention:**
```
agent-{id}/{type}/{description}

Examples:
- agent-a/feature/add-diff-tool
- agent-b/fix/symlink-resolution
- agent-c/docs/improve-readme
```

### 5. Pull Before Push (MANDATORY)

**Before pushing, ALWAYS:**

```bash
# 1. Commit your work
git commit -m "feat: add my feature"

# 2. Pull latest from main
git checkout main
git pull origin main

# 3. Rebase your branch
git checkout agent-a/feature/my-feature
git rebase main

# 4. Resolve any conflicts
# Fix conflicts if they exist

# 5. Run tests
npm test

# 6. Push your branch
git push origin agent-a/feature/my-feature
```

### 6. Communication Protocol (MANDATORY)

**Agents MUST communicate about:**

#### Before Starting Work:
```
Agent A: "Starting work on: changelog_diff tool"
Agent A: "Files I will modify:"
Agent A: "  - src/tools/changelog-diff.ts (new)"
Agent A: "  - __tests__/tools/changelog-diff.test.ts (new)"
Agent A: "  - src/index.ts (register tool)"
Agent A: "  - README.md (add documentation)"
Agent A: "ETA: 30 minutes"
```

#### During Work:
```
Agent A: "Completed changelog-diff implementation"
Agent A: "Now working on tests"
```

#### After Completion:
```
Agent A: "Work complete on changelog_diff"
Agent A: "Commits: 5"
Agent A: "Branch: agent-a/feature/add-diff-tool"
Agent A: "All tests passing ✓"
Agent A: "Ready for review"
```

#### When Blocked:
```
Agent B: "Blocked: Need src/index.ts to register my tool"
Agent B: "Waiting for Agent A to complete"
```

### 7. Merge Order (MANDATORY)

**Merges to main MUST be serialized (one at a time):**

```
Agent A: Completes feature → Merges to main → Success
Agent B: Waits for A → Pulls latest → Rebases → Merges to main
Agent C: Waits for B → Pulls latest → Rebases → Merges to main
```

**Never merge in parallel to avoid race conditions.**

### 8. Dependency Management (CRITICAL)

**Only ONE agent can modify package.json at a time.**

**Workflow:**
```
Agent A: "I need to add dependency 'X'"
Agent B: "I also need to add dependency 'Y'"

Coordinator: "Agent A, proceed. Agent B, wait."

Agent A: [adds dependency, commits, pushes]
Agent A: "package.json updated, dependency X added"

Agent B: [pulls latest, adds dependency Y, commits, pushes]
Agent B: "package.json updated, dependency Y added"
```

### 9. Test Isolation (IMPORTANT)

**Tests MUST be isolated and not depend on each other.**

✅ **GOOD:**
```typescript
test('should handle case A', async () => {
  const input = createTestData(); // Isolated
  const result = await myTool(input);
  expect(result).toBeDefined();
});

test('should handle case B', async () => {
  const input = createTestData(); // Isolated
  const result = await myTool(input);
  expect(result).toBeDefined();
});
```

❌ **BAD:**
```typescript
let sharedState = {};

test('should handle case A', async () => {
  sharedState.value = 'A'; // Affects other tests
});

test('should handle case B', async () => {
  expect(sharedState.value).toBe('A'); // Depends on other test
});
```

### 10. Conflict Resolution (MANDATORY)

**When conflicts occur:**

1. **Stop and communicate:**
   ```
   Agent A: "Conflict detected in src/index.ts"
   Agent A: "Conflict with Agent B's changes"
   ```

2. **Determine priority:**
   - Which feature is more critical?
   - Which is further along?
   - Which is simpler to rebase?

3. **Coordinate resolution:**
   ```
   Agent B: "My changes are simpler, I will rebase"
   Agent B: [rebases and resolves conflicts]
   Agent B: [re-runs tests]
   Agent B: "Conflicts resolved, tests passing"
   ```

4. **Never force push without coordination**

## Work Allocation Strategies

### Strategy 1: Feature-Based Isolation

**Best for:** Independent features

```
Agent A: Implements changelog_diff tool (complete isolation)
Agent B: Implements changelog_search tool (complete isolation)
Agent C: Improves documentation (separate files)
```

### Strategy 2: Layer-Based Isolation

**Best for:** Complex features

```
Agent A: Implements utilities layer
  - src/utils/diff-engine.ts
  - __tests__/utils/diff-engine.test.ts

Agent B: Implements tools layer (depends on A)
  - src/tools/changelog-diff.ts (uses A's utilities)
  - __tests__/tools/changelog-diff.test.ts

Agent C: Documentation layer (can work in parallel)
  - README.md updates
  - API documentation
```

### Strategy 3: Server-Based Isolation

**Best for:** Multiple MCP servers

```
Agent A: Works on changelog-manager/ (complete isolation)
Agent B: Works on ralph-workflow/ (complete isolation)
Agent C: Works on shared documentation (coordinates with A & B)
```

## Communication Templates

### Starting Work

```markdown
## Work Assignment: [Agent ID]

**Feature:** Add changelog_diff tool
**Branch:** agent-a/feature/add-diff-tool
**Files to create:**
- src/tools/changelog-diff.ts
- __tests__/tools/changelog-diff.test.ts

**Files to modify:**
- src/index.ts (will coordinate)
- README.md (will coordinate)

**Estimated time:** 45 minutes
**Dependencies:** None
**Blocks:** None

**Status:** Starting now
```

### Requesting Access to Shared File

```markdown
## File Access Request: [Agent ID]

**File:** src/index.ts
**Reason:** Need to register changelog_diff tool
**Changes:** ~10 lines (import + tool registration)
**When:** After completing tool implementation
**ETA:** 15 minutes from now

**Checking:** Is anyone currently working on src/index.ts?
```

### Completing Work

```markdown
## Work Complete: [Agent ID]

**Feature:** changelog_diff tool ✓
**Branch:** agent-a/feature/add-diff-tool
**Commits:** 7
  - feat: add diff engine utility
  - test: add diff engine tests
  - feat: add changelog_diff tool
  - test: add changelog_diff tests
  - feat: register changelog_diff in server
  - docs: add changelog_diff documentation
  - fix: handle edge case in diff algorithm

**Tests:** All passing ✓
**Coverage:** 87% ✓
**Build:** Success ✓

**Files released:**
- src/index.ts (now available)
- README.md (now available)

**Ready for:** Review and merge
```

## Pre-Merge Checklist (Parallel Work)

Before merging your branch to main:

- [ ] Pulled latest from main
- [ ] Rebased your branch onto latest main
- [ ] Resolved all conflicts (if any)
- [ ] All tests pass (`npm test`)
- [ ] Coverage >= 80%
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Tested manually in MCP client
- [ ] Communicated merge intent
- [ ] Confirmed no other agent is merging
- [ ] All commits follow conventional format
- [ ] Documentation updated

## Troubleshooting Parallel Work Issues

### Issue: Merge Conflict

**Symptoms:** Git reports conflicts when pulling/rebasing

**Solution:**
```bash
# 1. Communicate
echo "Agent A: Conflict detected, resolving..."

# 2. Pull latest
git checkout main
git pull origin main

# 3. Rebase
git checkout agent-a/feature/my-feature
git rebase main

# 4. Resolve conflicts manually
# Edit conflicted files

# 5. Continue rebase
git add .
git rebase --continue

# 6. Test
npm test

# 7. Push (force with lease)
git push origin agent-a/feature/my-feature --force-with-lease
```

### Issue: Test Failures After Merge

**Symptoms:** Tests pass locally but fail after merging

**Solution:**
1. Pull latest main
2. Rebase your branch
3. Run ALL tests (not just yours)
4. Fix any broken tests
5. Commit fixes
6. Push again

### Issue: Two Agents Need Same File

**Symptoms:** Both agents need to modify src/index.ts

**Solution:**
```
Agent A: "I need src/index.ts for 5 minutes"
Agent B: "Acknowledged, I'll wait"

[Agent A completes]

Agent A: "src/index.ts released"
Agent B: "Pulling changes, proceeding"
```

### Issue: Dependency Conflicts

**Symptoms:** Different agents add conflicting dependencies

**Solution:**
1. Coordinate before adding dependencies
2. Discuss which version to use
3. One agent adds the dependency
4. Other agents pull before continuing

## Best Practices

### ✅ DO

- Communicate before starting work
- Work in isolated branches
- Pull frequently (every 15-30 minutes)
- Test before and after merging
- Keep commits small and focused
- Coordinate on shared files
- Use meaningful branch names
- Document what you're working on

### ❌ DON'T

- Work on same file simultaneously
- Force push without coordination
- Merge without pulling latest
- Skip communication
- Work directly on main branch
- Make large, sweeping changes
- Modify files without announcing
- Assume other agents know what you're doing

## Summary

**For successful parallel work:**

1. **Isolate** - Work on different files/features
2. **Communicate** - Announce what you're doing
3. **Coordinate** - Share access to common files
4. **Pull often** - Stay synchronized
5. **Test everything** - Before and after merges
6. **Branch properly** - Use clear naming
7. **Serialize merges** - One at a time to main

**When in doubt, communicate with other agents!**
