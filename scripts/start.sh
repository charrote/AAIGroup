#!/bin/bash

# AI Company Startup Script

echo "🚀 Starting AI Company Project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first."
    echo "Run: curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# Check if Ollama is running
if ! ollama list &> /dev/null; then
    echo "🔄 Starting Ollama..."
    ollama serve &
    sleep 5
fi

# Check if Llama 3 8B model is downloaded
if ! ollama list | grep -q "llama3:8b"; then
    echo "📥 Downloading Llama 3 8B model (this may take a while)..."
    ollama pull llama3:8b
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if backend is healthy
echo "🔍 Checking backend health..."
if curl -s http://localhost:3000/health | grep -q "OK"; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

# Check if frontend is healthy
echo "🔍 Checking frontend health..."
if curl -s http://localhost:3001 | grep -q "AI Company"; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

echo "🎉 AI Company Project is ready!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:3000"
echo "🤖 Ollama API: http://localhost:11434"

# Optional: Start ngrok for external access
read -p "Do you want to start ngrok for external access? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v ngrok &> /dev/null; then
        echo "🌐 Starting ngrok..."
        ngrok http 3001
    else
        echo "❌ ngrok is not installed. Please install ngrok first."
        echo "Download from: https://ngrok.com/download"
    fi
fi