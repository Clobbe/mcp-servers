# Phase 4: Code Tools Server

**Timeline**: Day 2 Afternoon (2 hours)
**Focus**: Simple template-based code analysis tools

## Objectives

- Implement 5 simple code analysis tools
- Template-based for rapid development
- Basic AST parsing and analysis
- Comprehensive tests

## Tools to Implement (5 total)

### 1. `code_analyze_complexity` - Analyze code complexity

### 2. `code_find_duplicates` - Find duplicate code

### 3. `code_list_functions` - List all functions in file

### 4. `code_count_lines` - Count lines of code

### 5. `code_detect_issues` - Detect common code issues

## Directory Structure

```
code-tools/
├── src/
│   ├── index.ts
│   ├── tools/
│   │   ├── analyze-complexity.ts
│   │   ├── find-duplicates.ts
│   │   ├── list-functions.ts
│   │   ├── count-lines.ts
│   │   └── detect-issues.ts
│   └── utils/
│       ├── types.ts
│       ├── parser.ts
│       └── analyzer.ts
└── __tests__/
```

## Quick Implementation

### Tool Schemas

```typescript
// 1. Complexity Analysis
export const analyzeComplexitySchema = {
  name: 'code_analyze_complexity',
  description: 'Analyze cyclomatic complexity of code',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string' },
      threshold: { type: 'number', default: 10 },
    },
    required: ['file_path'],
  },
};

// 2. Find Duplicates
export const findDuplicatesSchema = {
  name: 'code_find_duplicates',
  description: 'Find duplicate code blocks',
  inputSchema: {
    type: 'object',
    properties: {
      directory: { type: 'string' },
      min_lines: { type: 'number', default: 5 },
    },
    required: ['directory'],
  },
};

// 3. List Functions
export const listFunctionsSchema = {
  name: 'code_list_functions',
  description: 'List all functions in a file',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string' },
      include_private: { type: 'boolean', default: false },
    },
    required: ['file_path'],
  },
};

// 4. Count Lines
export const countLinesSchema = {
  name: 'code_count_lines',
  description: 'Count lines of code (excluding comments and blank lines)',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      include_tests: { type: 'boolean', default: false },
    },
    required: ['path'],
  },
};

// 5. Detect Issues
export const detectIssuesSchema = {
  name: 'code_detect_issues',
  description: 'Detect common code issues',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string' },
      severity: {
        type: 'string',
        enum: ['all', 'error', 'warning'],
        default: 'all',
      },
    },
    required: ['file_path'],
  },
};
```

## Commit Strategy (15 commits)

```bash
# Utilities
git commit -m "feat: add code parser utility"
git commit -m "feat: add code analyzer utility"

# Tool 1
git commit -m "feat: implement code_analyze_complexity"
git commit -m "test: add tests for complexity analysis"

# Tool 2
git commit -m "feat: implement code_find_duplicates"
git commit -m "test: add tests for duplicate detection"

# Tool 3
git commit -m "feat: implement code_list_functions"
git commit -m "test: add tests for function listing"

# Tool 4
git commit -m "feat: implement code_count_lines"
git commit -m "test: add tests for line counting"

# Tool 5
git commit -m "feat: implement code_detect_issues"
git commit -m "test: add tests for issue detection"

# Integration
git commit -m "feat: register all code tools in MCP server"
git commit -m "docs: add README for code-tools server"
git commit -m "test: verify 80%+ coverage for code-tools"
```

## Time Breakdown

- Shared utilities: 20 min
- Tools 1-2 + tests: 30 min
- Tools 3-4 + tests: 30 min
- Tool 5 + tests: 20 min
- Integration: 10 min
- Documentation: 10 min
- **Total**: ~2 hours

## Next Steps

Proceed to [Phase 5: Context Manager Server](05-context-manager-server.md)
