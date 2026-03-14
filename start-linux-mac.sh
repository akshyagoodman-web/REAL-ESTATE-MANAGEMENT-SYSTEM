#!/bin/bash

echo "===================================================="
echo "  KALAHANDI REAL ESTATE - STARTUP SCRIPT (Linux/Mac)"
echo "===================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Install it from: https://nodejs.org (LTS version recommended)"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "[OK] Node.js found: $NODE_VERSION"

# Install backend
echo ""
echo "[1/3] Installing Backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Backend npm install failed!"
    exit 1
fi
echo "[OK] Backend installed."

# Install frontend
echo ""
echo "[2/3] Installing Frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend npm install failed!"
    exit 1
fi
echo "[OK] Frontend installed."

# Start both
echo ""
echo "[3/3] Starting servers..."
echo ""
echo "===================================================="
echo " BACKEND:  http://localhost:5000"
echo " FRONTEND: http://localhost:3000"
echo "===================================================="
echo ""
echo "Press Ctrl+C to stop all servers."
echo ""

cd ..

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
sleep 3

# Start frontend
echo ""
echo "Starting frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "Both servers running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait and handle shutdown
wait $BACKEND_PID $FRONTEND_PID

# Cleanup on exit
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
