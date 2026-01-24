#!/bin/bash

# MCP Servers - Shell Aliases
# Source this file in your ~/.zshrc or ~/.bashrc:
#   source ~/dev/tooling/mcp-servers/aliases.sh

# Directory shortcuts
alias mcp='cd ~/dev/tooling/mcp-servers'
alias mcp-ralph='cd ~/dev/tooling/mcp-servers/ralph-workflow'
alias mcp-changelog='cd ~/dev/tooling/mcp-servers/changelog-manager'
alias mcp-code='cd ~/dev/tooling/mcp-servers/code-tools'

# Build all servers
alias mcp-build-all='(cd ~/dev/tooling/mcp-servers && for server in ralph-workflow changelog-manager code-tools; do cd $server && echo "Building $server..." && npm run build && cd ..; done && echo "✅ All servers built")'

# Test all servers  
alias mcp-test-all='(cd ~/dev/tooling/mcp-servers && for server in ralph-workflow changelog-manager code-tools; do cd $server && echo "Testing $server..." && npm test && cd ..; done && echo "✅ All tests passed")'

# Install dependencies for all
alias mcp-install-all='(cd ~/dev/tooling/mcp-servers && for server in ralph-workflow changelog-manager code-tools; do cd $server && echo "Installing $server..." && npm install && cd ..; done && echo "✅ All dependencies installed")'

# Watch mode for development (usage: mcp-watch-ralph, mcp-watch-changelog, etc.)
alias mcp-watch-ralph='cd ~/dev/tooling/mcp-servers/ralph-workflow && npm run watch'
alias mcp-watch-changelog='cd ~/dev/tooling/mcp-servers/changelog-manager && npm run watch'
alias mcp-watch-code='cd ~/dev/tooling/mcp-servers/code-tools && npm run watch'

# List all MCP tools for each server
alias mcp-list-ralph='echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}" | node ~/dev/tooling/mcp-servers/ralph-workflow/build/index.js 2>&1 | grep -A 100 "tools"'
alias mcp-list-changelog='echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}" | node ~/dev/tooling/mcp-servers/changelog-manager/build/index.js 2>&1 | grep -A 100 "tools"'
alias mcp-list-code='echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}" | node ~/dev/tooling/mcp-servers/code-tools/build/index.js 2>&1 | grep -A 100 "tools"'
alias mcp-list-all='echo "=== Ralph Workflow ===" && mcp-list-ralph && echo -e "\n=== Changelog Manager ===" && mcp-list-changelog && echo -e "\n=== Code Tools ===" && mcp-list-code'

# Lint and format
alias mcp-lint='cd ~/dev/tooling/mcp-servers/$1 && npm run lint'
alias mcp-lint-fix='cd ~/dev/tooling/mcp-servers/$1 && npm run lint:fix'
alias mcp-format='cd ~/dev/tooling/mcp-servers/$1 && npm run format'

# Monitor Ollama
alias mcp-ollama-status='curl -s http://localhost:11434/api/tags | jq -r ".models[] | .name"'
alias mcp-ollama-test='~/dev/tooling/mcp-servers/test-ollama.sh'
alias mcp-ollama-monitor='~/dev/tooling/mcp-servers/monitor-ollama.sh'

# Validation
alias mcp-validate='~/dev/tooling/mcp-servers/validate-all.sh'

# Logs (if logs directory exists)
alias mcp-logs='tail -f ~/dev/tooling/mcp-servers/logs/*.log 2>/dev/null || echo "No log files found"'

# Git shortcuts
alias mcp-status='cd ~/dev/tooling/mcp-servers && git status'
alias mcp-pull='cd ~/dev/tooling/mcp-servers && git pull'
alias mcp-push='cd ~/dev/tooling/mcp-servers && git push'
alias mcp-log='cd ~/dev/tooling/mcp-servers && git log --oneline -20'

# Quick rebuild and test
alias mcp-rebuild='cd ~/dev/tooling/mcp-servers/$1 && rm -rf build && npm run build && echo "✅ Rebuilt $1"'

# Check server status
alias mcp-check='echo "Checking MCP servers..." && for server in ralph-workflow changelog-manager code-tools; do echo -n "$server: "; if [ -f ~/dev/tooling/mcp-servers/$server/build/index.js ]; then echo "✅ Built"; else echo "❌ Not built"; fi; done'

echo "✅ MCP Server aliases loaded"
echo ""
echo "📦 Available commands:"
echo "  mcp              - Navigate to MCP servers directory"
echo "  mcp-build-all    - Build all servers"
echo "  mcp-test-all     - Test all servers"
echo "  mcp-install-all  - Install all dependencies"
echo "  mcp-list-all     - List all available tools"
echo "  mcp-validate     - Run full validation"
echo "  mcp-check        - Check build status"
echo ""
echo "🔍 Per-server commands:"
echo "  mcp-ralph        - Go to ralph-workflow"
echo "  mcp-changelog    - Go to changelog-manager"
echo "  mcp-code         - Go to code-tools"
echo "  mcp-watch-*      - Watch mode for development"
echo "  mcp-list-*       - List tools for specific server"
echo ""
echo "🦙 Ollama commands:"
echo "  mcp-ollama-status   - Show installed models"
echo "  mcp-ollama-test     - Run integration tests"
echo "  mcp-ollama-monitor  - Real-time monitoring"
echo ""
echo "For full documentation, see: ~/dev/tooling/mcp-servers/README.md"
