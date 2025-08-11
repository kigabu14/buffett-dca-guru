"""
Simple test script for the yfinance 2.0.0 backend service
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from stock_service import StockDataService

def test_stock_service():
    """Test the StockDataService functionality"""
    print("Testing yfinance 2.0.0 StockDataService...")
    
    # Test 1: Single stock data (US stock)
    print("\n1. Testing single US stock (AAPL)...")
    try:
        aapl_data = StockDataService.get_stock_data('AAPL')
        print(f"✓ Success: {aapl_data['symbol']} - ${aapl_data['current_price']:.2f}")
        print(f"  Company: {aapl_data['company_name']}")
        print(f"  PE Ratio: {aapl_data['pe_ratio']:.2f}")
        print(f"  Dividend Yield: {aapl_data['dividend_yield']:.2%}")
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
    
    # Test 2: Thai stock
    print("\n2. Testing Thai stock (PTT.BK)...")
    try:
        ptt_data = StockDataService.get_stock_data('PTT.BK')
        print(f"✓ Success: {ptt_data['symbol']} - ฿{ptt_data['current_price']:.2f}")
        print(f"  Company: {ptt_data['company_name']}")
        print(f"  Market: {ptt_data['market']}")
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
    
    # Test 3: Multiple stocks
    print("\n3. Testing multiple stocks...")
    try:
        symbols = ['AAPL', 'MSFT', 'GOOGL']
        multiple_data = StockDataService.get_multiple_stocks(symbols)
        print(f"✓ Success: Fetched {len(multiple_data)} stocks")
        for stock in multiple_data:
            status = "✓" if stock.get('success', False) else "✗"
            print(f"  {status} {stock['symbol']}: ${stock['current_price']:.2f}")
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
    
    # Test 4: Historical data
    print("\n4. Testing historical data...")
    try:
        historical = StockDataService.get_historical_data('AAPL', period='5d', interval='1d')
        print(f"✓ Success: Fetched {len(historical)} historical data points")
        if historical:
            latest = historical[-1]
            print(f"  Latest: {latest['date']} - ${latest['price']:.2f}")
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
    
    # Test 5: API status
    print("\n5. Testing API status...")
    try:
        status = StockDataService.check_api_status()
        print(f"✓ API Status: {status['status']}")
        print(f"  Message: {status['message']}")
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_stock_service()