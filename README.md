# MCP Servers Collection

Universal Model Context Protocol servers for use with Claude Code, OpenCode, and other MCP-compatible clients.

## Overview

This repository contains custom MCP servers that provide specialized tools for development workflows. These servers work across multiple AI coding assistants that support the Model Context Protocol.

## Available Servers

### 📝 Changelog Manager

**Status**: ✅ Complete

Manage project changelogs following the Keep a Changelog format.

**Tools:**
- `changelog_init` - Initialize new changelog
- `changelog_update` - Auto-update from git history
- `changelog_validate` - Validate format and consistency
- `changelog_entry_add` - Quick manual entry

**Location:** `./changelog-manager/`

[See Documentation →](./changelog-manager/README.md)

### 🤖 Ralph Workflow (Planned)

**Status**: ⏳ Planned

Convert PRDs to executable task files and run iterative development loops.

**Tools:**
- `ralph_from_prd` - Generate tasks.json from PRD
- `ralph_loop` - Execute development loop

**Location:** `./ralph-workflow/`

### 🛠️ Code Tools (Deferred)

**Status**: ⏸️ Deferred

Simple code operations (cleanup, explain, optimize). May use natural language instead.

## For AI Agents & Contributors

**Before making any changes, read the project guidelines:**

- **`.cursorrules`** - Comprehensive AI agent guidelines and guardrails
- **`.clauderc`** - Claude Code specific configuration
- **`CONTRIBUTING.md`** - Development workflow and best practices
- **`PARALLEL_WORK_GUIDELINES.md`** - Guidelines for multiple agents working simultaneously
- **`QUICK_REFERENCE.md`** - Quick lookup for common patterns

**Key Rules:**
- Make incremental git commits for every logical change
- Write comprehensive tests for all features (Playwright)
- When working in parallel: communicate, coordinate, isolate

## Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- Claude Code, OpenCode, or another MCP-compatible client

### Quick Start

1. **Clone or navigate to this repository:**
   ```bash
   cd ~/dev/tooling/mcp-servers
   ```

2. **Build the server you want:**
   ```bash
   cd changelog-manager
   npm install
   npm run build
   ```

3. **Configure in your MCP client** (see below)

## Configuration

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "changelog-manager": {
      "command": "node",
      "args": [
        "/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"
      ]
    }
  }
}
```

Restart Claude Code after updating settings.

### OpenCode

```bash
opencode mcp add

# Follow prompts:
# Name: changelog-manager
# Command: node
# Args: /Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js
```

### Continue.dev (with Ollama)

Add to `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "changelog-manager",
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": [
            "/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"
          ]
        }
      }
    ]
  }
}
```

## Development

### Creating a New MCP Server

Use this structure:

```
new-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   └── tool-name.ts     # Individual tool implementations
│   └── utils/
│       └── helpers.ts        # Shared utilities
├── build/                    # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

**Base `package.json`:**

```json
{
  "name": "your-server-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Base `tsconfig.json`:**

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
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

### Testing MCP Servers

```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Should output JSON response with available tools
```

## Benefits of MCP Servers

✅ **Portable** - Works across Claude Code, OpenCode, Continue.dev, and more
✅ **Real Code** - JavaScript/TypeScript instead of prompt engineering
✅ **Maintainable** - Single codebase, easy to update
✅ **LLM Agnostic** - Use with Claude, GPT-4, Deepseek, Llama, etc.
✅ **Extensible** - Easy to add new tools

## Migration from Claude Code Skills

If migrating from `.md` skill files:

1. Extract logic from the markdown instructions
2. Implement as TypeScript functions
3. Create MCP tool schemas
4. Wire up in `index.ts`
5. Build and configure

See `MCP_MIGRATION_PLAN.md` for detailed migration guide.

## Troubleshooting

### Server Won't Start

```bash
# Check build
cd server-name
npm run build

# Test manually
node build/index.js
# Should print: "Server running on stdio"
```

### Tools Not Appearing in LLM

1. Restart your MCP client (Claude Code, OpenCode, etc.)
2. Verify path in config is absolute
3. Check server logs for errors
4. Ensure build is up to date

### Permission Issues

Ensure the build files are executable:

```bash
chmod +x build/index.js
```

## Contributing

To add a new MCP server to this collection:

1. Create a new directory under `mcp-servers/`
2. Follow the structure above
3. Document in a README.md
4. Update this main README.md
5. Add build/test instructions

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## License

MIT
