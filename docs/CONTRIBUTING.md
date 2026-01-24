# Contributing to MCP Servers

## Development Workflow

### Setting Up for Development

1. **Clone the repository:**
   ```bash
   cd ~/dev/tooling/mcp-servers
   ```

2. **Install dependencies for a specific server:**
   ```bash
   cd changelog-manager
   npm install
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

4. **Watch for changes during development:**
   ```bash
   npm run watch
   ```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Write tests (MANDATORY):**
   ```bash
   # Write tests in __tests__/ directory
   # Use Playwright testing framework
   ```

4. **Run tests:**
   ```bash
   npm test                    # Run all tests
   npm test -- --coverage      # Check coverage (min 80%)
   ```

5. **Build:**
   ```bash
   npm run build
   
   # Test tool listing
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
   ```

6. **Commit incrementally with conventional commit format:**
   ```bash
   # Commit small, focused changes
   git add src/utils/new-helper.ts
   git commit -m "feat: add helper function for X"
   
   git add src/tools/new-tool.ts
   git commit -m "feat: add new_tool for Y"
   
   git add README.md
   git commit -m "docs: document new_tool usage"
   ```

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

**Important:** Make small, incremental commits for each logical change, not one large commit at the end.

### Adding a New Tool to an Existing Server

1. Create a new file in `src/tools/`:
   ```typescript
   // src/tools/my-new-tool.ts
   export const myNewToolSchema = {
     name: 'my_new_tool',
     description: 'What this tool does',
     inputSchema: {
       type: 'object',
       properties: {
         param1: {
           type: 'string',
           description: 'Parameter description',
         },
       },
       required: ['param1'],
     },
   };

   export async function myNewTool(args: { param1: string }) {
     // Implementation
     return {
       result: 'Success',
     };
   }
   ```

2. **Commit the new tool:**
   ```bash
   git add src/tools/my-new-tool.ts
   git commit -m "feat: add my_new_tool for doing X"
   ```

3. **Write tests (MANDATORY):**
   ```bash
   git add __tests__/tools/my-new-tool.test.ts
   git commit -m "test: add comprehensive tests for my_new_tool"
   ```

4. Register in `src/index.ts`:
   ```typescript
   import { myNewToolSchema, myNewTool } from './tools/my-new-tool.js';

   // Add to ListToolsRequestSchema handler
   tools: [
     // ... existing tools
     myNewToolSchema,
   ],

   // Add to CallToolRequestSchema handler
   case 'my_new_tool': {
     const result = await myNewTool(args as any);
     return {
       content: [{ type: 'text', text: result.result }],
     };
   }
   ```

5. **Commit the integration:**
   ```bash
   git add src/index.ts
   git commit -m "feat: wire up my_new_tool in MCP server"
   ```

6. **Run tests:**
   ```bash
   npm test
   # Fix any issues
   git add src/tools/my-new-tool.ts
   git commit -m "fix: handle edge case in my_new_tool"
   ```

7. **Build:**
   ```bash
   npm run build
   ```

8. **Commit documentation:**
   ```bash
   git add README.md
   git commit -m "docs: add my_new_tool usage examples"
   ```

### Creating a New MCP Server

1. **Create directory structure:**
   ```bash
   mkdir -p new-server/src/{tools,utils}
   cd new-server
   ```

2. **Commit directory structure:**
   ```bash
   git add .
   git commit -m "chore: create new-server directory structure"
   ```

3. **Add package.json:**
   ```bash
   # Create package.json
   git add package.json
   git commit -m "chore: add new-server package configuration"
   ```

4. **Add tsconfig.json:**
   ```bash
   # Create tsconfig.json
   git add tsconfig.json
   git commit -m "chore: add TypeScript configuration"
   ```

5. **Implement incrementally** - commit each utility, each tool, then wire it all together

6. **Update root README.md:**
   ```bash
   git add ../README.md
   git commit -m "docs: add new-server to project overview"
   ```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public functions
- Use meaningful variable names
- Keep functions focused and small

## Testing

### Automated Testing (MANDATORY)

All features MUST have comprehensive tests using Playwright.

**Writing Tests:**

```typescript
// __tests__/tools/my-tool.test.ts
import { test, expect, describe } from '@playwright/test';
import { myTool } from '../../src/tools/my-tool.js';

describe('my_tool', () => {
  describe('happy path', () => {
    test('should process valid input', async () => {
      const result = await myTool({ param: 'valid' });
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should reject invalid input', async () => {
      const result = await myTool({ param: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle extreme values', async () => {
      // Test edge cases
    });
  });
});
```

**Running Tests:**

```bash
npm test                    # Run all tests
npm test -- --coverage      # Check coverage (min 80%)
npm test -- --watch         # Watch mode
```

**Coverage Requirements:**
- Minimum 80% code coverage
- All error cases must be tested
- All edge cases must be tested

### Manual Testing

After automated tests pass:

```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Test in Claude Code
# 1. Update ~/.claude/settings.json
# 2. Restart Claude Code
# 3. Use tools via natural language
```

## Documentation

- Update README.md for user-facing changes
- Update tool schemas with clear descriptions
- Add examples in documentation
- Keep CONTRIBUTING.md up to date

## Git Workflow

### Branch Strategy

- `main` - Stable, production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Incremental Commits Best Practices

✅ **Good - Small, focused commits:**
```bash
git commit -m "feat: add TypeScript types for changelog"
git commit -m "feat: add git status utility function"
git commit -m "feat: add changelog parser"
git commit -m "feat: add changelog_init tool"
git commit -m "feat: wire changelog_init into server"
git commit -m "docs: add changelog_init usage examples"
```

❌ **Bad - One large commit:**
```bash
git commit -m "feat: implement entire changelog-manager server"
```

### Before Committing

1. All tests pass: `npm test`
2. Coverage >= 80%: `npm test -- --coverage`
3. Build succeeds: `npm run build`
4. No TypeScript errors: `npx tsc --noEmit`
5. Test manually in MCP client
6. Documentation updated if needed
7. No console.log() or debugging code

### Commit Messages

Good:
```
feat: add changelog_diff tool for comparing entries
fix: resolve symlink resolution on Linux
docs: add troubleshooting section to README
refactor: extract validation logic to separate file
```

Bad:
```
update stuff
fix bug
changes
WIP
```

## Release Process

1. **Update version** in package.json
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.1.0"
   ```

2. **Build:** `npm run build`

3. **Tag:**
   ```bash
   git tag v1.1.0
   ```

4. **Push:**
   ```bash
   git push && git push --tags
   ```

## Questions?

Open an issue or discussion in the repository.
