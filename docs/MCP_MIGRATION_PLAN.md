# MCP Migration Plan

## Transition from Claude Code Skills to Universal MCP Servers

**Goal**: Migrate your Claude Code skills to portable MCP servers that work with OpenCode, Claude Code, Gemini CLI, and Ollama.

**Technology Stack**: TypeScript/Node.js (selected for production reliability and memory efficiency)

**Timeline**: 2-3 days (aggressive - all 24 tools)

**Key Decisions**:
- ✅ TypeScript/Node.js over Python/FastMCP (31.6% lower memory, no leaks)
- ✅ Performance-based model selection with Ollama integration
- ✅ MCP snake_case naming convention
- ✅ Interactive + strict validation error handling
- ✅ Testing platforms: OpenCode, Claude Code, Gemini CLI

---

## Technology Stack Decision Rationale

### Why TypeScript/Node.js is Correct Choice

**Production Reliability** ✅
- No documented memory leaks (vs Python SDK critical issues)
- Predictable memory growth with V8 generational GC
- Better for continuous tool execution scenarios
- 31.6% lower baseline memory usage

**Performance & Scalability** ✅  
- Faster cold starts (300-600ms vs 400-800ms)
- Better multi-client scaling (4,500 vs 3,800 req/sec)
- Stateless mode for production deployment
- Superior for I/O-heavy MCP workloads

**Trade-off Acceptance**
- Slower development speed (acceptable for 24 tools)
- More verbose code (mitigated with patterns)
- Smaller ecosystem (adequate for your needs)

---

## Optimized Development Strategy

### Accelerated Development Patterns

**1. Template-Based Tool Creation**
```typescript
// Tool template to copy/paste for rapid development
export function createTool<T extends z.ZodType>(
  name: string,
  description: string,
  schema: T,
  handler: (args: z.infer<T>) => Promise<ToolResponse>
) {
  return {
    name,
    description,
    inputSchema: zodToMcpSchema(schema),
    handler
  };
}
```

**2. Shared Utilities Library**
```typescript
// Common patterns for file operations, git commands, HTTP requests
// Reduces boilerplate across 24 tools
```

**3. Code Generation Scripts**
```bash
# Auto-generate tool scaffolding from simple definitions
npm run generate-tool --name=changelog_update --params=file_path,format
```

---

## Project Structure (Optimized)
```
~/mcp-servers/
├── README.md                           # Project overview
├── 01-project-setup.md                 # Day 1 Morning - Foundation
├── 02-ralph-workflow-server.md          # Day 1 Afternoon - Ralph tools
├── 03-changelog-manager-server.md        # Day 2 Morning - Changelog tools
├── 04-code-tools-server.md              # Day 2 Afternoon - Code tools
├── 05-context-manager-server.md          # Day 2 Afternoon - Context tools
├── 06-ollama-integration.md            # Day 3 Morning - Ollama setup
├── 07-cross-platform-testing.md          # Day 3 Morning - Platform testing
├── 08-documentation-polish.md           # Day 3 Afternoon - Docs & aliases
├── 09-progress-tracker.md              # Overall progress tracking
├── shared/
│   ├── types/
│   │   ├── common.ts          # Shared interfaces
│   │   └── tool-responses.ts  # Standard response formats
│   ├── utils/
│   │   ├── file-ops.ts        # File operations
│   │   ├── git-ops.ts         # Git operations  
│   │   ├── http-client.ts     # HTTP requests
│   │   └── tool-template.ts   # Development templates
│   └── scripts/
│       └── generate-tool.ts    # Code generation
├── ralph-workflow/
│   ├── src/
│   │   ├── index.ts           # MCP server entry
│   │   ├── tools/
│   │   │   ├── ralph-from-prd.ts
│   │   │   └── ralph-loop.ts
│   │   └── utils/
│   │       ├── tech-detector.ts
│   │       ├── prd-parser.ts
│   │       └── task-generator.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── build/                 # Compiled output
├── changelog-manager/
├── code-tools/
└── context-manager/
```

---

## Implementation Timeline

### Day 1: Foundation & Ralph Server (8 hours)

**Morning (4 hours)**
1. **Project Setup** (1 hour)
   - Create directory structure
   - Initialize 4 package.json files
   - Set up TypeScript configurations
   - Install shared dependencies

2. **Shared Library** (1 hour)
   - Create common types and utilities
   - Set up tool generation scripts
   - Create development templates

3. **Ralph Server Foundation** (2 hours)
   - Extract tech detection logic from existing .md files
   - Extract PRD parsing logic
   - Set up basic MCP server structure

**Afternoon (4 hours)**
4. **Ralph Tools Implementation** (3 hours)
   - Implement ralph-from-prd tool with full schema
   - Implement ralph-loop tool with iterative execution
   - Add error handling and validation

5. **Testing & Debugging** (1 hour)
   - Test with MCP Inspector
   - Verify tool schemas and responses
   - Debug any issues

### Day 2: Complete Servers (8 hours)

**Morning (4 hours)**
6. **Changelog Manager Server** (4 hours)
   - Implement all 9 changelog tools
   - Git operations integration
   - File system operations
   - Validation and error handling

**Afternoon (4 hours)**
7. **Code Tools Server** (2 hours)
   - Implement 5 simple code tools (template-based)
   - Add basic analysis capabilities

8. **Context Manager Server** (2 hours)
   - Implement 9 context tools
   - JSON parsing and bundle management
   - File operations and context loading

### Day 3: Integration & Testing (8 hours)

**Morning (4 hours)**
9. **Ollama Integration** (2 hours)
   - Install and configure ollama-mcp-bridge
   - Set up performance-based model selection
   - Test model switching logic

10. **Platform Configuration** (2 hours)
    - Configure OpenCode (native MCP support)
    - Configure Claude Code (highest performance)
    - Configure Gemini CLI (comprehensive features)

**Afternoon (4 hours)**
11. **Cross-Platform Testing** (3 hours)
    - Test all 24 tools across 3 platforms
    - Verify Ollama model selection
    - Performance benchmarking
    - Memory usage monitoring

12. **Documentation & Polish** (1 hour)
    - Update README with final implementation
    - Create shell aliases
    - Final validation

---

## Technical Specifications

### Performance Optimizations

**Memory Management**
```typescript
// Connection pooling and resource management
const connectionPool = new Map<string, Connection>();
const MAX_CONNECTIONS = 10;

// Efficient file operations with streaming
async function readFileStream(path: string): Promise<string> {
  const stream = fs.createReadStream(path);
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
}
```

**Error Handling Pattern**
```typescript
// Structured error handling with recovery
export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean = false
  ) {
    super(message);
  }
}

// Tool wrapper with error handling
export function withErrorHandling<T extends z.ZodType>(
  tool: ToolDefinition<T>
): ToolDefinition<T> {
  return {
    ...tool,
    handler: async (args) => {
      try {
        return await tool.handler(args);
      } catch (error) {
        if (error instanceof MCPError && error.recoverable) {
          return await handleRecovery(error, args);
        }
        throw error;
      }
    }
  };
}
```

---

## Configuration Files

### OpenCode Configuration
```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/mcp-servers/ralph-workflow/build/index.js"],
      "timeout": 30000
    },
    "changelog-manager": {
      "command": "node", 
      "args": ["/Users/clobbster/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/clobbster/mcp-servers/code-tools/build/index.js"]
    },
    "context-manager": {
      "command": "node",
      "args": ["/Users/clobbster/mcp-servers/context-manager/build/index.js"]
    }
  }
}
```

### Ollama Bridge Configuration
```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/mcp-servers/ralph-workflow/build/index.js"],
      "env": {
        "OLLAMA_MODEL_SELECTION": "performance-based",
        "RAM_THRESHOLD_GB": "16",
        "GPU_REQUIRED": "false"
      }
    }
  },
  "llm": {
    "model": "auto",
    "baseUrl": "http://localhost:11434",
    "selectionStrategy": "performance-based",
    "fallbackModels": ["qwen2.5-coder:7b", "llama3.2:8b", "deepseek-coder:6.7b"]
  }
}
```

---

## Success Metrics & Validation

### Performance Targets
- **Memory Usage**: <100MB per server process
- **Tool Execution**: <500ms simple, <2s complex
- **Startup Time**: <3s for all servers combined
- **Memory Stability**: No leaks during 100+ tool executions

### Quality Requirements
✅ **All 24 tools functional** with preserved capabilities
✅ **TypeScript type safety** with comprehensive error handling
✅ **Cross-platform compatibility** validated
✅ **Ollama integration** with performance-based model selection
✅ **Memory efficiency** with leak-free operation

---

## Risk Mitigation

- **Development Speed**: Use templates and code generation
- **Complexity**: Shared utilities library and consistent patterns
- **Testing**: MCP Inspector for each server before integration
- **Memory**: Monitor with Node.js process.memoryUsage()

---

## Backup Strategy
```bash
# Git archive before migration
git tag pre-mcp-migration -m "Backup: Claude Code skills before MCP migration"
git push origin pre-mcp-migration
```

---

## Ready to Execute

This comprehensive plan ensures:
- ✅ **Production reliability** with Node.js memory efficiency
- ✅ **Accelerated development** with templates and shared utilities
- ✅ **Complete migration** of all 24 tools in 2-3 days
- ✅ **Cross-platform support** for OpenCode, Claude Code, Gemini CLI
- ✅ **Ollama integration** with intelligent model selection
- ✅ **Memory optimization** with leak-free operation

See detailed implementation documents in the `mcp-servers` directory for step-by-step execution.

---

## Questions Before Starting

1. **Do you want to implement all tools now or start with priority servers?**
   - Priority 1: Ralph workflow (2 tools) - Most complex, most valuable
   - Priority 2: Changelog manager (9 tools) - Core workflow
   - Priority 3: Context manager (9 tools) - Project understanding
   - Priority 4: Code tools (5 tools) - Simple template-based

2. **What Ollama models do you have installed?**
   - qwen2.5-coder:7b (recommended for code)
   - llama3.2:8b (good general purpose)
   - deepseek-coder:6.7b (specialized for code)

Ready to proceed with implementation? Start with [01-project-setup.md](01-project-setup.md).