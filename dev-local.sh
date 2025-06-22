#!/bin/bash

# SafetyAdvisor Local Development Script
# This script runs frontend (npm) + backend (uv + uvicorn) concurrently

echo "🚀 Starting SafetyAdvisor local development..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:8000"
echo ""

# Kill any existing processes on ports 3000 and 8000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Function to cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start frontend
echo "📱 Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Start backend
echo "🔧 Starting backend..."
(cd backend && uv run uvicorn app:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID 