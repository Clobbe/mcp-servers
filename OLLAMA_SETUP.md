# Ollama Integration Setup

Complete guide for integrating Ollama local LLM with MCP servers.

## ✅ Current Status

- **Ollama Version:** 0.14.3
- **Service Status:** Running ✅
- **Installed Models:** 1
  - deepseek-coder:6.7b (3.8 GB) ✅

## Quick Start

### 1. Verify Ollama

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List installed models
ollama list

# Test the server
./test-ollama.sh
```

### 2. Monitor Performance

```bash
# Real-time monitoring
./monitor-ollama.sh

# Or check manually
ps aux | grep ollama
```

### 3. Configure Your Platform

See `platform-configs/README.md` for configuration examples for:

- Claude Code
- OpenCode (with Ollama support)
- Gemini CLI

## Configuration Files

### Main Configuration

**File:** `ollama-config.json`

Contains:

- Performance-based model selection rules
- Resource limits (8GB max memory, 3 concurrent requests)
- Monitoring settings
- Installed and recommended models list

### Model Selection Strategy

The configuration uses **performance-based selection**:

1. **Code Tasks with High RAM (>16GB):**
   - Model: `qwen2.5-coder:7b`
   - Reason: Best code generation performance

2. **Code Tasks with Limited RAM (≤16GB):**
   - Model: `deepseek-coder:6.7b` ✅ (Currently installed)
   - Reason: Efficient, lower memory footprint

3. **General Tasks:**
   - Model: `llama3.2:8b`
   - Reason: Good general-purpose model

4. **Fallback:**
   - Model: `deepseek-coder:6.7b` ✅

## Recommended Models

### For Code Generation

```bash
# Best performance (if you have RAM)
ollama pull qwen2.5-coder:7b

# Currently installed - efficient
ollama pull deepseek-coder:6.7b  # Already installed ✅
```

### For General Tasks

```bash
# Good all-around model
ollama pull llama3.2:8b
```

### Other Options

```bash
# Alternative code models
ollama pull codellama:7b
ollama pull starcoder2:7b

# Smaller models for limited resources
ollama pull qwen2.5-coder:3b
ollama pull deepseek-coder:1.3b
```

## Testing

### Automated Test Script

```bash
./test-ollama.sh
```

This script:

1. Checks if Ollama service is running
2. Lists available models
3. Tests each installed model with a code query
4. Shows memory usage
5. Displays API status

### Manual Testing

```bash
# Test model directly
ollama run deepseek-coder:6.7b "Write a hello world function in TypeScript"

# Test via API
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-coder:6.7b",
  "prompt": "Write a TypeScript function",
  "stream": false
}'
```

### MCP Server Testing

```bash
# Test ralph-workflow with Ollama
cd ralph-workflow
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Test changelog-manager
cd changelog-manager
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Monitoring

### Real-time Monitor

```bash
./monitor-ollama.sh
```

Shows:

- Service status
- Available models
- CPU and memory usage
- Active connections
- System memory stats

### Manual Checks

```bash
# Check Ollama processes
ps aux | grep ollama

# Check memory usage
ollama ps

# Check API connectivity
curl http://localhost:11434/api/tags

# View logs (if configured)
tail -f ~/dev/tooling/mcp-servers/logs/ollama-usage.log
```

## Platform Integration

### Claude Code

**Location:** `~/.claude/settings.json`

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
    }
  }
}
```

### OpenCode (with Ollama)

**Location:** `~/.opencode/settings.json`

```json
{
  "mcpServers": {
    "ralph-workflow": {
      "command": "node",
      "args": ["/Users/clobbster/dev/tooling/mcp-servers/ralph-workflow/build/index.js"]
    }
  },
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "defaultModel": "deepseek-coder:6.7b"
  }
}
```

## Performance Optimization

### Memory Management

Current configuration limits:

- **Max Memory:** 8GB per model
- **Concurrent Requests:** 3 max
- **Timeout:** 120 seconds

To adjust, edit `ollama-config.json`:

```json
{
  "resourceLimits": {
    "maxMemoryMB": 4096, // Reduce if needed
    "maxConcurrentRequests": 1, // Limit for lower RAM
    "timeoutSeconds": 60 // Faster timeout
  }
}
```

### Model Selection

Choose models based on your hardware:

- **32GB+ RAM:** Use larger models (13B, 34B parameters)
- **16GB RAM:** Use 7-8B models (qwen2.5-coder:7b, llama3.2:8b)
- **8GB RAM:** Use 6-7B models (deepseek-coder:6.7b) ✅
- **<8GB RAM:** Use 3B models or less

## Troubleshooting

### Ollama Not Running

```bash
# Check status
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

### High Memory Usage

```bash
# Check what's using memory
ollama ps

# Kill specific model
ollama stop deepseek-coder:6.7b

# Restart Ollama
pkill ollama && ollama serve
```

### Model Not Found

```bash
# List installed models
ollama list

# Pull missing model
ollama pull deepseek-coder:6.7b

# Remove unused models
ollama rm model-name
```

### Slow Response Times

1. **Check system resources:**

   ```bash
   top | grep ollama
   ```

2. **Reduce concurrent requests** in `ollama-config.json`

3. **Use smaller model:**

   ```bash
   ollama pull qwen2.5-coder:3b
   ```

4. **Increase timeout** if needed

### Port Already in Use

```bash
# Check what's using port 11434
lsof -i :11434

# Kill the process
kill -9 <PID>

# Restart Ollama
ollama serve
```

## Validation Checklist

- [x] Ollama installed (v0.14.3)
- [x] Ollama service running
- [x] At least one model installed (deepseek-coder:6.7b)
- [x] Can query models via CLI
- [x] Performance config created (ollama-config.json)
- [x] Test script created and working (test-ollama.sh)
- [x] Monitor script created (monitor-ollama.sh)
- [x] Platform configs documented
- [x] Integration tested with MCP servers
- [x] Logs directory created

## Next Steps

1. **Optional:** Pull additional models for different use cases
2. **Configure:** Update your AI platform settings with MCP servers
3. **Test:** Run your AI platform and verify MCP tools are available
4. **Monitor:** Use `./monitor-ollama.sh` to track performance

## Resources

- **Ollama Documentation:** https://ollama.ai/docs
- **Model Library:** https://ollama.ai/library
- **MCP Documentation:** https://modelcontextprotocol.io
- **Configuration:** `ollama-config.json`
- **Platform Configs:** `platform-configs/`
- **Test Script:** `test-ollama.sh`
- **Monitor Script:** `monitor-ollama.sh`

## Performance Metrics

Current system with deepseek-coder:6.7b:

- **Model Size:** 3.8 GB
- **Memory Usage:** ~0.1% (idle)
- **CPU Usage:** ~0.4-1.0% (idle)
- **Response Time:** <2s for simple queries
- **Startup Time:** <5s for model loading

These metrics confirm efficient operation suitable for development use!
