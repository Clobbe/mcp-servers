# MCP Servers - Setup Guide

Quick guide to get the MCP servers running locally on your machine.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** installed ([download here](https://nodejs.org/))
- **npm 9+** (comes with Node.js)
- **Git** installed
- An AI coding platform: **Claude Code**, **OpenCode**, or **Gemini CLI**

### Verify Prerequisites

```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show 2.x.x or higher
```

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone or Navigate to Repository

```bash
cd ~/dev/tooling/mcp-servers
```

If you don't have it yet:

```bash
git clone <repository-url>
cd mcp-servers
```

### Step 2: Install and Build All Servers

```bash
# Install dependencies and build all servers at once
for server in prd-generator ralph-workflow changelog-manager code-tools; do
  echo "Building $server..."
  cd $server && npm install && npm run build && cd ..
done
```

This will:

- Install Node.js dependencies for each server
- Compile TypeScript to JavaScript
- Create `build/` directories with executable code

**Expected output:**

```
Building prd-generator...
✓ Dependencies installed
✓ TypeScript compiled (0 errors)

Building ralph-workflow...
✓ Dependencies installed
✓ TypeScript compiled (0 errors)

Building changelog-manager...
✓ Dependencies installed
✓ TypeScript compiled (0 errors)

Building code-tools...
✓ Dependencies installed
✓ TypeScript compiled (0 errors)
```

### Step 3: Verify Builds

Test each server to ensure it works:

```bash
# Test prd-generator
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node prd-generator/build/index.js

# Test ralph-workflow
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node ralph-workflow/build/index.js

# Test changelog-manager
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node changelog-manager/build/index.js

# Test code-tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node code-tools/build/index.js
```

Each should return JSON with a list of available tools.

## ⚙️ Configure Your AI Platform

Choose your platform and follow the instructions:

### Option A: Claude Code

**1. Locate your settings file:**

```bash
~/.claude/settings.json
```

**2. Add MCP servers configuration:**

```json
{
  "mcpServers": {
    "prd-generator": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/prd-generator/build/index.js"]
    },
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
    },
    "changelog-manager": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/code-tools/build/index.js"]
    }
  }
}
```

**⚠️ Important:** Replace `/Users/YOUR_USERNAME/` with your actual home directory path!

**Quick tip to get your path:**

```bash
pwd
# Copy the output and use it in the config
```

**3. Restart Claude Code**

Close and reopen Claude Code for changes to take effect.

### Option B: OpenCode

**1. Locate your settings file:**

```bash
~/.opencode/settings.json
```

**2. Add MCP servers configuration:**

```json
{
  "mcpServers": {
    "prd-generator": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/prd-generator/build/index.js"]
    },
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/ralph-workflow/build/index.js"],
      "timeout": 30000
    },
    "changelog-manager": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/code-tools/build/index.js"]
    }
  },
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "defaultModel": "deepseek-coder:6.7b"
  }
}
```

**Note:** OpenCode supports Ollama for local LLM inference. See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for setup.

**3. Restart OpenCode**

### Option C: Gemini CLI

**1. Locate your config file:**

```bash
~/.gemini/config.json
```

**2. Add MCP servers configuration:**

Same structure as Claude Code (see Option A above).

**3. Restart Gemini CLI**

## ✅ Verify Installation

### 1. Check Tools Are Available

In your AI platform, ask:

```
"List all available MCP tools"
```

You should see **19 tools** total:

- **prd-generator** (3 tools): prd_create, prd_from_template, prd_validate
- **ralph-workflow** (2 tools): ralph_from_prd, ralph_loop
- **changelog-manager** (9 tools): changelog_init, changelog_entry_add, etc.
- **code-tools** (5 tools): code_analyze_complexity, code_find_duplicates, etc.

### 2. Test a Simple Tool

Try creating a PRD:

```
"Use prd_from_template to create a web-app PRD called TaskMaster"
```

Expected result: A formatted PRD document with features, requirements, and technical details.

## 🎯 First Steps - Try These!

### 1. Create Your First PRD

```
"Create a web-app PRD for a project management tool called ProjectPro"
```

### 2. Validate a PRD

```
"Validate this PRD: [paste a PRD]"
```

### 3. Generate a Workflow

```
"Generate a workflow from the ProjectPro PRD"
```

### 4. Initialize a Changelog

```
"Initialize a changelog for this project"
```

## 🔧 Troubleshooting

### Problem: "MCP server not found"

**Solution:**

1. Check paths are absolute (not relative) in your config
2. Verify Node.js is in your PATH: `which node`
3. Rebuild the server: `cd server-name && npm run build`
4. Restart your AI platform

### Problem: "Tools not appearing"

**Solution:**

1. Verify config file syntax (valid JSON)
2. Check server builds successfully: `npm run build`
3. Test server manually (see Step 3 above)
4. Check platform logs for specific errors

### Problem: "Cannot find module"

**Solution:**

```bash
# Reinstall dependencies
cd server-name
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: "TypeScript compilation errors"

**Solution:**

```bash
# Clean and rebuild
cd server-name
rm -rf build
npm run build
```

### Problem: Tools work but responses are slow

**Check:**

1. Server logs for errors
2. Network connectivity (if using remote LLMs)
3. System resources (CPU, memory)

## 🛠️ Development Mode

If you're modifying the servers:

### Watch Mode (Auto-rebuild on changes)

```bash
cd server-name
npm run watch
```

This will automatically recompile TypeScript when you save changes.

### Run Tests

```bash
cd server-name
npm test
```

### Type Checking

```bash
cd server-name
npm run type-check
```

## 📂 Directory Structure

```
~/dev/tooling/mcp-servers/
├── prd-generator/
│   ├── build/              # Compiled JavaScript (generated)
│   ├── src/                # TypeScript source code
│   ├── __tests__/          # Test files
│   ├── package.json        # Dependencies
│   └── tsconfig.json       # TypeScript config
├── ralph-workflow/         # Same structure
├── changelog-manager/      # Same structure
├── code-tools/             # Same structure
└── platform-configs/       # Example configurations
```

## 🔄 Updating Servers

When you pull new changes:

```bash
# Update all servers
git pull
for server in prd-generator ralph-workflow changelog-manager code-tools; do
  cd $server && npm install && npm run build && cd ..
done
```

## 📚 Additional Resources

- **Full Documentation:** [README.md](README.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Ollama Setup:** [OLLAMA_SETUP.md](OLLAMA_SETUP.md)
- **Contributing:** [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 💡 Pro Tips

1. **Use Shell Aliases:** Source `aliases.sh` for shortcuts

   ```bash
   source ~/dev/tooling/mcp-servers/aliases.sh
   mcp-build-all  # Quick rebuild
   ```

2. **Check Server Health:**

   ```bash
   ./validate-all.sh
   ```

3. **Monitor Performance:**

   ```bash
   ./monitor-ollama.sh  # If using Ollama
   ```

4. **Platform Configs:** Copy from `platform-configs/` directory

## ❓ Need Help?

- Check troubleshooting section above
- Review [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)
- Verify Node.js version meets requirements
- Ensure all dependencies are installed

---

**🎉 That's it! You're ready to use the MCP servers!**

Start by asking your AI platform to list tools, then try creating your first PRD.
