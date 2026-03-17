# Code Tools MCP Server

A Model Context Protocol (MCP) server providing code analysis and quality tools for TypeScript/JavaScript projects.

## Features

This server provides **10 powerful code analysis and quality tools**:

## Analysis Tools (5)

### 1. `code_analyze_complexity` - Cyclomatic Complexity Analysis

Analyze the complexity of functions in your code to identify areas that may need refactoring.

**Usage:**

```typescript
{
  "file_path": "src/myFile.ts",
  "threshold": 10  // Optional, default: 10
}
```

**Returns:**

- Total complexity across all functions
- List of functions with their complexity scores
- Functions exceeding the threshold
- Average complexity

### 2. `code_find_duplicates` - Duplicate Code Detection

Find duplicate code blocks across multiple files to help reduce code duplication.

**Usage:**

```typescript
{
  "directory": "src/",
  "min_lines": 5  // Optional, minimum consecutive lines to consider, default: 5
}
```

**Returns:**

- List of duplicate code blocks
- Locations where each duplicate appears
- Number of files scanned

### 3. `code_list_functions` - Function Listing

List all functions in a TypeScript/JavaScript file using the TypeScript Compiler API for accurate parsing.

**Usage:**

```typescript
{
  "file_path": "src/myFile.ts",
  "include_private": false  // Optional, include non-exported functions, default: false
}
```

**Returns:**

- Function names and signatures
- Line numbers
- Export status (exported/private)
- Async status
- Parameters and return types

### 4. `code_count_lines` - Lines of Code Counter

Count lines of code, excluding comments and blank lines, for accurate code metrics.

**Usage:**

```typescript
{
  "path": "src/",  // Can be file or directory
  "include_tests": false  // Optional, include test files, default: false
}
```

**Returns:**

- Total lines
- Code lines
- Comment lines
- Blank lines
- Per-file breakdown (for directories)

### 5. `code_detect_issues` - Common Issues Detector

Detect common code issues and anti-patterns in your codebase.

**Usage:**

```typescript
{
  "file_path": "src/myFile.ts",
  "severity": "all"  // Optional: "all", "error", "warning", default: "all"
}
```

**Detects:**

- `console.log()` statements (should use `console.error()` for MCP servers)
- `var` usage (should use `const`/`let`)
- `==` instead of `===`
- `any` type usage
- `debugger` statements
- TODO/FIXME comments

**Returns:**

- List of issues with line numbers
- Severity categorization (error/warning)
- Issues grouped by rule
- Total count of errors and warnings

## Pipeline Tools (5)

### 6. `code_run_tests` - Test Suite Execution

Run your project's test suite and get structured pass/fail results. Auto-detects npm/pnpm/yarn with Jest, Vitest, Playwright, or dotnet test.

**Usage:**

```typescript
{
  "directory": "./",
  "test_command": "npm test",  // Optional, auto-detected
  "timeout_ms": 60000  // Optional, default: 60000
}
```

**Returns:**

- Test results (passed/failed/skipped)
- Execution time
- Test output summary

### 7. `code_check_coverage` - Test Coverage Analysis

Run tests with coverage reporting and validate against thresholds. Supports Jest/Vitest (TypeScript/JavaScript) and dotnet test with Coverlet (.NET).

**Usage:**

```typescript
{
  "directory": "./",
  "threshold": 80  // Optional, minimum % coverage required, default: 80
}
```

**Returns:**

- Overall line coverage percentage
- Per-file coverage breakdown
- Pass/fail based on threshold

### 8. `code_security_scan` - Security Vulnerability Scanner

Scan source files for security vulnerabilities including hardcoded secrets, injection risks, insecure crypto, and more. Supports TypeScript/JavaScript and .NET/C#.

**Usage:**

```typescript
{
  "path": "src/",  // File or directory
  "severity": "high"  // Optional: "all", "critical", "high", "medium", "low", "info", default: "all"
}
```

**Detects:**

- Hardcoded secrets (API keys, passwords, tokens)
- SQL injection vulnerabilities
- Command injection risks
- Insecure cryptography
- Unsafe deserialization
- Path traversal vulnerabilities

### 9. `code_type_check` - TypeScript/C# Type Checking

Run type checking on a project: `tsc --noEmit` for TypeScript or `dotnet build` for .NET/C#. Returns structured errors and warnings.

**Usage:**

```typescript
{
  "directory": "./",
  "config_path": "tsconfig.json"  // Optional, TypeScript only, auto-detected
}
```

**Returns:**

- Type errors with file paths and line numbers
- Warnings
- Success/failure status

### 10. `code_diff_summary` - Git Diff Analysis

Produce a structured summary of git changes between two refs. Shows files changed, insertions, deletions, and change type per file.

**Usage:**

```typescript
{
  "directory": "./",
  "base": "HEAD~1",  // Optional, default: HEAD~1
  "head": "HEAD"     // Optional, default: HEAD
}
```

**Returns:**

- Files changed
- Lines added/deleted per file
- Change types (added/modified/deleted)
- Total diff statistics

## Installation

```bash
cd code-tools
npm install
npm run build
```

## Usage

### With Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "code-tools": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/code-tools/build/index.js"]
    }
  }
}
```

### With OpenCode

Add to `~/.opencode/settings.json` (same format as above).

### With Gemini CLI

Add to `~/.gemini/config.json` (same format as above).

## Example Interactions

### Analysis Tools

```
"Use code_analyze_complexity to analyze src/index.ts with a threshold of 5"

"Use code_list_functions to list all exported functions in src/tools/analyzer.ts"

"Use code_count_lines to count lines in the src directory"

"Use code_detect_issues to find issues in src/utils/parser.ts"

"Use code_find_duplicates to find duplicate code in src/ with minimum 8 lines"
```

### Pipeline Tools

```
"Use code_run_tests to run the test suite in the current directory"

"Use code_check_coverage to check test coverage with 85% threshold"

"Use code_security_scan to scan src/ for security vulnerabilities"

"Use code_type_check to validate TypeScript types in the current project"

"Use code_diff_summary to show what changed in the last commit"
```

## Development

### Running Tests

```bash
npm test                 # Run all tests
npm test -- --coverage   # Run with coverage
```

### Building

```bash
npm run build    # Compile TypeScript
npm run watch    # Watch mode for development
```

### Code Quality

```bash
npm run lint          # Check linting
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code
npm run type-check    # Check TypeScript types
```

## Technical Details

### Parsing Strategy

This server uses a **hybrid approach** for optimal performance and accuracy:

- **TypeScript Compiler API** for `code_list_functions` (most accurate function parsing)
- **Regex-based parsing** for complexity analysis and line counting (faster, good enough for metrics)
- **Hash-based duplicate detection** for finding duplicate code blocks

### Supported File Types

**Analysis Tools:**

- TypeScript: `.ts`, `.tsx`
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`

**Pipeline Tools:**

- TypeScript/JavaScript projects (npm/pnpm/yarn/bun)
- .NET/C# projects (dotnet CLI)

### Performance

- **Fast**: Analyzes most files in <100ms
- **Memory efficient**: Processes files individually to minimize memory usage
- **Non-recursive**: Directory scanning is non-recursive by default for performance

## Testing

Analysis tools (1-5) have comprehensive test coverage:

- 32 tests for the 5 analysis tools
- Happy path scenarios
- Error handling
- Edge cases
- Parameter validation
- Filtering and options

Pipeline tools (6-10) are functionally tested and working, with unit test expansion planned.

Run tests with:

```bash
npm test
```

## Architecture

```
code-tools/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # Individual tool implementations
│   │   ├── analyze-complexity.ts
│   │   ├── find-duplicates.ts
│   │   ├── list-functions.ts
│   │   ├── count-lines.ts
│   │   ├── detect-issues.ts
│   │   ├── run-tests.ts      # NEW: Test execution
│   │   ├── check-coverage.ts # NEW: Coverage analysis
│   │   ├── security-scan.ts  # NEW: Security scanning
│   │   ├── type-check.ts     # NEW: Type checking
│   │   └── diff-summary.ts   # NEW: Git diff analysis
│   └── utils/                # Shared utilities
│       ├── types.ts          # Type definitions
│       ├── parser.ts         # Code parsing (TS Compiler API)
│       ├── analyzer.ts       # Analysis algorithms
│       └── dotnet.ts         # .NET/C# support
└── __tests__/                # Comprehensive test suite
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for development guidelines.
