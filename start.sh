#!/bin/bash

# DevNotes - Quick Start Script
# Just runs the apps (assumes setup is already done)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DevNotes - Starting Servers${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 not found${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not found${NC}"
    exit 1
fi

# Check if venv exists (using myvenv as found in backend)
if [ ! -d "$SCRIPT_DIR/backend/myvenv" ]; then
    echo -e "${RED}Error: Virtual environment (myvenv) not found!${NC}"
    echo -e "${YELLOW}Please ensure the backend virtual environment is set up in backend/myvenv${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${RED}Error: node_modules not found!${NC}"
    echo -e "${YELLOW}Please run 'npm install' in the frontend directory${NC}"
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
cd "$SCRIPT_DIR/backend"
source myvenv/bin/activate
echo -e "${BLUE}Starting Backend: http://127.0.0.1:5000${NC}"
# Using run.py as the entry point
python run.py &
BACKEND_PID=$!

sleep 2

# Start Frontend
cd "$SCRIPT_DIR/frontend"
echo -e "${BLUE}Starting Frontend: http://localhost:5173${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✓ Both servers running!${NC}"
echo -e "Backend:  ${BLUE}http://127.0.0.1:5000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

wait
