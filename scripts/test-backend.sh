#!/bin/bash

# AI Company Backend Test Script

echo "🧪 Testing AI Company Backend..."

# Start backend in background
echo "🚀 Starting backend..."
cd /Users/Yoo/SVN/00.GITHUB/260200.AICompany/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Test health endpoint
echo "🔍 Testing health endpoint..."
curl -s http://localhost:3000/health | jq '.' || echo "Health check failed"

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test auth endpoint
echo "Testing auth endpoint..."
curl -s http://localhost:3000/api/auth/health | jq '.' || echo "Auth health check failed"

# Test characters endpoint
echo "Testing characters endpoint..."
curl -s http://localhost:3000/api/characters/health | jq '.' || echo "Characters health check failed"

# Test projects endpoint
echo "Testing projects endpoint..."
curl -s http://localhost:3000/api/projects/health | jq '.' || echo "Projects health check failed"

# Test decisions endpoint
echo "Testing decisions endpoint..."
curl -s http://localhost:3000/api/decisions/health | jq '.' || echo "Decisions health check failed"

# Stop backend
echo "🛑 Stopping backend..."
kill $BACKEND_PID

echo "✅ Backend testing completed!"