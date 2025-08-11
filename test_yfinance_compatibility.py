#!/usr/bin/env python3
"""
Test script to verify yfinance compatibility and Python service functionality.
"""

import sys
import os
import json

# Add python_service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_service'))

try:
    from stock_data_service import get_stock_data, fetch_single_stock
    print("✅ Python service imports successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Run './setup_python_service.sh' to install dependencies")
    sys.exit(1)

def test_single_stock():
    """Test fetching data for a single stock."""
    print("\n🧪 Testing single stock fetch...")
    
    test_symbols = ['AAPL', 'MSFT']
    
    for symbol in test_symbols:
        print(f"  Testing {symbol}...")
        try:
            result = fetch_single_stock(symbol)
            if result and result.get('success'):
                print(f"    ✅ {symbol}: Price = ${result.get('price', 'N/A'):.2f}")
            else:
                print(f"    ⚠️  {symbol}: Using fallback data")
        except Exception as e:
            print(f"    ❌ {symbol}: Error - {e}")

def test_multiple_stocks():
    """Test fetching data for multiple stocks."""
    print("\n🧪 Testing multiple stocks fetch...")
    
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'INVALID_SYMBOL']
    
    try:
        result = get_stock_data(symbols)
        print(f"  ✅ Requested: {result['totalRequested']}")
        print(f"  ✅ Successful: {result['totalSuccessful']}")
        print(f"  ⚠️  Failed: {result['totalFailed']}")
        
        if result['failedSymbols']:
            print(f"  Failed symbols: {', '.join(result['failedSymbols'])}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

def test_thai_stocks():
    """Test Thai stock symbol handling."""
    print("\n🧪 Testing Thai stocks...")
    
    thai_symbols = ['PTT.BK', 'BBL.BK']
    
    for symbol in thai_symbols:
        print(f"  Testing {symbol}...")
        try:
            result = fetch_single_stock(symbol)
            if result:
                print(f"    ✅ {symbol}: Price = {result.get('price', 'N/A'):.2f} {result.get('currency', 'THB')}")
                print(f"    Market: {result.get('market', 'N/A')}")
            else:
                print(f"    ❌ {symbol}: No data returned")
        except Exception as e:
            print(f"    ❌ {symbol}: Error - {e}")

def main():
    """Run all tests."""
    print("🚀 Testing yfinance compatibility and Python service...")
    
    # Check if yfinance is available
    try:
        import yfinance as yf
        print(f"✅ yfinance version: {yf.__version__}")
    except ImportError:
        print("❌ yfinance not installed. Run './setup_python_service.sh'")
        return
    
    test_single_stock()
    test_multiple_stocks()
    test_thai_stocks()
    
    print("\n✅ Testing complete!")
    print("\nNote: Some tests may show warnings or use fallback data if:")
    print("  - Network connectivity issues")
    print("  - Yahoo Finance API rate limiting")
    print("  - Invalid or delisted symbols")

if __name__ == "__main__":
    main()