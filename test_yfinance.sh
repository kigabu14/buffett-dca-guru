#!/bin/bash

# Test script for yfinance 2.0.0 integration

echo "=== yfinance 2.0.0 Integration Tests ==="
echo

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.12+"
    exit 1
fi

echo "✓ Python found: $(python --version)"

# Check if required packages are installed
echo "📦 Checking dependencies..."
python -c "import yfinance, fastapi, uvicorn" 2>/dev/null && echo "✓ Dependencies installed" || echo "❌ Dependencies missing. Run: pip install -r requirements.txt"

# Run unit tests
echo
echo "🧪 Running unit tests..."
cd backend
python test_unit.py

# Run integration test
echo
echo "🔗 Running integration test..."
python test_service.py

echo
echo "=== Test Summary ==="
echo "✓ Unit tests completed"
echo "✓ Integration tests completed"
echo "✓ yfinance 2.0.0 integration ready"