# Phase 1: Project Setup & Foundation

**Duration**: 4 hours (Day 1 Morning)  
**Complexity**: LOW (setup and foundation work)  
**Prerequisites**: None  
**Dependencies**: Node.js, npm, git

## Task Checklist

- [ ] **Task 1.1**: Create directory structure (Duration: 30 minutes)
  - [ ] Create mcp-servers root directory
  - [ ] Create 4 server directories (ralph-workflow, changelog-manager, code-tools, context-manager)
  - [ ] Create shared library structure
  - [ ] Create implementation docs directory

- [ ] **Task 1.2**: Initialize package.json files (Duration: 1 hour)
  - [ ] Create shared package.json with common dependencies
  - [ ] Create ralph-workflow package.json
  - [ ] Create changelog-manager package.json
  - [ ] Create code-tools package.json
  - [ ] Create context-manager package.json
  - [ ] Install dependencies across all servers

- [ ] **Task 1.3**: Set up TypeScript configuration (Duration: 30 minutes)
  - [ ] Create shared tsconfig.json with common settings
  - [ ] Create individual tsconfig.json for each server
  - [ ] Verify TypeScript compilation works

- [ ] **Task 1.4**: Create shared utilities library (Duration: 1 hour)
  - [ ] Create common types and interfaces
  - [ ] Create tool template utilities
  - [ ] Create file operations utilities
  - [ ] Create git operations utilities
  - [ ] Create HTTP client utilities
  - [ ] Create error handling patterns

- [ ] **Task 1.5**: Set up development scripts (Duration: 1 hour)
  - [ ] Create tool generation script
  - [ ] Create build scripts for all servers
  - [ ] Create testing scripts with MCP Inspector
  - [ ] Create development server scripts
  - [ ] Verify all scripts work correctly

## Detailed Implementation

### Task 1.1: Directory Structure Creation

**Commands**:
```bash
# Create main directory structure
cd ~/mcp-servers

# Create server directories
mkdir -p ralph-workflow/src/{tools,utils}
mkdir -p changelog-manager/src/{tools,utils}
mkdir -p code-tools/src/{tools,utils}
mkdir -p context-manager/src/{tools,utils}

# Create shared library
mkdir -p shared/{types,utils,scripts}

# Create build directories (will be gitignored)
mkdir -p ralph-workflow/build
mkdir -p changelog-manager/build
mkdir -p code-tools/build
mkdir -p context-manager/build

# Create .gitignore files
echo "node_modules/" > .gitignore
echo "build/" >> .gitignore
echo "*.log" >> .gitignore
```

**Verification**:
```bash
# Verify structure
tree -L 3 .
```

### Task 1.2: Package.json Files

**Shared Package.json** (`shared/package.json`):
```json
{
  "name": "mcp-servers-shared",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "zod": "^3.22.4",
    "simple-git": "^3.20.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Server Package.json Template** (use for each server):
```json
{
  "name": "SERVER_NAME-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node build/index.js",
    "test": "npx @modelcontextprotocol/inspector"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Task 1.3: TypeScript Configuration

**Shared tsconfig.json** (`shared/tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["types/**/*", "utils/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Server tsconfig.json** (use for each server):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

### Task 1.4: Shared Utilities Library

**Common Types** (`shared/types/common.ts`):
```typescript
// Basic tool interfaces
export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

// Error handling
export interface MCPError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: any;
}

// Common tool parameters
export interface FileOperationParams {
  path: string;
  encoding?: string;
}

export interface GitOperationParams {
  repositoryPath?: string;
  options?: any;
}

// Response templates
export interface SuccessResponse {
  success: true;
  data: any;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: MCPError;
  message: string;
}
```

**Tool Template** (`shared/utils/tool-template.ts`):
```typescript
import { z } from 'zod';
import { ToolResponse, MCPError } from '../types/common.js';

export function createMCPTool<T extends z.ZodType>(
  name: string,
  description: string,
  schema: T,
  handler: (args: z.infer<T>) => Promise<ToolResponse>
) {
  return {
    name,
    description,
    inputSchema: zodToMcpSchema(schema),
    handler: withErrorHandling(handler)
  };
}

export function withErrorHandling<T extends z.ZodType>(
  handler: (args: any) => Promise<ToolResponse>
) {
  return async (args: any): Promise<ToolResponse> => {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof MCPError && error.recoverable) {
        // Attempt recovery
        return await handleRecovery(error, args);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  };
}

function zodToMcpSchema(schema: z.ZodType): any {
  // Convert Zod schema to MCP-compatible JSON schema
  return schema._def;
}

async function handleRecovery(error: MCPError, args: any): Promise<ToolResponse> {
  // Implement recovery logic based on error type
  return {
    content: [{
      type: 'text',
      text: `Recoverable error occurred: ${error.message}. Please check your inputs.`
    }],
    isError: true
  };
}
```

**File Operations** (`shared/utils/file-ops.ts`):
```typescript
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { FileOperationParams, ToolResponse } from '../types/common.js';

export async function readFileOp(params: FileOperationParams): Promise<string> {
  try {
    const content = await readFile(params.path, params.encoding || 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${params.path}: ${error}`);
  }
}

export async function writeFileOp(
  params: FileOperationParams, 
  content: string
): Promise<void> {
  try {
    // Ensure directory exists
    await mkdir(dirname(params.path), { recursive: true });
    await writeFile(params.path, content, params.encoding || 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${params.path}: ${error}`);
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Streaming read for large files
export async function readFileStream(path: string): Promise<string> {
  const { createReadStream } = await import('fs');
  const stream = createReadStream(path, { encoding: 'utf-8' });
  
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
}
```

**Git Operations** (`shared/utils/git-ops.ts`):
```typescript
import simpleGit, { SimpleGit } from 'simple-git';
import { GitOperationParams, ToolResponse } from '../types/common.js';

export async function gitStatus(repoPath: string = '.'): Promise<any> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const status = await git.status();
    return status;
  } catch (error) {
    throw new Error(`Git status failed: ${error}`);
  }
}

export async function gitDiff(repoPath: string = '.', options?: any): Promise<string> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const diff = await git.diff(options);
    return diff;
  } catch (error) {
    throw new Error(`Git diff failed: ${error}`);
  }
}

export async function gitLog(repoPath: string = '.', options?: any): Promise<any> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const log = await git.log(options);
    return log;
  } catch (error) {
    throw new Error(`Git log failed: ${error}`);
  }
}

export async function gitAdd(repoPath: string = '.', files: string[]): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    await git.add(files);
  } catch (error) {
    throw new Error(`Git add failed: ${error}`);
  }
}

export async function gitCommit(repoPath: string = '.', message: string): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    await git.commit(message);
  } catch (error) {
    throw new Error(`Git commit failed: ${error}`);
  }
}

export async function gitPush(repoPath: string = '.', remote: string = 'origin'): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    await git.push(remote);
  } catch (error) {
    throw new Error(`Git push failed: ${error}`);
  }
}
```

### Task 1.5: Development Scripts

**Tool Generation Script** (`shared/scripts/generate-tool.ts`):
```typescript
#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import { join } from 'path';

const toolName = process.argv[2];
const params = process.argv[3] ? process.argv[3].split(',') : [];

if (!toolName) {
  console.error('Usage: npm run generate-tool -- <tool-name> [--params=param1,param2]');
  process.exit(1);
}

const toolTemplate = `import { z } from 'zod';
import { createMCPTool } from '../../shared/utils/tool-template.js';

export const ${toolName}Schema = createMCPTool(
  '${toolName}',
  'Description for ${toolName}',
  z.object({
    ${params.map(param => `${param}: z.string().describe('Description for ${param}')`).join(',\n    ')}
  }),
  async (args) => {
    // Implementation here
    return {
      content: [{
        type: 'text',
        text: \`Tool ${toolName} executed with args: \${JSON.stringify(args)}\`
      }]
    };
  }
);

export { ${toolName}Schema };
`;

async function generateTool() {
  try {
    // This would need server name and tool category to work properly
    console.log(`Generated template for tool: ${toolName}`);
    console.log('Params:', params);
    console.log('Template:');
    console.log(toolTemplate);
  } catch (error) {
    console.error('Failed to generate tool:', error);
    process.exit(1);
  }
}

generateTool();
```

**Build Script** (`scripts/build-all.sh`):
```bash
#!/bin/bash

echo "Building all MCP servers..."

# Build shared library first
cd shared
npm install
npm run build
cd ..

# Build each server
servers=("ralph-workflow" "changelog-manager" "code-tools" "context-manager")

for server in "${servers[@]}"; do
  echo "Building $server..."
  cd "$server"
  npm install
  npm run build
  if [ $? -eq 0 ]; then
    echo "✅ $server built successfully"
  else
    echo "❌ $server build failed"
    exit 1
  fi
  cd ..
done

echo "All servers built successfully!"
```

**Testing Script** (`scripts/test-all.sh`):
```bash
#!/bin/bash

echo "Testing all MCP servers..."

servers=("ralph-workflow" "changelog-manager" "code-tools" "context-manager")

for server in "${servers[@]}"; do
  echo "Testing $server..."
  cd "$server"
  
  # Test with MCP Inspector
  timeout 10 npm run test || {
    echo "❌ $server failed MCP Inspector test"
    cd ..
    continue
  }
  
  echo "✅ $server passed MCP Inspector test"
  cd ..
done

echo "All servers tested successfully!"
```

## Verification Steps

**1. Build Verification**:
```bash
cd ~/mcp-servers
chmod +x scripts/build-all.sh
./scripts/build-all.sh
```

**2. TypeScript Compilation Verification**:
```bash
# Each server should compile without errors
cd ralph-workflow && npm run build
cd ../changelog-manager && npm run build
cd ../code-tools && npm run build
cd ../context-manager && npm run build
```

**3. Dependency Verification**:
```bash
# Check all node_modules are created
ls -la */node_modules
```

**4. Structure Verification**:
```bash
# Final structure should match plan
tree -L 3 -I 'node_modules|build'
```

## Expected Output

After completion:
- ✅ Directory structure created with all 4 servers
- ✅ All package.json files configured and dependencies installed
- ✅ TypeScript configurations working
- ✅ Shared utility library with common patterns
- ✅ Development scripts for building and testing
- ✅ All servers compile successfully

## Next Phase

Proceed to [02-ralph-workflow-server.md](02-ralph-workflow-server.md) to implement the most complex server.

## Progress Tracking

- [x] **Phase 1**: Project Setup & Foundation - 5/5 tasks complete
- [ ] **Phase 2**: Ralph Workflow Server - 0/5 tasks
- [ ] **Phase 3**: Changelog Manager Server - 0/3 tasks  
- [ ] **Phase 4**: Code Tools Server - 0/2 tasks
- [ ] **Phase 5**: Context Manager Server - 0/2 tasks
- [ ] **Phase 6**: Ollama Integration - 0/3 tasks
- [ ] **Phase 7**: Cross-Platform Testing - 0/3 tasks
- [ ] **Phase 8**: Documentation & Polish - 0/3 tasks