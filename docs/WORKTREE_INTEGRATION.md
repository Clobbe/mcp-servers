# Git Worktree Integration for PRD/Ralph Workflow

## Overview

This document describes the git worktree validation and workflow integration added to the `prd-generator` and `ralph-workflow` MCP servers to promote isolated, safe development practices.

## Implementation Summary

### What Was Added

1. **Worktree Validation Utility** (`worktree-validator.ts`)
   - Detects if current directory is a git worktree
   - Generates contextual suggestions for worktree setup
   - Auto-generates branch and worktree names from feature/PRD names
   - Provides helpful setup commands

2. **Tool Integration**
   - **prd-generator**: `prd_create`, `prd_from_template`
   - **ralph-workflow**: `ralph_from_prd`, `ralph_loop`
   - All tools check worktree status on execution
   - Soft warnings (not blocking) with actionable suggestions

3. **Documentation**
   - Updated READMEs with worktree workflow guidance
   - Added cleanup procedures for post-merge
   - Included safety checks and best practices
   - Updated global CLAUDE.md instructions

4. **Global Instructions** (`~/.claude/CLAUDE.md`)
   - Added PRD/Ralph Workflow Guardrails section
   - Defined recommended workflow patterns
   - Included automatic worktree creation guidance
   - Documented cleanup procedures

### Files Modified

#### prd-generator
- `src/utils/worktree-validator.ts` (new)
- `src/utils/types.ts` (added `worktreeWarning` field)
- `src/tools/prd-create.ts`
- `src/tools/prd-from-template.ts`
- `README.md`

#### ralph-workflow
- `src/utils/worktree-validator.ts` (new)
- `src/tools/ralph-from-prd.ts`
- `src/tools/ralph-loop.ts`
- `README.md`

#### Global
- `~/.claude/CLAUDE.md` (added PRD/Ralph Workflow Guardrails)
- `docs/WORKTREE_INTEGRATION.md` (this document)

## How It Works

### Detection Logic

```typescript
function isInWorktree(): boolean {
  const gitCommonDir = execSync('git rev-parse --git-common-dir').trim();
  return gitCommonDir.includes('.git/worktrees');
}
```

### Feature Name Sanitization

```typescript
function sanitizeFeatureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
```

### Suggestion Generation

When not in a worktree, the tool suggests:
- Branch name: `feature/<sanitized-name>`
- Worktree path: `../<repo>-<sanitized-name>`
- Complete setup commands

## User Experience

### Example: Creating a PRD

```bash
# User runs prd_create in main repo (not in worktree)
prd_create({
  title: "User Authentication System",
  description: "JWT-based authentication with OAuth2",
  features: [...]
})
```

**Tool Response:**
```json
{
  "success": true,
  "content": "# User Authentication System\n\n...",
  "worktreeWarning": "💡 RECOMMENDATION: PRD/Ralph workflows work best in isolated git worktrees.\n\nBenefits:\n  • Clean isolation...\n\nSuggested setup:\n  git worktree add -b \"feature/user-authentication-system\" \"../mcp-servers-user-authentication-system\"\n  cd \"../mcp-servers-user-authentication-system\"\n\n⚠️  Proceeding without worktree isolation."
}
```

### Example: Ralph Workflow

```bash
# User runs ralph_from_prd in main repo (not in worktree)
ralph_from_prd({
  prd_content: "# E-Commerce Platform\n\n...",
  output_format: "markdown"
})
```

**Tool Response:**
```
✅ Generated workflow for "E-Commerce Platform" with 4 phases

💡 RECOMMENDATION: PRD/Ralph workflows work best in isolated git worktrees.

Benefits:
  • Clean isolation from your main working directory
  • Safe experimentation without affecting main branch
  • Easy rollback if generated code needs revision
  • Better organization for feature development

Suggested setup:
  git worktree add -b "feature/e-commerce-platform" "../my-repo-e-commerce-platform"
  cd "../my-repo-e-commerce-platform"

Then retry your command in the new worktree.

⚠️  Proceeding without worktree isolation.
```

## Recommended Workflow

### 1. Start Feature Development

```bash
# From main repository
FEATURE="user-authentication"
REPO=$(basename $(pwd))

# Create worktree
git worktree add -b "feature/${FEATURE}" "../${REPO}-${FEATURE}"
cd "../${REPO}-${FEATURE}"
```

### 2. Generate and Execute

```bash
# Generate PRD
prd_from_template({
  template: "api-service",
  projectName: "User Authentication API"
})

# Generate workflow
ralph_from_prd({
  prd_content: "...",
  output_format: "json"
})

# Execute workflow
ralph_loop({
  workflow_path: "./workflow.json",
  max_iterations: 10
})
```

### 3. Review and Commit

```bash
# Review changes
git status
git diff

# Commit
git add .
git commit -m "feat: implement user authentication from PRD"

# Push
git push -u origin feature/user-authentication
```

### 4. Create Pull Request

```bash
gh pr create \
  --title "feat: User authentication system" \
  --body "Implements JWT-based authentication with OAuth2 support..."
```

### 5. After PR Merge - Cleanup

```bash
# Verify merge
gh pr view <PR_NUMBER> --json state,mergedAt

# Return to main repo
cd /path/to/main-repo
git pull origin main

# Remove worktree
git worktree remove ../my-repo-user-authentication

# Delete branch (safe - only if merged)
git branch -d feature/user-authentication

# Optional: Delete remote branch
git push origin --delete feature/user-authentication

# Verify cleanup
git worktree list
```

## Safety Features

### Pre-Cleanup Checks

Before cleaning up a worktree:

1. ✅ **Verify PR merged**: `gh pr view <PR> --json state`
2. ✅ **No uncommitted changes**: `git status` (should be clean)
3. ✅ **Branch fully merged**: `git branch --merged`
4. ✅ **All commits pushed**: `git log origin/feature..HEAD` (empty)
5. ✅ **List worktrees**: `git worktree list`

### Safe Delete Commands

```bash
# Safe branch delete (fails if not merged)
git branch -d feature/name

# Force delete (use with caution)
git branch -D feature/name

# Safe worktree remove (checks for uncommitted changes)
git worktree remove path

# Force remove (use with caution)
git worktree remove --force path
```

## Design Decisions

### Soft Warning vs Hard Block

**Decision**: Use soft warnings instead of hard blocks.

**Rationale**:
- User preferences vary
- Some projects may not benefit from worktrees
- Promotes best practices without being prescriptive
- Allows flexibility for quick tests/experiments

### Automatic Creation vs Manual

**Decision**: Suggest automatic creation but don't force it.

**Rationale**:
- Users should understand what's being created
- Explicit is better than implicit
- Provides educational value
- Respects user's workflow preferences

### No Exceptions

**Decision**: All PRD/Ralph tools show worktree suggestions if not in a worktree.

**Rationale**:
- Consistent experience across all tools
- Reinforces best practices
- Simple mental model
- No edge cases to remember

## Testing

### All Tests Pass

- **prd-generator**: 16/16 tests pass ✅
- **ralph-workflow**: 88/88 tests pass ✅

### Build Status

Both servers compile without TypeScript errors.

```bash
# prd-generator
npm run build  # ✅ Success

# ralph-workflow
npm run build  # ✅ Success
```

## Benefits

### For Users

1. **Better Organization**: Each feature in its own workspace
2. **Safer Development**: Isolated from main branch
3. **Easy Rollback**: Discard entire worktree if needed
4. **Parallel Work**: Multiple features simultaneously
5. **Clear Boundaries**: Explicit feature scope

### For Code Quality

1. **Focused Commits**: Each worktree = one feature
2. **Clean History**: No mixed concerns
3. **Better Reviews**: Clear PR boundaries
4. **Easier Testing**: Isolated test environments
5. **Risk Reduction**: Main branch protected

## Future Enhancements

Potential improvements:

1. **Automatic Cleanup**: Detect merged PRs and suggest cleanup
2. **Worktree Status Command**: List all worktrees with status
3. **Integration with CI/CD**: Run tests in worktree before push
4. **Worktree Templates**: Pre-configured worktree setups
5. **Smart Suggestions**: Context-aware worktree recommendations

## Conclusion

The git worktree integration provides a non-intrusive way to promote best practices for PRD-based and Ralph workflow development. By suggesting rather than enforcing, it educates users while respecting their preferences and workflows.
