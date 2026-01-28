#!/bin/bash

# Golfin Garage Training System - Startup Script

echo "🏌️  Starting Golfin Garage Training System..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "✓ .env created. Please review and update if needed."
  echo ""
fi

# Create progress directory if it doesn't exist
mkdir -p progress

# Start the server in the background
echo "Starting backend server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait for server to be ready
sleep 3

# Start the client
echo "Starting frontend client..."
cd client && npm run dev &
CLIENT_PID=$!

echo ""
echo "✓ System started successfully!"
echo ""
echo "📚 Access the training application at: http://localhost:3000"
echo "🔧 Backend API running at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo ''; echo 'Servers stopped.'; exit" INT
wait
