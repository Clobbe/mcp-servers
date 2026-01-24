# Phase 6: Ollama Integration

**Timeline**: Day 3 Morning (2 hours)
**Focus**: Performance-based model selection with Ollama

## Objectives

- Install and configure ollama-mcp-bridge
- Set up performance-based model selection
- Test model switching logic
- Configure for different platforms

## Architecture

```
┌─────────────────────────────────────┐
│   AI Coding Platform                │
│   (Claude Code/OpenCode/Gemini)     │
└──────────────┬──────────────────────┘
               │
               │ MCP Protocol
               ▼
┌─────────────────────────────────────┐
│   MCP Servers                       │
│   ├── ralph-workflow                │
│   ├── changelog-manager             │
│   ├── code-tools                    │
│   └── context-manager               │
└──────────────┬──────────────────────┘
               │
               │ Optional: Ollama Bridge
               ▼
┌─────────────────────────────────────┐
│   Ollama Local LLM                  │
│   ├── qwen2.5-coder:7b             │
│   ├── llama3.2:8b                  │
│   └── deepseek-coder:6.7b          │
└─────────────────────────────────────┘
```

## Installation Steps

### 1. Install Ollama (if not installed)

```bash
# macOS
brew install ollama

# Start Ollama service
ollama serve
```

### 2. Pull Recommended Models

```bash
# Code-specialized model (recommended)
ollama pull qwen2.5-coder:7b

# General purpose
ollama pull llama3.2:8b

# Alternative code model
ollama pull deepseek-coder:6.7b

# List installed models
ollama list
```

### 3. Install ollama-mcp-bridge (if using)

```bash
npm install -g ollama-mcp-bridge

# Or install locally in project
cd ~/dev/tooling/mcp-servers
npm install ollama-mcp-bridge
```

## Configuration

### Performance-Based Model Selection

**Create: `~/dev/tooling/mcp-servers/ollama-config.json`**

```json
{
  "modelSelection": {
    "strategy": "performance-based",
    "rules": [
      {
        "condition": "taskType === 'code' && ramAvailable > 16",
        "model": "qwen2.5-coder:7b",
        "reason": "Best for code generation with sufficient RAM"
      },
      {
        "condition": "taskType === 'code' && ramAvailable <= 16",
        "model": "deepseek-coder:6.7b",
        "reason": "Efficient code model for limited RAM"
      },
      {
        "condition": "taskType === 'general'",
        "model": "llama3.2:8b",
        "reason": "Good general-purpose model"
      }
    ],
    "fallback": "llama3.2:8b"
  },
  "resourceLimits": {
    "maxMemoryMB": 8192,
    "maxConcurrentRequests": 3,
    "timeoutSeconds": 120
  },
  "monitoring": {
    "enabled": true,
    "logFile": "~/dev/tooling/mcp-servers/logs/ollama-usage.log"
  }
}
```

### Platform Configurations

#### OpenCode Configuration

**File: `~/.opencode/settings.json`**

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
    },
    "context-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/context-manager/build/index.js"]
    }
  },
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "defaultModel": "qwen2.5-coder:7b"
  }
}
```

#### Claude Code Configuration

**File: `~/.claude/settings.json`**

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "changelog-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/changelog-manager/build/index.js"]
    },
    "code-tools": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/code-tools/build/index.js"]
    },
    "context-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/context-manager/build/index.js"]
    }
  }
}
```

#### Gemini CLI Configuration

**File: `~/.gemini/config.json`**

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
    },
    "context-manager": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/context-manager/build/index.js"]
    }
  }
}
```

## Testing Model Selection

### Test Script

**Create: `~/dev/tooling/mcp-servers/test-ollama.sh`**

```bash
#!/bin/bash

echo "Testing Ollama Integration"
echo "=========================="
echo ""

# Check if Ollama is running
echo "1. Checking Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running. Start with: ollama serve"
    exit 1
fi

# List available models
echo ""
echo "2. Available models:"
ollama list

# Test each model
echo ""
echo "3. Testing models..."

echo ""
echo "Testing qwen2.5-coder:7b..."
time ollama run qwen2.5-coder:7b "Write a hello world function in TypeScript" --verbose

echo ""
echo "Testing llama3.2:8b..."
time ollama run llama3.2:8b "Explain what TypeScript is" --verbose

# Memory usage
echo ""
echo "4. Memory usage:"
ps aux | grep ollama | grep -v grep

echo ""
echo "✅ Ollama integration test complete"
```

```bash
chmod +x test-ollama.sh
./test-ollama.sh
```

## Performance Monitoring

### Create Monitoring Script

**Create: `~/dev/tooling/mcp-servers/monitor-ollama.sh`**

```bash
#!/bin/bash

# Monitor Ollama performance
watch -n 1 '
echo "=== Ollama Status ==="
curl -s http://localhost:11434/api/tags | jq -r ".models[] | .name"
echo ""
echo "=== Resource Usage ==="
ps aux | grep "ollama" | grep -v grep | awk "{print \"CPU: \" \$3 \"% | Memory: \" \$4 \"%\"}"
echo ""
echo "=== Active Connections ==="
lsof -i :11434 | grep LISTEN
'
```

## Validation Checklist

- [ ] Ollama installed and running
- [ ] Models pulled successfully (qwen2.5-coder, llama3.2, deepseek-coder)
- [ ] Can run models via CLI
- [ ] Performance-based selection config created
- [ ] All platform configs updated with MCP servers
- [ ] Test script runs successfully
- [ ] Memory usage acceptable (<8GB per model)
- [ ] Response times reasonable (<2s for simple queries)

## Commit Strategy

```bash
git add ollama-config.json
git commit -m "feat: add Ollama performance-based model selection config"

git add test-ollama.sh monitor-ollama.sh
git commit -m "feat: add Ollama testing and monitoring scripts"

git add platform-configs/
git commit -m "docs: add platform configuration examples for MCP servers"

git add docs/phases/06-ollama-integration.md
git commit -m "docs: complete Ollama integration guide"
```

## Troubleshooting

### Issue: Ollama not starting

```bash
# Check if port is in use
lsof -i :11434

# Kill existing process
pkill ollama

# Restart
ollama serve
```

### Issue: Model not found

```bash
# List models
ollama list

# Pull missing model
ollama pull qwen2.5-coder:7b
```

### Issue: High memory usage

```bash
# Check memory
ollama ps

# Reduce concurrent requests in config
# Edit ollama-config.json: maxConcurrentRequests: 1
```

## Time Breakdown

- Ollama installation and setup: 15 min
- Model downloads: 30 min
- Configuration files: 20 min
- Testing scripts: 15 min
- Platform config updates: 20 min
- Testing and validation: 20 min
- **Total**: ~2 hours

## Next Steps

Proceed to [Phase 7: Cross-Platform Testing](07-cross-platform-testing.md)
