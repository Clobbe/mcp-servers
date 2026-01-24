# Quick Reference - MCP Servers

## For AI Agents

### 🚨 Critical Rules

1. **Incremental Commits** - Commit after EVERY logical change, not at the end
2. **Comprehensive Tests** - Write Playwright tests for ALL features (min 80% coverage)
3. **Conventional Commits** - Use `feat:`, `fix:`, `docs:`, `test:`, etc.
4. **TypeScript Strict** - No `any` without reason
5. **Test Before Commit** - `npm test` + `npm run build` + manual test

### 📋 Commit Checklist

Before every commit:
- [ ] Code compiles (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] Coverage >= 80% (`npm test -- --coverage`)
- [ ] Tested manually in MCP client (for features)
- [ ] Docs updated (if needed)
- [ ] Commit message uses conventional format
- [ ] Commit is small and focused

### 🔄 Development Pattern

```
1. Create types    → git commit -m "feat: add types for X"
2. Add utility     → git commit -m "feat: implement utility Y"
3. Write tests     → git commit -m "test: add tests for utility Y"
4. Add tool        → git commit -m "feat: implement tool Z"
5. Write tests     → git commit -m "test: add comprehensive tests for Z"
6. Wire together   → git commit -m "feat: register Z in server"
7. Update docs     → git commit -m "docs: document Z usage"
8. Run tests       → npm test
9. Fix issues      → git commit -m "fix: handle edge case in Z"
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

# Run tests (REQUIRED before commits)
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test __tests__/tools/my-tool.test.ts

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
# 1. Write tests
# Create __tests__/tools/my-tool.test.ts

# 2. Run automated tests
npm test

# 3. Check coverage
npm test -- --coverage
# Ensure >= 80%

# 4. Build
npm run build

# 5. Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# 6. Update MCP client config
# Edit ~/.claude/settings.json or equivalent

# 7. Restart MCP client

# 8. Test via natural language
# "Use tool_name to do X"
```

## Playwright Test Template

```typescript
import { test, expect, describe } from '@playwright/test';
import { myTool } from '../src/tools/my-tool.js';

describe('my_tool', () => {
  describe('happy path', () => {
    test('should process valid input', async () => {
      const result = await myTool({ param: 'valid' });
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Success');
    });
  });

  describe('error handling', () => {
    test('should reject empty input', async () => {
      const result = await myTool({ param: '' });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('Error');
    });

    test('should handle missing file', async () => {
      const result = await myTool({ param: '/nonexistent' });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle very long input', async () => {
      const longString = 'a'.repeat(10000);
      const result = await myTool({ param: longString });
      expect(result).toBeDefined();
    });
  });
});
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

**Tests = Reliable software = Fewer bugs = Better design**

Make 5-15 commits per feature, not 1!  
Write tests for EVERY feature, no exceptions!
