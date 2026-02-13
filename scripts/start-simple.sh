#!/bin/bash

# AI Company Simple Startup Script (without Docker)

echo "🚀 Starting AI Company Project (Simple Mode)..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Homebrew is installed (for macOS)
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first."
    echo "Run: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "📦 Installing MySQL..."
    brew install mysql
fi

# Check if MySQL is running
if ! brew services list | grep mysql | grep started &> /dev/null; then
    echo "🔄 Starting MySQL..."
    brew services start mysql
    sleep 5
fi

# Initialize database
echo "🗄️ Setting up database..."
# Create database user if it doesn't exist
mysql -u root -e "CREATE USER IF NOT EXISTS 'ai_company'@'localhost' IDENTIFIED BY 'ai_company_password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'ai_company'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Create database if it doesn't exist
mysql -u ai_company -pai_company_password -e "CREATE DATABASE IF NOT EXISTS ai_company_db;"

# Initialize database schema
mysql -u ai_company -pai_company_password ai_company_db < database/init/01-init-mysql.sql

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "📦 Installing Redis..."
    brew install redis
fi

# Check if Redis is running
if ! brew services list | grep redis | grep started &> /dev/null; then
    echo "🔄 Starting Redis..."
    brew services start redis
    sleep 3
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

# Check if deepseek-r1:8b model is downloaded
if ! ollama list | grep -q "deepseek-r1:8b"; then
    echo "📥 Downloading deepseek-r1:8b model (this may take a while)..."
    ollama pull deepseek-r1:8b
fi

# Start backend
echo "🔧 Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check if backend is healthy
echo "🔍 Checking backend health..."
if curl -s http://localhost:3000/health | grep -q "OK"; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 15

echo "🎉 AI Company Project is ready!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:3000"
echo "🤖 Ollama API: http://localhost:11434"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Keep script running
echo "Press Ctrl+C to stop all services"
wait