#!/bin/bash

# Monitor Ollama performance in real-time
# Usage: ./monitor-ollama.sh
# Press Ctrl+C to stop

echo "Ollama Performance Monitor"
echo "=========================="
echo "Press Ctrl+C to stop monitoring"
echo ""

# Check if watch is available
if ! command -v watch &> /dev/null; then
    echo "Error: 'watch' command not found. Install with: brew install watch"
    echo ""
    echo "Running single snapshot instead..."
    echo ""
fi

# Function to display status
show_status() {
    clear
    echo "=== Ollama Status ($(date +"%Y-%m-%d %H:%M:%S")) ==="
    echo ""
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama Service: RUNNING"
    else
        echo "❌ Ollama Service: NOT RUNNING"
        echo "Start with: ollama serve"
        return
    fi
    
    echo ""
    echo "=== Available Models ==="
    ollama list
    
    echo ""
    echo "=== Resource Usage ==="
    ps aux | grep "ollama" | grep -v grep | awk '{printf "Process: %s | CPU: %s%% | Memory: %s%% | VSZ: %sMB | RSS: %sMB\n", $2, $3, $4, $5/1024, $6/1024}'
    
    echo ""
    echo "=== System Memory ==="
    vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%-16s % 16.2f Mi\n", "$1:", $2 * $size / 1048576);' | head -5
    
    echo ""
    echo "=== Active Connections ==="
    lsof -i :11434 2>/dev/null | grep LISTEN || echo "No active connections"
    
    echo ""
    echo "=== Recent API Activity (last 5 seconds) ==="
    # This is a placeholder - actual logging would require Ollama API logging
    echo "Check ollama-config.json for log file location"
    
    echo ""
    echo "=== Quick Stats ==="
    MODEL_COUNT=$(ollama list | tail -n +2 | wc -l | xargs)
    echo "Total Models: $MODEL_COUNT"
    
    if [ -f "ollama-config.json" ]; then
        echo "Config File: ✅ Found"
    else
        echo "Config File: ❌ Not Found"
    fi
}

# If watch is available, use it for continuous monitoring
if command -v watch &> /dev/null; then
    watch -n 2 -c "bash $0 snapshot"
else
    # Otherwise, use a simple loop
    while true; do
        show_status
        sleep 2
    done
fi

# Handle snapshot mode (called by watch)
if [ "$1" = "snapshot" ]; then
    show_status
    exit 0
fi
