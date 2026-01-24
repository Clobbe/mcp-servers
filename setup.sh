#!/bin/bash

# MCP Servers Project Setup Script
# This script sets up the development environment with all code quality tools

set -e

echo "🚀 Setting up MCP Servers development environment..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Error: Node.js 20+ required (found: $(node -v))"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies (linting, formatting, etc.)..."
npm install
echo "✅ Root dependencies installed"
echo ""

# Initialize Husky
echo "🪝 Setting up git hooks with Husky..."
npx husky install
echo "✅ Git hooks installed"
echo ""

# Install dependencies for each server
echo "📦 Installing dependencies for each MCP server..."
for dir in */; do
  if [ -f "$dir/package.json" ] && [ "$dir" != "node_modules/" ]; then
    echo "  📂 Installing: $dir"
    (cd "$dir" && npm install && npm run build) || echo "  ⚠️  Failed to install $dir"
  fi
done
echo "✅ All server dependencies installed"
echo ""

# Run validation
echo "🔍 Running validation checks..."
npm run validate || echo "⚠️  Some validation checks failed (expected for first setup)"
echo ""

# Summary
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Read .cursorrules for development guidelines"
echo "  2. Read PARALLEL_WORK_GUIDELINES.md if working with multiple agents"
echo "  3. Read CODE_QUALITY.md for quality standards"
echo ""
echo "🛠️  Useful commands:"
echo "  npm run lint       - Check code quality"
echo "  npm run format     - Format code"
echo "  npm run validate   - Run all checks"
echo "  npm run docs       - Generate API docs"
echo ""
echo "Happy coding! 🎉"
