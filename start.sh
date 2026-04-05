#!/bin/bash
# Quick start script for Private Drop Telegram Store
# Usage: ./start.sh

set -e

echo "=== Private Drop - Telegram Store ==="

# Check .env
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Copy .env.example to .env and fill in your values:"
    echo "  cp .env.example .env"
    exit 1
fi

# Install Python deps
echo "[1/4] Installing Python dependencies..."
pip install -r requirements.txt -q

# Install frontend deps
echo "[2/4] Installing frontend dependencies..."
cd webapp && npm install --silent && cd ..

# Start backend
echo "[3/4] Starting backend on port 8000..."
python main.py &
BACKEND_PID=$!

# Start frontend
echo "[4/4] Starting frontend on port 5173..."
cd webapp && npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend running on http://localhost:8000"
echo "✓ Frontend running on http://localhost:5173"
echo ""
echo "Next steps:"
echo "  1. Run ngrok: ngrok http 5173"
echo "  2. Copy the HTTPS URL from ngrok"
echo "  3. Update WEBAPP_URL in .env with the ngrok URL"
echo "  4. Restart this script"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
