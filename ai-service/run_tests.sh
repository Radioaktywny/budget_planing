#!/bin/bash

echo "Running AI Service Tests..."
echo ""

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Warning: Virtual environment not found. Please run setup first."
    echo ""
fi

# Run pytest
pytest -v

echo ""
echo "Tests completed!"
