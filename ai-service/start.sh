#!/bin/bash
# Startup script for macOS/Linux

echo "Starting Budget Manager AI Service..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start the service
python main.py
