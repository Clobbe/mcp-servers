# Platform Configuration Examples

This directory contains example configuration files for different AI coding platforms to use the MCP servers.

## Claude Code

**File Location:** `~/.claude/settings.json`

Copy the configuration from `claude-code-settings.json` and merge with your existing settings.

**Features:**

- Native MCP support
- Highest performance
- Production environment settings

## OpenCode

**File Location:** `~/.opencode/settings.json`

Copy the configuration from `opencode-settings.json`.

**Features:**

- Native MCP support
- Ollama integration for local LLM
- Configurable timeouts

## Gemini CLI

**File Location:** `~/.gemini/config.json`

Copy the configuration from `gemini-config.json`.

**Features:**

- Comprehensive MCP feature support
- Multiple model support

## Installation

### 1. Choose Your Platform

Select the configuration file for your platform and copy it to the appropriate location.

### 2. Update Paths

Make sure to update the absolute paths in the configuration files to match your system:

```json
{
  "args": ["/Users/YOUR_USERNAME/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
}
```

### 3. Restart Your Platform

After updating the configuration, restart your AI coding platform to load the MCP servers.

## Available MCP Servers

### ralph-workflow (2 tools)

- `ralph_from_prd` - Generate workflow from PRD
- `ralph_loop` - Execute workflow iteratively

### changelog-manager (9 tools)

- `changelog_init` - Initialize CHANGELOG.md
- `changelog_entry_add` - Add entries
- `changelog_update` - Update from git
- `changelog_validate` - Validate format
- `changelog_generate_release` - Generate releases
- `changelog_diff` - Compare versions
- `changelog_search` - Search entries
- `changelog_export` - Export to formats
- `changelog_stats` - Get statistics

## Ollama Integration (Optional)

If you want to use local LLM models with OpenCode:

1. **Install Ollama:**

   ```bash
   brew install ollama
   ```

2. **Start Ollama:**

   ```bash
   ollama serve
   ```

3. **Pull Models:**

   ```bash
   ollama pull deepseek-coder:6.7b
   ollama pull qwen2.5-coder:7b
   ollama pull llama3.2:8b
   ```

4. **Configure:** Use the OpenCode configuration which includes Ollama settings.

## Testing

Test your MCP servers manually:

```bash
# Test ralph-workflow
cd ~/dev/tooling/mcp-servers/ralph-workflow
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Test changelog-manager
cd ~/dev/tooling/mcp-servers/changelog-manager
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Troubleshooting

### MCP Servers Not Loading

1. Check paths are correct and absolute
2. Verify Node.js is installed: `node --version`
3. Ensure servers are built: `cd server-name && npm run build`
4. Check platform logs for errors

### Ollama Not Connecting

1. Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. Check models are installed: `ollama list`
3. Restart Ollama: `pkill ollama && ollama serve`

## Documentation

- **Ollama Config:** `../ollama-config.json`
- **Test Script:** `../test-ollama.sh`
- **Monitor Script:** `../monitor-ollama.sh`
- **Main README:** `../README.md`
