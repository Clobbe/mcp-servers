# Phase 3: Changelog Manager Server

**Timeline**: Day 2 Morning (4 hours)
**Focus**: Implement all 9 changelog management tools

## Objectives

- Implement complete changelog management toolset
- Git operations integration for changelog commits
- Symlink resolution for cross-repo changelog
- Validation and error handling
- Write comprehensive Playwright tests (80%+ coverage)

## Tools to Implement (9 total)

### 1. `changelog_init` - Initialize new changelog

### 2. `changelog_add_entry` - Add new entry to changelog

### 3. `changelog_update` - Update existing changelog entry

### 4. `changelog_validate` - Validate changelog format

### 5. `changelog_generate_release` - Generate release notes

### 6. `changelog_diff` - Compare changelog versions

### 7. `changelog_search` - Search changelog entries

### 8. `changelog_export` - Export changelog to different formats

### 9. `changelog_stats` - Get changelog statistics

## Implementation Approach

Break down into 4 commits per tool:

1. Tool implementation
2. Tests for tool
3. Integration into server
4. Documentation update

Total: ~36 commits for this phase

## Directory Structure

```
changelog-manager/
├── src/
│   ├── index.ts
│   ├── tools/
│   │   ├── changelog-init.ts
│   │   ├── changelog-add-entry.ts
│   │   ├── changelog-update.ts
│   │   ├── changelog-validate.ts
│   │   ├── changelog-generate-release.ts
│   │   ├── changelog-diff.ts
│   │   ├── changelog-search.ts
│   │   ├── changelog-export.ts
│   │   └── changelog-stats.ts
│   └── utils/
│       ├── types.ts
│       ├── parser.ts
│       ├── validator.ts
│       ├── formatter.ts
│       └── git-helper.ts
├── __tests__/
│   ├── tools/
│   └── utils/
└── README.md
```

## Quick Implementation Guide

### Tool 1: changelog_init

```typescript
export const changelogInitSchema = {
  name: 'changelog_init',
  description: 'Initialize a new CHANGELOG.md file with Keep a Changelog format',
  inputSchema: {
    type: 'object',
    properties: {
      project_name: { type: 'string', description: 'Project name' },
      initial_version: { type: 'string', description: 'Initial version', default: '0.1.0' },
      file_path: {
        type: 'string',
        description: 'Path for CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
    required: ['project_name'],
  },
};
```

### Tool 2: changelog_add_entry

```typescript
export const changelogAddEntrySchema = {
  name: 'changelog_add_entry',
  description: 'Add a new entry to the Unreleased section',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'],
        description: 'Entry category',
      },
      description: { type: 'string', description: 'Entry description' },
      file_path: { type: 'string', description: 'Path to CHANGELOG.md', default: './CHANGELOG.md' },
    },
    required: ['category', 'description'],
  },
};
```

### Tool 3: changelog_update

```typescript
export const changelogUpdateSchema = {
  name: 'changelog_update',
  description: 'Update an existing changelog entry',
  inputSchema: {
    type: 'object',
    properties: {
      version: { type: 'string', description: 'Version to update or "Unreleased"' },
      category: { type: 'string', description: 'Category to update' },
      old_text: { type: 'string', description: 'Text to find' },
      new_text: { type: 'string', description: 'New text' },
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
    required: ['version', 'category', 'old_text', 'new_text'],
  },
};
```

### Tool 4: changelog_validate

```typescript
export const changelogValidateSchema = {
  name: 'changelog_validate',
  description: 'Validate changelog format against Keep a Changelog standard',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', default: './CHANGELOG.md' },
      strict: { type: 'boolean', description: 'Strict validation mode', default: false },
    },
  },
};
```

### Tool 5: changelog_generate_release

```typescript
export const changelogGenerateReleaseSchema = {
  name: 'changelog_generate_release',
  description: 'Generate release notes from Unreleased section',
  inputSchema: {
    type: 'object',
    properties: {
      version: { type: 'string', description: 'New version number' },
      date: { type: 'string', description: 'Release date (YYYY-MM-DD)', default: 'today' },
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
    required: ['version'],
  },
};
```

### Tool 6: changelog_diff

```typescript
export const changelogDiffSchema = {
  name: 'changelog_diff',
  description: 'Compare two versions in changelog',
  inputSchema: {
    type: 'object',
    properties: {
      version1: { type: 'string', description: 'First version' },
      version2: { type: 'string', description: 'Second version' },
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
    required: ['version1', 'version2'],
  },
};
```

### Tool 7: changelog_search

```typescript
export const changelogSearchSchema = {
  name: 'changelog_search',
  description: 'Search changelog entries',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: { type: 'string', description: 'Filter by category (optional)' },
      version: { type: 'string', description: 'Filter by version (optional)' },
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
    required: ['query'],
  },
};
```

### Tool 8: changelog_export

```typescript
export const changelogExportSchema = {
  name: 'changelog_export',
  description: 'Export changelog to different formats',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'html', 'text'],
        description: 'Export format',
      },
      output_path: { type: 'string', description: 'Output file path' },
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
    required: ['format', 'output_path'],
  },
};
```

### Tool 9: changelog_stats

```typescript
export const changelogStatsSchema = {
  name: 'changelog_stats',
  description: 'Get statistics about changelog',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', default: './CHANGELOG.md' },
    },
  },
};
```

## Shared Utilities

### parser.ts - Changelog parser

```typescript
export interface ChangelogEntry {
  category: string;
  description: string;
}

export interface ChangelogVersion {
  version: string;
  date?: string;
  entries: {
    [category: string]: ChangelogEntry[];
  };
}

export interface ParsedChangelog {
  title: string;
  description: string;
  versions: ChangelogVersion[];
}

export function parseChangelog(content: string): ParsedChangelog {
  // Implementation
}
```

### validator.ts - Format validation

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateChangelog(content: string, strict: boolean = false): ValidationResult {
  // Implementation
}
```

### formatter.ts - Output formatting

```typescript
export function formatAsMarkdown(changelog: ParsedChangelog): string {
  // Implementation
}

export function formatAsJSON(changelog: ParsedChangelog): string {
  // Implementation
}

export function formatAsHTML(changelog: ParsedChangelog): string {
  // Implementation
}
```

### git-helper.ts - Git operations

```typescript
export async function commitChangelog(
  filePath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation
}

export async function getChangelogRepo(filePath: string): Promise<string> {
  // For symlink resolution
  // Implementation
}
```

## Commit Strategy (36 commits)

```bash
# For each tool (repeat 9 times):

# 1. Implement utility functions
git commit -m "feat: add parser utility for changelog"

# 2. Implement tool
git commit -m "feat: implement changelog_init tool"

# 3. Add tests
git commit -m "test: add tests for changelog_init"

# 4. Wire into server
git commit -m "feat: register changelog_init in MCP server"

# After all 9 tools:
git commit -m "docs: update README with all changelog tools"
git commit -m "test: verify 80%+ test coverage"
git commit -m "chore: build and validate changelog-manager server"
```

## Testing Strategy

```typescript
// Example test structure
describe('changelog_init', () => {
  describe('happy path', () => {
    test('should create valid CHANGELOG.md', async () => {
      const result = await changelogInit({
        project_name: 'Test Project',
        initial_version: '0.1.0',
      });
      expect(result.summary).toContain('✅');
    });
  });

  describe('error handling', () => {
    test('should reject invalid version', async () => {
      const result = await changelogInit({
        project_name: 'Test',
        initial_version: 'invalid',
      });
      expect(result.summary).toContain('❌');
    });
  });
});
```

## Build & Validate

```bash
cd changelog-manager

# Install
npm install

# Build
npm run build

# Test
npm test

# Coverage
npm test -- --coverage

# Test MCP
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Validation Checklist

- [ ] All 9 tools implemented
- [ ] All tools have comprehensive tests
- [ ] Test coverage >= 80%
- [ ] All TypeScript compiles
- [ ] Git operations work correctly
- [ ] Symlink resolution works
- [ ] Error handling for all edge cases
- [ ] Tool listing via stdio works
- [ ] Documentation complete

## Time Breakdown

- Shared utilities (parser, validator, formatter): 60 min
- Tool 1-3 implementation + tests: 60 min
- Tool 4-6 implementation + tests: 60 min
- Tool 7-9 implementation + tests: 60 min
- Integration and testing: 30 min
- Documentation: 30 min
- **Total**: ~4 hours

## Next Steps

Proceed to [Phase 4: Code Tools Server](04-code-tools-server.md)
