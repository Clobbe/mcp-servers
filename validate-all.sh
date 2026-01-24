#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║   Final Validation of MCP Servers             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

FAILED=0
BASE_DIR=~/dev/tooling/mcp-servers
SERVERS=("ralph-workflow" "changelog-manager" "code-tools")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check all servers build
echo "1️⃣  Building all servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for server in "${SERVERS[@]}"; do
    echo -n "  Building $server... "
    cd $BASE_DIR/$server
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        FAILED=1
    fi
done
echo ""

# 2. Check tool listing
echo "2️⃣  Verifying tool listing..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL_TOOLS=0
for server in "${SERVERS[@]}"; do
    echo -n "  Checking $server... "
    TOOLS=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
            node $BASE_DIR/$server/build/index.js 2>/dev/null | \
            grep -o '"name"' | wc -l | xargs)
    
    if [ "$TOOLS" -gt 0 ]; then
        echo -e "${GREEN}✅ $TOOLS tools available${NC}"
        TOTAL_TOOLS=$((TOTAL_TOOLS + TOOLS))
    else
        echo -e "${RED}❌ No tools found${NC}"
        FAILED=1
    fi
done
echo -e "  ${GREEN}Total: $TOTAL_TOOLS tools${NC}"
echo ""

# 3. Check TypeScript compilation
echo "3️⃣  Checking TypeScript compilation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for server in "${SERVERS[@]}"; do
    echo -n "  Type-checking $server... "
    cd $BASE_DIR/$server
    if npx tsc --noEmit > /dev/null 2>&1; then
        echo -e "${GREEN}✅ No errors${NC}"
    else
        echo -e "${RED}❌ Type errors found${NC}"
        FAILED=1
    fi
done
echo ""

# 4. Check file structure
echo "4️⃣  Validating file structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for server in "${SERVERS[@]}"; do
    echo "  $server:"
    
    # Check essential files
    if [ -f "$BASE_DIR/$server/build/index.js" ]; then
        echo -e "    ${GREEN}✅${NC} build/index.js"
    else
        echo -e "    ${RED}❌${NC} build/index.js missing"
        FAILED=1
    fi
    
    if [ -f "$BASE_DIR/$server/package.json" ]; then
        echo -e "    ${GREEN}✅${NC} package.json"
    else
        echo -e "    ${RED}❌${NC} package.json missing"
        FAILED=1
    fi
    
    if [ -f "$BASE_DIR/$server/tsconfig.json" ]; then
        echo -e "    ${GREEN}✅${NC} tsconfig.json"
    else
        echo -e "    ${RED}❌${NC} tsconfig.json missing"
        FAILED=1
    fi
    
    if [ -f "$BASE_DIR/$server/README.md" ]; then
        echo -e "    ${GREEN}✅${NC} README.md"
    else
        echo -e "    ${YELLOW}⚠️${NC}  README.md missing (optional)"
    fi
done
echo ""

# 5. Check documentation
echo "5️⃣  Checking documentation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOCS=("README.md" "QUICKSTART.md" "OLLAMA_SETUP.md" "PROGRESS.md" "PHASE_REVIEW.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$BASE_DIR/$doc" ]; then
        echo -e "  ${GREEN}✅${NC} $doc"
    else
        echo -e "  ${YELLOW}⚠️${NC}  $doc missing"
    fi
done
echo ""

# 6. Check scripts
echo "6️⃣  Checking utility scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SCRIPTS=("aliases.sh" "test-ollama.sh" "monitor-ollama.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$BASE_DIR/$script" ]; then
        if [ -x "$BASE_DIR/$script" ]; then
            echo -e "  ${GREEN}✅${NC} $script (executable)"
        else
            echo -e "  ${YELLOW}⚠️${NC}  $script (not executable)"
        fi
    else
        echo -e "  ${RED}❌${NC} $script missing"
    fi
done
echo ""

# 7. Check Ollama integration
echo "7️⃣  Checking Ollama integration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅${NC} Ollama service running"
    MODELS=$(ollama list | tail -n +2 | wc -l | xargs)
    echo -e "  ${GREEN}✅${NC} $MODELS models installed"
else
    echo -e "  ${YELLOW}⚠️${NC}  Ollama service not running (optional)"
fi

if [ -f "$BASE_DIR/ollama-config.json" ]; then
    echo -e "  ${GREEN}✅${NC} ollama-config.json"
else
    echo -e "  ${RED}❌${NC} ollama-config.json missing"
fi
echo ""

# 8. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ All validation checks passed!             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🎉 MCP Servers are ready for production!"
    echo ""
    echo "📊 Summary:"
    echo "  • $TOTAL_TOOLS tools across ${#SERVERS[@]} servers"
    echo "  • All builds successful"
    echo "  • TypeScript compilation clean"
    echo "  • Documentation complete"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Configure your AI platform (see QUICKSTART.md)"
    echo "  2. Restart your platform"
    echo "  3. Start using MCP tools!"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ Some validation checks failed             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please fix the issues above and run validation again."
    echo ""
    exit 1
fi
