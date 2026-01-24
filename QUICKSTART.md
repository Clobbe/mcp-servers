# Quick Start Guide

Get up and running with MCP Servers in 5 minutes.

## Prerequisites

- Node.js 18+ installed (`node --version`)
- npm or yarn package manager
- AI coding platform: Claude Code, OpenCode, or Gemini CLI

## Step 1: Install & Build (2 minutes)

```bash
cd ~/dev/tooling/mcp-servers

# Install and build all servers
for server in ralph-workflow changelog-manager code-tools; do
  cd $server && npm install && npm run build && cd ..
done
```

This will:

- Install dependencies for each server
- Compile TypeScript to JavaScript
- Generate build directories

## Step 2: Configure Your Platform (2 minutes)

Choose your platform and update the configuration file:

### Option A: Claude Code

**File:** `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
    },
    "changelog-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/code-tools/build/index.js"]
    }
  }
}
```

### Option B: OpenCode (with Ollama)

**File:** `~/.opencode/settings.json`

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"],
      "timeout": 30000
    },
    "changelog-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/code-tools/build/index.js"]
    }
  },
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "defaultModel": "deepseek-coder:6.7b"
  }
}
```

### Option C: Gemini CLI

**File:** `~/.gemini/config.json`

Use the same structure as Claude Code above.

**Important:** Replace `/Users/clobbster/` with your actual home directory path!

## Step 3: Restart & Test (1 minute)

1. **Restart your AI coding platform** (close and reopen)

2. **Test that tools are loaded:**

   ```
   "List all available MCP tools"
   ```

   You should see output like:

   ```
   Available MCP tools:
   - ralph_from_prd
   - ralph_loop
   - changelog_init
   - changelog_entry_add
   - changelog_update
   ... (and 11 more)
   ```

## Step 4: Try Your First Tool

### Example 1: Initialize a Changelog

```
"Use changelog_init to create a new changelog for 'My Project'"
```

This will create a `CHANGELOG.md` file in the Keep a Changelog format.

### Example 2: Generate a Workflow from PRD

```
"Use ralph_from_prd to generate a workflow from this PRD:

# E-Commerce Platform

## Description
A modern e-commerce platform for online shopping.

## Features
- Product catalog with search
- Shopping cart
- Secure checkout

## Technical Details
Built with TypeScript and React. PostgreSQL database."
```

This will generate a structured workflow with phases and tasks.

### Example 3: Analyze Code Complexity

```
"Use code_analyze_complexity on src/index.ts"
```

This will show cyclomatic complexity metrics for the file.

## Done! 🎉

You're now ready to use all 16 MCP tools!

## What's Next?

### Explore All Tools

**Ralph Workflow (2 tools):**

- `ralph_from_prd` - Generate workflows from PRDs
- `ralph_loop` - Execute workflows iteratively

**Changelog Manager (9 tools):**

- `changelog_init` - Initialize new changelog
- `changelog_entry_add` - Add entries quickly
- `changelog_update` - Update from git history
- `changelog_validate` - Validate format
- `changelog_generate_release` - Create releases
- `changelog_diff` - Compare versions
- `changelog_search` - Search entries
- `changelog_export` - Export to formats
- `changelog_stats` - Get statistics

**Code Tools (5 tools):**

- `code_analyze_complexity` - Complexity analysis
- `code_find_duplicates` - Find duplicate code
- `code_list_functions` - List all functions
- `code_count_lines` - Count lines of code
- `code_detect_issues` - Detect anti-patterns

### Optional: Set Up Ollama

For local LLM support:

```bash
# Install Ollama
brew install ollama

# Start service
ollama serve

# Pull a model
ollama pull deepseek-coder:6.7b
```

See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for complete guide.

### Optional: Shell Aliases

Make development easier with aliases:

```bash
# Add to your ~/.zshrc or ~/.bashrc
source ~/dev/tooling/mcp-servers/aliases.sh

# Then use shortcuts like:
mcp                  # Navigate to MCP servers
mcp-build-all        # Build all servers
mcp-test-all         # Test all servers
```

## Troubleshooting

### Tools Not Appearing

1. **Restart your platform** - This is required after config changes
2. **Check paths** - Ensure paths in config are absolute (start with `/Users/`)
3. **Verify builds** - Run `cd server-name && npm run build` for each server
4. **Check logs** - Look for error messages in your platform's logs

### Build Errors

```bash
# Clean and rebuild
cd server-name
rm -rf build node_modules
npm install
npm run build
```

### Can't Find Config File

- Claude Code: `~/.claude/settings.json`
- OpenCode: `~/.opencode/settings.json`
- Gemini CLI: `~/.gemini/config.json`

If the file doesn't exist, create it with the configuration above.

### Test Manually

Verify a server works outside your platform:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node ralph-workflow/build/index.js
```

Should output JSON with tool list.

## Need Help?

- 📚 **Full Documentation:** [README.md](README.md)
- 🔧 **Ollama Setup:** [OLLAMA_SETUP.md](OLLAMA_SETUP.md)
- 📊 **Project Status:** [PHASE_REVIEW.md](PHASE_REVIEW.md)
- 🤝 **Contributing:** [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

**Got it working?** Start using MCP tools in your daily workflow and enjoy the productivity boost! 🚀
