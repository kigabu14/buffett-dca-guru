#!/bin/bash
# Setup script for Python stock data service

echo "Setting up Python stock data service..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    python3 -m pip install -r requirements.txt
    echo "Python dependencies installed successfully."
else
    echo "Error: requirements.txt not found."
    exit 1
fi

# Make the Python script executable
chmod +x python_service/stock_data_service.py

echo "Setup complete!"
echo ""
echo "Usage examples:"
echo "  python3 python_service/stock_data_service.py AAPL"
echo "  python3 python_service/stock_data_service.py AAPL MSFT GOOGL"
echo ""
echo "For Thai stocks, use .BK suffix:"
echo "  python3 python_service/stock_data_service.py PTT.BK BBL.BK"