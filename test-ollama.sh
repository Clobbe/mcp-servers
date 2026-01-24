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

# Get count of models
MODEL_COUNT=$(ollama list | tail -n +2 | wc -l | xargs)
echo ""
echo "Total models installed: $MODEL_COUNT"

# Test installed models
echo ""
echo "3. Testing installed models..."

if ollama list | grep -q "deepseek-coder:6.7b"; then
    echo ""
    echo "Testing deepseek-coder:6.7b..."
    echo "Query: Write a hello world function in TypeScript"
    timeout 30s ollama run deepseek-coder:6.7b "Write a hello world function in TypeScript" 2>&1 | head -20
fi

if ollama list | grep -q "qwen2.5-coder:7b"; then
    echo ""
    echo "Testing qwen2.5-coder:7b..."
    echo "Query: Write a hello world function in TypeScript"
    timeout 30s ollama run qwen2.5-coder:7b "Write a hello world function in TypeScript" 2>&1 | head -20
fi

if ollama list | grep -q "llama3.2:8b"; then
    echo ""
    echo "Testing llama3.2:8b..."
    echo "Query: Explain what TypeScript is"
    timeout 30s ollama run llama3.2:8b "Explain what TypeScript is in one sentence" 2>&1 | head -20
fi

# Memory usage
echo ""
echo "4. Memory usage:"
ps aux | grep ollama | grep -v grep | awk '{print "Process: " $2 " | CPU: " $3 "% | Memory: " $4 "%"}'

# Check API endpoint
echo ""
echo "5. API status:"
curl -s http://localhost:11434/api/tags | jq -r '.models[] | "  - \(.name) (Size: \(.size / 1000000000 | floor)GB)"' 2>/dev/null || echo "jq not installed, showing raw response"

echo ""
echo "✅ Ollama integration test complete"
echo ""
echo "Configuration file: ollama-config.json"
echo "Monitoring script: monitor-ollama.sh"
