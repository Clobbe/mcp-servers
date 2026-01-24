# Code Quality Guidelines

This project uses automated tools to enforce code quality standards.

## Tools Overview

### ESLint - Code Linting
Catches common errors and enforces coding standards.

**Run linting:**
```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

**Key rules enforced:**
- No `any` types without justification
- No `console.log()` (use `console.error()` for stderr)
- No nested ternaries
- Maximum function complexity: 10
- Maximum function length: 50 lines
- Maximum parameters: 4
- Prefer `const` over `let`
- Always use `===` instead of `==`

### Prettier - Code Formatting
Ensures consistent code style across the project.

**Run formatting:**
```bash
npm run format            # Format all files
npm run format:check      # Check if files are formatted
```

**Configuration:**
- 2 space indentation
- Single quotes
- Semicolons required
- 100 character line width
- Trailing commas (ES5)

### TypeScript - Type Checking
Ensures type safety and catches type errors.

**Run type checking:**
```bash
npm run type-check        # Check all TypeScript files
```

**Strict mode enabled:**
- `noImplicitAny`: true
- `strictNullChecks`: true
- `strictFunctionTypes`: true
- All strict checks enabled

### TypeDoc - API Documentation
Generates API documentation from JSDoc comments.

**Generate docs:**
```bash
npm run docs              # Generate documentation
npm run docs:watch        # Watch mode for development
```

**Output:** `docs/api/`

### Husky - Git Hooks
Runs automated checks before commits and pushes.

**Hooks configured:**

#### Pre-commit
- Runs ESLint on staged files
- Runs Prettier on staged files
- Checks for file locks (parallel work)
- Auto-fixes issues when possible

#### Pre-push
- Runs all tests
- Checks TypeScript compilation
- Scans for `console.log()` statements
- Prevents push if checks fail

#### Commit-msg
- Validates conventional commit format
- Ensures proper commit message structure

### lint-staged
Runs linters only on staged files for faster feedback.

**Automatically runs on commit:**
- ESLint with auto-fix
- Prettier with auto-format
- Only processes files you're committing

## Pre-Commit Workflow

When you commit, the following happens automatically:

```
1. lint-staged runs
   ├── ESLint checks and fixes your TypeScript files
   ├── Prettier formats your code
   └── Stages the fixed files

2. Commit message validation
   ├── Checks conventional commit format
   └── Rejects if invalid

3. File lock check (parallel work)
   └── Warns if locks are still active
```

## Pre-Push Workflow

When you push, the following happens automatically:

```
1. Run all tests
   └── Fails if any test fails

2. TypeScript compilation check
   └── Fails if compilation errors

3. console.log() check
   └── Fails if console.log() found

4. Push proceeds if all checks pass
```

## Code Quality Standards

### Function Quality

**Maximum function length: 50 lines**
```typescript
// ❌ BAD - Too long
function processData(data: Data): Result {
  // 100 lines of code
}

// ✅ GOOD - Broken into smaller functions
function processData(data: Data): Result {
  const validated = validateData(data);
  const transformed = transformData(validated);
  return formatResult(transformed);
}
```

**Maximum complexity: 10**
```typescript
// ❌ BAD - High complexity
function complexFunction(x: number): number {
  if (x > 0) {
    if (x < 10) {
      if (x % 2 === 0) {
        // Many nested conditions
      }
    }
  }
}

// ✅ GOOD - Lower complexity
function simpleFunction(x: number): number {
  if (x <= 0) return 0;
  if (x >= 10) return 10;
  return x % 2 === 0 ? x : x + 1;
}
```

**Maximum parameters: 4**
```typescript
// ❌ BAD - Too many parameters
function createUser(name: string, email: string, age: number, city: string, country: string) {
  // ...
}

// ✅ GOOD - Use object parameter
interface UserData {
  name: string;
  email: string;
  age: number;
  location: { city: string; country: string };
}

function createUser(userData: UserData) {
  // ...
}
```

### Type Safety

**No `any` types**
```typescript
// ❌ BAD
function processData(data: any): any {
  return data.value;
}

// ✅ GOOD
interface DataInput {
  value: string;
}

function processData(data: DataInput): string {
  return data.value;
}
```

**Explicit return types**
```typescript
// ❌ BAD - Inferred return type
function calculate(x: number, y: number) {
  return x + y;
}

// ✅ GOOD - Explicit return type
function calculate(x: number, y: number): number {
  return x + y;
}
```

### Logging

**Use console.error() for stderr**
```typescript
// ❌ BAD - console.log() in production code
function myTool() {
  console.log('Processing...');
}

// ✅ GOOD - console.error() for MCP servers
function myTool() {
  console.error('Tool invoked: my_tool');
}
```

**Remove debugging code before committing**
```typescript
// ❌ BAD
function myFunction() {
  console.log('Debug:', data); // Left in by mistake
  debugger; // Left in by mistake
}

// ✅ GOOD
function myFunction() {
  // Clean, no debugging code
}
```

### Code Style

**No nested ternaries**
```typescript
// ❌ BAD
const value = a ? b ? c : d : e;

// ✅ GOOD
const value = a 
  ? (b ? c : d)
  : e;

// ✅ BETTER - Use if-else
let value;
if (a) {
  value = b ? c : d;
} else {
  value = e;
}
```

**Prefer early returns**
```typescript
// ❌ BAD - Deep nesting
function processUser(user: User): Result {
  if (user) {
    if (user.isActive) {
      if (user.email) {
        return { success: true };
      }
    }
  }
  return { success: false };
}

// ✅ GOOD - Early returns
function processUser(user: User): Result {
  if (!user) return { success: false };
  if (!user.isActive) return { success: false };
  if (!user.email) return { success: false };
  return { success: true };
}
```

## Documentation Standards

### JSDoc Comments

**All exported functions need JSDoc:**
```typescript
/**
 * Parses a changelog file and returns structured data
 * 
 * @param content - Raw markdown content of the changelog
 * @param options - Optional parsing configuration
 * @returns Structured changelog object with entries and sections
 * @throws {Error} When content is malformed or invalid
 * 
 * @example
 * ```typescript
 * const content = fs.readFileSync('CHANGELOG.md', 'utf-8');
 * const parsed = parseChangelog(content);
 * console.log(parsed.entries);
 * ```
 */
export function parseChangelog(
  content: string,
  options?: ParseOptions
): ChangelogStructure {
  // Implementation
}
```

**Required JSDoc tags:**
- `@param` - For each parameter
- `@returns` - What the function returns
- `@throws` - When function can throw errors
- `@example` - At least one usage example
- `@deprecated` - If function is deprecated

### README Documentation

**Each MCP server needs:**
- Clear description
- Installation instructions
- Usage examples
- API reference
- Configuration options
- Troubleshooting section

## Bypassing Hooks (Emergency Only)

**DO NOT bypass hooks unless absolutely necessary.**

```bash
# Skip pre-commit hooks (AVOID THIS)
git commit --no-verify -m "message"

# Skip pre-push hooks (AVOID THIS)
git push --no-verify
```

**Only bypass when:**
- Fixing broken CI/CD
- Emergency hotfix
- Hooks are malfunctioning

**Always:**
- Document why you bypassed
- Fix the issues manually
- Run checks locally before merging

## Running All Quality Checks

**Before creating a PR:**
```bash
# Run all validation checks
npm run validate

# This runs:
# - npm run lint (ESLint)
# - npm run format:check (Prettier)
# - npm run type-check (TypeScript)
```

**In individual servers:**
```bash
cd changelog-manager

# Run tests
npm test

# Run linting
npm run lint

# Build
npm run build
```

## Continuous Integration

All quality checks run automatically on CI:
- ESLint
- Prettier
- TypeScript compilation
- All tests
- Code coverage (min 80%)

**PRs cannot merge if:**
- Linting fails
- Tests fail
- Coverage < 80%
- TypeScript errors exist
- Prettier formatting issues

## Troubleshooting

### ESLint errors

```bash
# See what's wrong
npm run lint

# Auto-fix what can be fixed
npm run lint:fix

# Some issues need manual fixing
```

### Prettier issues

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Pre-commit hook fails

```bash
# Fix the issues shown
npm run lint:fix
npm run format

# Stage the fixes
git add .

# Commit again
git commit -m "fix: resolve linting issues"
```

### TypeScript errors

```bash
# See all errors
npm run type-check

# Or check specific server
cd changelog-manager
npx tsc --noEmit
```

## Summary

**Quality checks are MANDATORY:**
- ✅ All code must pass ESLint
- ✅ All code must be formatted with Prettier
- ✅ All code must pass TypeScript strict checks
- ✅ All exports must have JSDoc comments
- ✅ All tests must pass
- ✅ Code coverage must be >= 80%

**Automated enforcement:**
- Git hooks prevent commits/pushes with issues
- CI/CD blocks merges with quality problems
- Pre-commit hooks auto-fix simple issues

**Result:**
- Consistent code style across project
- Fewer bugs and issues
- Better maintainability
- Professional code quality
