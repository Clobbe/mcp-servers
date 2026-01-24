# Phase 1: Project Setup

**Timeline**: Day 1 Morning (4 hours)
**Duration**: 1 hour

## Objectives

- Create directory structure for all MCP servers
- Initialize package.json files for each server
- Set up TypeScript configurations
- Install shared dependencies
- Create shared utilities library

## Directory Structure

```
~/dev/tooling/mcp-servers/
├── README.md
├── docs/
│   ├── CODE_QUALITY.md
│   ├── CONTRIBUTING.md
│   ├── MCP_MIGRATION_PLAN.md
│   ├── PARALLEL_WORK_GUIDELINES.md
│   ├── QUICK_REFERENCE.md
│   └── phases/
│       ├── 01-project-setup.md
│       ├── 02-ralph-workflow-server.md
│       ├── 03-changelog-manager-server.md
│       ├── 04-code-tools-server.md
│       ├── 05-context-manager-server.md
│       ├── 06-ollama-integration.md
│       ├── 07-cross-platform-testing.md
│       └── 08-documentation-polish.md
├── shared/
│   ├── types/
│   │   ├── common.ts
│   │   └── tool-responses.ts
│   ├── utils/
│   │   ├── file-ops.ts
│   │   ├── git-ops.ts
│   │   ├── http-client.ts
│   │   └── tool-template.ts
│   └── scripts/
│       └── generate-tool.ts
├── ralph-workflow/
│   ├── src/
│   │   ├── index.ts
│   │   ├── tools/
│   │   └── utils/
│   ├── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   └── build/
├── changelog-manager/
│   ├── src/
│   ├── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   └── build/
├── code-tools/
│   ├── src/
│   ├── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   └── build/
└── context-manager/
    ├── src/
    ├── __tests__/
    ├── package.json
    ├── tsconfig.json
    └── build/
```

## Tasks

### 1. Create Directory Structure (15 minutes)

```bash
cd ~/dev/tooling/mcp-servers

# Create shared utilities
mkdir -p shared/{types,utils,scripts}

# Create server directories
mkdir -p ralph-workflow/{src/{tools,utils},__tests__}
mkdir -p changelog-manager/{src/{tools,utils},__tests__}
mkdir -p code-tools/{src/{tools,utils},__tests__}
mkdir -p context-manager/{src/{tools,utils},__tests__}

# Create phase docs directory
mkdir -p docs/phases
```

### 2. Initialize package.json Files (20 minutes)

**Shared package.json template:**

```json
{
  "name": "@mcp-servers/[server-name]",
  "version": "0.1.0",
  "type": "module",
  "description": "MCP server for [description]",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "playwright test",
    "test:coverage": "playwright test --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
```

**Create package.json for each server:**

```bash
# Ralph Workflow
cat > ralph-workflow/package.json << 'EOF'
{
  "name": "@mcp-servers/ralph-workflow",
  "version": "0.1.0",
  "type": "module",
  "description": "MCP server for RALPH workflow automation from PRDs",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "playwright test",
    "test:coverage": "playwright test --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0"
  }
}
EOF

# Similar for other servers...
```

### 3. Create TypeScript Configurations (15 minutes)

**Shared tsconfig.json template:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "__tests__"]
}
```

### 4. Install Dependencies (10 minutes)

```bash
# Install for each server
cd ralph-workflow && npm install && cd ..
cd changelog-manager && npm install && cd ..
cd code-tools && npm install && cd ..
cd context-manager && npm install && cd ..
```

## Shared Utilities Setup

### 1. Common Types (`shared/types/common.ts`)

```typescript
/**
 * Standard tool response format
 */
export interface ToolResponse {
  summary: string;
  data?: unknown;
  error?: string;
}

/**
 * MCP error codes
 */
export enum MCPErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  path?: string;
  content?: string;
  error?: string;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  success: boolean;
  output?: string;
  error?: string;
}
```

### 2. Tool Response Types (`shared/types/tool-responses.ts`)

```typescript
import type { ToolResponse } from './common.js';

export function successResponse(summary: string, data?: unknown): ToolResponse {
  return { summary: `✅ ${summary}`, data };
}

export function errorResponse(summary: string, error?: string): ToolResponse {
  return { summary: `❌ ${summary}`, error };
}

export function warningResponse(summary: string, data?: unknown): ToolResponse {
  return { summary: `⚠️ ${summary}`, data };
}
```

### 3. File Operations (`shared/utils/file-ops.ts`)

```typescript
import fs from 'fs/promises';
import path from 'path';
import type { FileOperationResult } from '../types/common.js';

/**
 * Read file with error handling
 */
export async function readFile(filePath: string): Promise<FileOperationResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, path: filePath, content };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Write file with error handling
 */
export async function writeFile(filePath: string, content: string): Promise<FileOperationResult> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve symlinks to real path
 */
export async function resolveRealPath(filePath: string): Promise<string> {
  try {
    return await fs.realpath(filePath);
  } catch {
    return filePath;
  }
}
```

### 4. Git Operations (`shared/utils/git-ops.ts`)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import type { GitOperationResult } from '../types/common.js';

const execAsync = promisify(exec);

/**
 * Execute git command with error handling
 */
export async function execGitCommand(command: string, cwd?: string): Promise<GitOperationResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get git status
 */
export async function getGitStatus(cwd?: string): Promise<GitOperationResult> {
  return execGitCommand('git status --porcelain', cwd);
}

/**
 * Get current git branch
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const result = await execGitCommand('git branch --show-current', cwd);
  return result.output?.trim() || '';
}

/**
 * Check if directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  const result = await execGitCommand('git rev-parse --git-dir', cwd);
  return result.success;
}
```

### 5. Tool Template (`shared/utils/tool-template.ts`)

```typescript
import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Create a standard MCP tool definition
 */
export function createToolSchema(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required?: string[]
): ToolDefinition {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
    },
  };
}

/**
 * Wrap tool handler with error handling
 */
export function withErrorHandling<T>(
  handler: (args: T) => Promise<{ summary: string; data?: unknown }>
): (args: T) => Promise<{ summary: string; data?: unknown; error?: string }> {
  return async (args: T) => {
    try {
      return await handler(args);
    } catch (error) {
      return {
        summary: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
```

## Commit Strategy

```bash
# Commit 1: Directory structure
git add .
git commit -m "chore: create project directory structure for MCP servers"

# Commit 2: Package.json files
git add */package.json
git commit -m "chore: initialize package.json for all MCP servers"

# Commit 3: TypeScript configs
git add */tsconfig.json
git commit -m "chore: add TypeScript configuration for all servers"

# Commit 4: Shared types
git add shared/types/
git commit -m "feat: add shared type definitions"

# Commit 5: Shared utilities
git add shared/utils/
git commit -m "feat: add shared utility functions for file and git operations"

# Commit 6: Install dependencies
git add */package-lock.json
git commit -m "chore: install dependencies for all servers"
```

## Validation Checklist

- [ ] All directories created
- [ ] All package.json files valid
- [ ] All tsconfig.json files valid
- [ ] Dependencies installed successfully
- [ ] Shared utilities compile without errors
- [ ] No TypeScript errors: `cd shared && npx tsc --noEmit`
- [ ] Git commits follow conventional format

## Next Steps

Proceed to [Phase 2: Ralph Workflow Server](02-ralph-workflow-server.md)

## Time Tracking

- Directory structure: 15 min
- Package.json setup: 20 min
- TypeScript config: 15 min
- Dependencies install: 10 min
- **Total**: ~60 minutes

## Notes

- Use Node.js v20+ for best compatibility
- All servers use ES modules (`"type": "module"`)
- Strict TypeScript mode enabled for production quality
- Shared utilities reduce boilerplate across servers
