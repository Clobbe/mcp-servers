# Ralph Workflow MCP Server

Automated workflow generation from Product Requirements Documents (PRDs) using the RALPH methodology.

## Features

### Tools

#### `ralph_from_prd`

Generate a structured implementation workflow from a PRD document.

**Parameters:**

- `prd_content` (required): PRD content in markdown format
- `output_format` (optional): Output format - "markdown" or "json" (default: "markdown")

**Returns:**

- Structured workflow with phases and tasks
- Technology stack detection
- Estimated time for each task
- Validation steps for critical features

**Example:**

```typescript
const result = await ralph_from_prd({
  prd_content: `
# E-Commerce Platform

## Description
A modern e-commerce platform...

## Features
- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add items and checkout

## Technical Details
Built with TypeScript and React.
PostgreSQL database.
  `,
  output_format: 'markdown',
});
```

#### `ralph_loop`

Execute workflow tasks iteratively with progress tracking.

**Parameters:**

- `workflow_path` (required): Path to workflow JSON file
- `max_iterations` (optional): Maximum number of iterations (default: 10)
- `auto_commit` (optional): Automatically commit after each task (default: false)

**Returns:**

- Execution results with task status
- Progress tracking
- Completed/failed task counts

## Technology Detection

The server automatically detects technologies mentioned in your PRD:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java
- **Frameworks**: React, Next.js, Vue, Angular, Express, FastAPI, Django, Flask
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, DynamoDB
- **Infrastructure**: Docker, Kubernetes, AWS, GCP, Azure, Vercel, Netlify
- **Tools**: Git, GitHub, GitLab, Jest, Playwright, ESLint, Prettier, Webpack, Vite

## Workflow Structure

Generated workflows include these phases:

1. **Project Setup**: Initialize project structure and development environment
2. **Core Features**: Implement high-priority features with validation
3. **Enhanced Features**: Implement medium-priority features
4. **Additional Features**: Implement low-priority features
5. **Testing & QA**: Comprehensive testing with coverage requirements
6. **Deployment**: Build and deploy to production

## Installation

```bash
cd ralph-workflow
npm install
npm run build
```

## Usage with Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
    }
  }
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Git Worktree Integration

**RECOMMENDED**: All Ralph workflow tools include git worktree validation to promote isolated development.

### Why Worktrees?

Using git worktrees for Ralph-based development provides:

- **Clean Isolation**: Generated code stays separate from your main working directory
- **Safe Experimentation**: Iterate on implementations without affecting main branch
- **Easy Rollback**: Discard entire worktree if the generated code needs major revision
- **Better Organization**: Each feature/PRD gets its own dedicated workspace
- **Parallel Work**: Execute multiple workflows simultaneously in different worktrees

### Workflow

#### Starting Ralph Workflow

When you use `ralph_from_prd` or `ralph_loop`, the tool will:

1. **Check** if you're in a git worktree
2. **Suggest** creating one if you're not (with auto-generated commands)
3. **Proceed** with or without worktree (your choice)
4. **Include** worktree suggestion in the output if not in a worktree

**Example output:**

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
```

#### Workflow Execution in Worktree

```bash
# 1. Create worktree (if not already)
git worktree add -b "feature/my-feature" "../my-repo-my-feature"
cd "../my-repo-my-feature"

# 2. Generate workflow from PRD
ralph_from_prd({
  prd_content: "...",
  output_format: "json"
})

# 3. Execute workflow tasks
ralph_loop({
  workflow_path: "./workflow.json",
  max_iterations: 10,
  auto_commit: false
})

# 4. Manually review and commit changes
git add .
git commit -m "feat: implement feature from PRD"
git push -u origin feature/my-feature

# 5. Create PR
gh pr create --title "..." --body "..."
```

#### After PR is Merged - Cleanup

Clean up the worktree:

```bash
# 1. Verify PR is merged
gh pr view <PR_NUMBER> --json state,mergedAt

# 2. Return to main repo and pull latest
cd /path/to/main-repo
git pull origin main

# 3. Remove the worktree
git worktree remove ../my-repo-my-feature

# 4. Delete local branch (safe - only if merged)
git branch -d feature/my-feature

# 5. Optional: Delete remote branch
git push origin --delete feature/my-feature

# 6. Verify cleanup
git worktree list
git branch -a
```

### Manual Worktree Setup

```bash
# From your main repository
FEATURE_NAME="user-authentication"
REPO_NAME=$(basename $(pwd))

# Create worktree with new branch
git worktree add -b "feature/${FEATURE_NAME}" "../${REPO_NAME}-${FEATURE_NAME}"

# Switch to worktree
cd "../${REPO_NAME}-${FEATURE_NAME}"

# Now use Ralph workflow tools
ralph_from_prd({ ... })
```

### Safety Checks Before Cleanup

- ✅ Verify PR is merged: `gh pr view <PR_NUMBER>`
- ✅ No uncommitted changes: `git status`
- ✅ Branch fully merged: `git branch --merged`
- ✅ List worktrees: `git worktree list`
- ✅ Pushed all commits: `git log origin/feature/name..HEAD` (should be empty)

## Example Workflow

Given a PRD for an e-commerce platform:

```markdown
# E-Commerce Platform

## Features

- **Product Catalog**: Browse products with search and filters (high priority)
- **Shopping Cart**: Add/remove items (must have)
- **Payment Processing**: Secure checkout (critical)

## Technical Details

TypeScript with React and Next.js
PostgreSQL database
Deployed on AWS
```

The server generates:

- **Technology Stack**: TypeScript, React, Next.js, PostgreSQL, AWS
- **4 Phases** with specific tasks
- **Estimated times** for each task
- **Validation steps** for critical features
- **Commands** to run for setup and deployment

## Architecture

```
ralph-workflow/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── tools/
│   │   ├── ralph-from-prd.ts # PRD → Workflow converter
│   │   └── ralph-loop.ts     # Iterative executor
│   └── utils/
│       ├── types.ts          # TypeScript interfaces
│       ├── tech-detector.ts  # Technology detection
│       ├── prd-parser.ts     # PRD parsing
│       └── task-generator.ts # Task generation
└── __tests__/               # Comprehensive tests
```

## License

MIT
