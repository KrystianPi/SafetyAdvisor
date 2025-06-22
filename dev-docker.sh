#!/bin/bash

# SafetyAdvisor Docker Development Script
# This script runs frontend (npm) + backend (Docker) concurrently

echo "🚀 Starting SafetyAdvisor development with Docker backend..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🐳 Backend will be available at: http://localhost:8000"
echo ""

# Kill any existing processes on ports 3000 and 8000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Stop any existing backend container
echo "🐳 Stopping existing backend container..."
docker stop safety-advisor-backend 2>/dev/null || true

# Function to cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
    docker stop safety-advisor-backend 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start frontend
echo "📱 Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Build and start backend with Docker
echo "🐳 Building and starting backend with Docker..."
(cd backend && docker build -t safety-advisor-backend . && \
docker run --rm --name safety-advisor-backend -p 8000:80 safety-advisor-backend) &
DOCKER_PID=$!

# Wait for both processes
wait $FRONTEND_PID $DOCKER_PID 