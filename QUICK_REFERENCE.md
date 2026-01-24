# Quick Reference - MCP Servers

## For AI Agents

### 🚨 Critical Rules

1. **Incremental Commits** - Commit after EVERY logical change, not at the end
2. **Conventional Commits** - Use `feat:`, `fix:`, `docs:`, etc.
3. **TypeScript Strict** - No `any` without reason
4. **Test Before Commit** - `npm run build` + manual test

### 📋 Commit Checklist

Before every commit:
- [ ] Code compiles
- [ ] No TypeScript errors
- [ ] Tested manually
- [ ] Docs updated (if needed)
- [ ] Commit message uses conventional format
- [ ] Commit is small and focused

### 🔄 Development Pattern

```
1. Create file     → git commit -m "feat: add X"
2. Add function    → git commit -m "feat: implement Y"
3. Wire together   → git commit -m "feat: integrate Z"
4. Update docs     → git commit -m "docs: document Z"
5. Test & fix      → git commit -m "fix: handle edge case"
```

### ✅ Good Commits

```bash
git commit -m "feat: add TypeScript types for changelog"
git commit -m "feat: add git status utility"
git commit -m "feat: implement changelog_init tool"
git commit -m "feat: wire changelog_init into server"
git commit -m "docs: add usage examples for changelog_init"
```

### ❌ Bad Commits

```bash
git commit -m "feat: add entire changelog manager"  # Too large
git commit -m "update stuff"                         # Not conventional
git commit -m "WIP"                                  # Not descriptive
```

## Project Structure

```
mcp-servers/
├── .cursorrules          # AI guidelines (READ THIS FIRST)
├── .clauderc             # Claude Code config
├── CONTRIBUTING.md       # Development workflow
├── README.md             # Project overview
├── QUICK_REFERENCE.md    # This file
│
└── server-name/
    ├── README.md         # Server docs
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts     # MCP entry point
    │   ├── tools/       # One tool per file
    │   └── utils/       # Shared utilities
    └── build/           # Compiled (gitignored)
```

## Common Commands

```bash
# Install dependencies
cd server-name && npm install

# Build
npm run build

# Watch mode
npm run watch

# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Git status
git status

# Review changes before committing
git diff

# Stage and commit
git add file.ts
git commit -m "feat: add feature X"

# View commit history
git log --oneline
```

## Conventional Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat:` | New features | `feat: add new_tool implementation` |
| `fix:` | Bug fixes | `fix: resolve symlink issue on macOS` |
| `docs:` | Documentation | `docs: add usage examples` |
| `refactor:` | Code restructuring | `refactor: extract parser to utility` |
| `test:` | Tests | `test: add unit tests for parser` |
| `chore:` | Maintenance | `chore: update dependencies` |
| `perf:` | Performance | `perf: optimize file reading` |
| `style:` | Formatting | `style: fix indentation` |

## MCP Tool Template

```typescript
export const myToolSchema = {
  name: 'my_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param'],
  },
};

export async function myTool(args: { param: string }) {
  try {
    // Implementation
    return {
      summary: '✅ Success!',
      data: result,
    };
  } catch (error) {
    return {
      summary: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
```

## File Naming

- **Files**: `kebab-case.ts`
- **Functions**: `camelCase`
- **Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **MCP Tools**: `snake_case`

## Import Pattern

```typescript
// Always use .js extension (ESM requirement)
import { helper } from '../utils/helpers.js';
import type { MyType } from '../utils/types.js';
```

## Error Handling

```typescript
// ✅ Good
try {
  const result = await operation();
  return { summary: '✅ Success', data: result };
} catch (error) {
  return {
    summary: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
  };
}

// ❌ Bad
const result = await operation(); // No error handling
throw new Error('Something failed'); // Don't throw, return error message
```

## Documentation

Every exported function needs JSDoc:

```typescript
/**
 * Brief description of what this function does
 * 
 * @param input - Description of parameter
 * @returns Description of return value
 * @throws Description of when it throws
 */
export function myFunction(input: string): Result {
  // ...
}
```

## Testing Workflow

```bash
# 1. Build
npm run build

# 2. Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# 3. Update MCP client config
# Edit ~/.claude/settings.json or equivalent

# 4. Restart MCP client

# 5. Test via natural language
# "Use tool_name to do X"
```

## When Unsure

1. Read `.cursorrules`
2. Check `CONTRIBUTING.md`
3. Look at existing code patterns
4. **ASK THE USER** - Don't guess

## Quick Links

- [Conventional Commits](https://www.conventionalcommits.org/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

## Remember

**Small commits = Professional history = Easy to review = Easy to revert**

Make 5-15 commits per feature, not 1!
