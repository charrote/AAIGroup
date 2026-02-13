#!/bin/bash

# AI Company Stop Script

echo "🛑 Stopping AI Company Project..."

# Stop Docker containers
echo "🐳 Stopping Docker containers..."
docker-compose down

# Stop Ollama if it was started by our script
echo "🤖 Stopping Ollama..."
pkill -f "ollama serve" 2>/dev/null || echo "Ollama was not running or was started manually"

echo "✅ AI Company Project has been stopped."