# Phase 7: Cross-Platform Testing

**Timeline**: Day 3 Morning (3 hours)
**Focus**: Test all 24 tools across 3 platforms

## Objectives

- Test all MCP servers on OpenCode, Claude Code, and Gemini CLI
- Verify Ollama model selection works
- Performance benchmarking
- Memory usage monitoring
- Document platform-specific quirks

## Testing Matrix

| Server            | Tools  | OpenCode | Claude Code | Gemini CLI |
| ----------------- | ------ | -------- | ----------- | ---------- |
| ralph-workflow    | 2      | ✅       | ✅          | ✅         |
| changelog-manager | 9      | ✅       | ✅          | ✅         |
| code-tools        | 5      | ✅       | ✅          | ✅         |
| context-manager   | 9      | ✅       | ✅          | ✅         |
| **Total**         | **25** | -        | -           | -          |

## Testing Procedure

### 1. OpenCode Testing (60 minutes)

**Setup:**

```bash
# Update OpenCode config
code ~/.opencode/settings.json

# Restart OpenCode
# (Close and reopen)
```

**Test Each Server:**

```bash
# Test workflow in OpenCode
# 1. Open OpenCode
# 2. Type: "List available MCP tools"
# 3. Verify all 25 tools appear
# 4. Test each tool:

# Ralph Workflow
"Use ralph_from_prd to generate workflow from this PRD: [paste PRD]"
"Use ralph_loop to execute the workflow"

# Changelog Manager
"Use changelog_init to create a new changelog for 'Test Project'"
"Use changelog_add_entry to add a new feature"
"Use changelog_validate to validate the changelog"
# ... test all 9 tools

# Code Tools
"Use code_analyze_complexity on src/index.ts"
"Use code_list_functions on src/index.ts"
# ... test all 5 tools

# Context Manager
"Use context_create_bundle to create a bundle named 'test'"
"Use context_add_file to add src/index.ts to the bundle"
# ... test all 9 tools
```

**Document Results:**

Create: `test-results/opencode-results.md`

```markdown
# OpenCode Test Results

## Platform Info

- Version: X.X.X
- OS: macOS 14.x
- Date: YYYY-MM-DD

## Server: ralph-workflow

- [x] ralph_from_prd - Works ✅
- [x] ralph_loop - Works ✅

## Server: changelog-manager

- [x] changelog_init - Works ✅
- [x] changelog_add_entry - Works ✅
- [x] changelog_update - Works ✅
- ... (all 9)

## Performance

- Startup time: X seconds
- Average tool execution: X ms
- Memory usage: X MB

## Issues

- None / List issues
```

### 2. Claude Code Testing (60 minutes)

**Setup:**

```bash
# Update Claude Code config
code ~/.claude/settings.json

# Restart Claude Code
```

**Test Process:**
Same as OpenCode, document in `test-results/claude-code-results.md`

### 3. Gemini CLI Testing (60 minutes)

**Setup:**

```bash
# Update Gemini config
code ~/.gemini/config.json

# Restart Gemini CLI
```

**Test Process:**
Same as above, document in `test-results/gemini-cli-results.md`

## Performance Benchmarking

### Benchmark Script

**Create: `benchmark/benchmark.sh`**

```bash
#!/bin/bash

echo "MCP Server Performance Benchmark"
echo "================================="
echo ""

SERVERS=("ralph-workflow" "changelog-manager" "code-tools" "context-manager")

for SERVER in "${SERVERS[@]}"; do
    echo "Testing: $SERVER"
    echo "---"

    # Measure startup time
    START_TIME=$(gdate +%s%N)
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
        node ~/dev/tooling/mcp-servers/$SERVER/build/index.js > /dev/null
    END_TIME=$(gdate +%s%N)

    DURATION=$((($END_TIME - $START_TIME) / 1000000))
    echo "Startup time: ${DURATION}ms"

    # Measure memory
    MEMORY=$(ps aux | grep "$SERVER/build/index.js" | grep -v grep | awk '{print $6}')
    echo "Memory usage: ${MEMORY}KB"
    echo ""
done

echo "✅ Benchmark complete"
```

**Run benchmark:**

```bash
chmod +x benchmark/benchmark.sh
./benchmark/benchmark.sh
```

**Expected Results:**

- Startup time: <3s for all servers combined
- Memory usage: <100MB per server
- Tool execution: <500ms simple, <2s complex

### Memory Monitoring Script

**Create: `benchmark/monitor-memory.sh`**

```bash
#!/bin/bash

# Monitor memory during 100 tool executions
echo "Running 100 tool executions and monitoring memory..."

for i in {1..100}; do
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
        node ~/dev/tooling/mcp-servers/ralph-workflow/build/index.js > /dev/null

    if [ $((i % 10)) -eq 0 ]; then
        MEMORY=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print sum}')
        echo "Iteration $i: ${MEMORY}KB"
    fi
done

echo "✅ Memory stability test complete"
```

## Ollama Model Selection Testing

**Create: `test-ollama-selection.sh`**

```bash
#!/bin/bash

echo "Testing Ollama Model Selection"
echo "=============================="
echo ""

# Test code task (should use qwen2.5-coder)
echo "1. Code generation task:"
echo "Expected model: qwen2.5-coder:7b"
# Use ralph_from_prd via Ollama bridge
# Verify which model was selected

# Test general task (should use llama3.2)
echo ""
echo "2. General task:"
echo "Expected model: llama3.2:8b"
# Use a general query
# Verify which model was selected

# Check resource-based selection
echo ""
echo "3. Resource-based selection:"
AVAILABLE_RAM=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
AVAILABLE_RAM=$((AVAILABLE_RAM * 4096 / 1024 / 1024 / 1024))
echo "Available RAM: ${AVAILABLE_RAM}GB"

if [ $AVAILABLE_RAM -gt 16 ]; then
    echo "Expected: qwen2.5-coder:7b (high RAM)"
else
    echo "Expected: deepseek-coder:6.7b (limited RAM)"
fi

echo ""
echo "✅ Model selection test complete"
```

## Platform Comparison

**Create: `test-results/platform-comparison.md`**

```markdown
# Platform Comparison

## Feature Support

| Feature            | OpenCode | Claude Code | Gemini CLI |
| ------------------ | -------- | ----------- | ---------- |
| MCP Protocol       | Native   | Native      | Native     |
| Ollama Integration | ✅       | ⚠️ Limited  | ✅         |
| Tool Execution     | ✅       | ✅          | ✅         |
| Streaming          | ✅       | ✅          | ⚠️ Partial |
| Error Handling     | ✅       | ✅          | ✅         |

## Performance

| Metric    | OpenCode | Claude Code | Gemini CLI |
| --------- | -------- | ----------- | ---------- |
| Startup   | Xs       | Xs          | Xs         |
| Tool Exec | Xms      | Xms         | Xms        |
| Memory    | XMB      | XMB         | XMB        |

## Recommendation

**Best for:**

- OpenCode: [reason]
- Claude Code: [reason]
- Gemini CLI: [reason]
```

## Validation Checklist

- [ ] All 25 tools work on OpenCode
- [ ] All 25 tools work on Claude Code
- [ ] All 25 tools work on Gemini CLI
- [ ] Performance benchmarks meet targets
- [ ] Memory usage stable over 100+ executions
- [ ] Ollama model selection works correctly
- [ ] No memory leaks detected
- [ ] Error handling works on all platforms
- [ ] Documentation complete

## Issue Tracking

**Create: `test-results/issues.md`**

```markdown
# Test Issues

## Critical Issues (Block release)

- [ ] Issue 1...

## Major Issues (Should fix)

- [ ] Issue 2...

## Minor Issues (Nice to have)

- [ ] Issue 3...

## Platform-Specific

### OpenCode

- Issue A...

### Claude Code

- Issue B...

### Gemini CLI

- Issue C...
```

## Commit Strategy

```bash
git add test-results/
git commit -m "test: add cross-platform test results for all MCP servers"

git add benchmark/
git commit -m "test: add performance benchmarking scripts"

git add test-ollama-selection.sh
git commit -m "test: add Ollama model selection validation"

git add test-results/platform-comparison.md
git commit -m "docs: add platform comparison and recommendations"
```

## Time Breakdown

- OpenCode testing: 60 min
- Claude Code testing: 60 min
- Gemini CLI testing: 60 min
- Performance benchmarking: 20 min
- Memory monitoring: 15 min
- Ollama testing: 15 min
- Documentation: 10 min
- **Total**: ~3 hours

## Next Steps

Proceed to [Phase 8: Documentation & Polish](08-documentation-polish.md)
