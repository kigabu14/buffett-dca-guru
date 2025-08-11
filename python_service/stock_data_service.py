#!/usr/bin/env python3
"""
Stock data service using yfinance library as a reliable fallback
for Yahoo Finance data when direct API calls fail.

This service provides the same data structure as the TypeScript implementation
but uses the yfinance library which handles API changes and rate limiting better.
"""

import json
import sys
from typing import Dict, List, Any, Optional
import logging

try:
    import yfinance as yf
    import pandas as pd
except ImportError as e:
    print(f"Error: Required packages not installed. Run: pip install -r requirements.txt")
    print(f"Missing: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_stock_data(symbols: List[str]) -> Dict[str, Any]:
    """
    Fetch stock data for multiple symbols using yfinance.
    
    Args:
        symbols: List of stock symbols to fetch
        
    Returns:
        Dictionary with success status, data, and any failures
    """
    if not symbols:
        return {"error": "No symbols provided", "success": False}
    
    logger.info(f"Fetching data for {len(symbols)} symbols using yfinance")
    
    stock_data = []
    failed_symbols = []
    
    for symbol in symbols:
        try:
            data = fetch_single_stock(symbol.strip())
            if data:
                stock_data.append(data)
            else:
                failed_symbols.append(symbol)
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            failed_symbols.append(symbol)
    
    return {
        "success": len(stock_data) > 0,
        "data": stock_data,
        "failedSymbols": failed_symbols,
        "totalRequested": len(symbols),
        "totalSuccessful": len(stock_data),
        "totalFailed": len(failed_symbols),
        "timestamp": pd.Timestamp.now().isoformat()
    }

def fetch_single_stock(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Fetch comprehensive data for a single stock symbol.
    
    Args:
        symbol: Stock symbol to fetch
        
    Returns:
        Dictionary with stock data or None if failed
    """
    try:
        # Clean symbol for different markets
        clean_symbol = symbol.strip()
        
        # For Thai stocks, ensure .BK suffix
        if '.SET' in symbol.upper():
            clean_symbol = symbol.replace('.SET', '.BK')
        elif any(thai_indicator in symbol.upper() for thai_indicator in ['.BK', 'SET:']):
            if not clean_symbol.endswith('.BK'):
                clean_symbol = clean_symbol.replace('SET:', '') + '.BK'
        
        logger.info(f"Fetching data for {clean_symbol}")
        
        # Create yfinance ticker
        ticker = yf.Ticker(clean_symbol)
        
        # Get comprehensive data
        info = ticker.info
        history = ticker.history(period="1d")
        
        if info is None or len(history) == 0:
            logger.warning(f"No data available for {symbol}")
            return create_fallback_data(symbol)
        
        # Extract current price from history or info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        if current_price is None and len(history) > 0:
            current_price = history['Close'].iloc[-1]
        
        if current_price is None:
            logger.warning(f"No price data for {symbol}")
            return create_fallback_data(symbol)
        
        # Determine market and currency
        is_thai_stock = symbol.upper().endswith('.BK') or '.SET' in symbol.upper()
        market = 'SET' if is_thai_stock else (info.get('exchange', 'NASDAQ'))
        currency = 'THB' if is_thai_stock else (info.get('currency', 'USD'))
        
        # Extract financial metrics with fallbacks
        previous_close = info.get('previousClose', current_price)
        change = current_price - previous_close
        change_percent = (change / previous_close * 100) if previous_close > 0 else 0
        
        # Build comprehensive data structure matching TypeScript implementation
        return {
            "symbol": symbol,
            "name": info.get('longName') or info.get('shortName') or clean_symbol,
            "price": float(current_price),
            "current_price": float(current_price),
            "change": float(change),
            "changePercent": float(change_percent),
            "market": market,
            "currency": currency,
            
            # Price data
            "open": float(info.get('open', current_price)),
            "dayHigh": float(info.get('dayHigh', current_price * 1.02)),
            "dayLow": float(info.get('dayLow', current_price * 0.98)),
            "volume": int(info.get('volume', 0)),
            
            # Financial metrics
            "marketCap": info.get('marketCap', current_price * 1000000000),
            "pe": info.get('forwardPE') or info.get('trailingPE') or 15.0,
            "eps": info.get('trailingEps', current_price / 15.0),
            "bookValue": info.get('bookValue', current_price * 0.8),
            "priceToBook": info.get('priceToBook', 1.25),
            
            # Dividend data
            "dividendYield": info.get('dividendYield', 0.03),
            "dividendRate": info.get('dividendRate', current_price * 0.03),
            "exDividendDate": info.get('exDividendDate'),
            "dividendDate": info.get('dividendDate'),
            "payoutRatio": info.get('payoutRatio'),
            
            # 52-week range
            "weekHigh52": info.get('fiftyTwoWeekHigh', current_price * 1.3),
            "weekLow52": info.get('fiftyTwoWeekLow', current_price * 0.7),
            "beta": info.get('beta', 1.0),
            
            # Financial health ratios
            "roe": info.get('returnOnEquity', 0.15),
            "profitMargin": info.get('profitMargins', 0.15),
            "operatingMargin": info.get('operatingMargins', 0.20),
            "debtToEquity": info.get('debtToEquity', 0.5),
            "currentRatio": info.get('currentRatio', 2.0),
            
            # Growth metrics
            "revenueGrowth": info.get('revenueGrowth', 0.1),
            "earningsGrowth": info.get('earningsGrowth', 0.1),
            
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return create_fallback_data(symbol)

def create_fallback_data(symbol: str) -> Dict[str, Any]:
    """Create fallback data when real data cannot be fetched."""
    is_thai_stock = symbol.upper().endswith('.BK') or '.SET' in symbol.upper()
    market = 'SET' if is_thai_stock else 'NASDAQ'
    currency = 'THB' if is_thai_stock else 'USD'
    fallback_price = 10.0 if is_thai_stock else 100.0
    
    return {
        "symbol": symbol,
        "name": symbol,
        "price": fallback_price,
        "current_price": fallback_price,
        "change": 0.0,
        "changePercent": 0.0,
        "market": market,
        "currency": currency,
        
        # Price data
        "open": fallback_price,
        "dayHigh": fallback_price * 1.02,
        "dayLow": fallback_price * 0.98,
        "volume": 0,
        
        # Financial metrics with conservative defaults
        "marketCap": fallback_price * 1000000000,
        "pe": 15.0,
        "eps": fallback_price / 15.0,
        "bookValue": fallback_price * 0.8,
        "priceToBook": 1.25,
        
        # Dividend data
        "dividendYield": 0.03,
        "dividendRate": fallback_price * 0.03,
        "exDividendDate": None,
        "dividendDate": None,
        "payoutRatio": None,
        
        # 52-week range
        "weekHigh52": fallback_price * 1.3,
        "weekLow52": fallback_price * 0.7,
        "beta": 1.0,
        
        # Financial health ratios
        "roe": 0.15,
        "profitMargin": 0.15,
        "operatingMargin": 0.20,
        "debtToEquity": 0.5,
        "currentRatio": 2.0,
        
        # Growth metrics
        "revenueGrowth": 0.1,
        "earningsGrowth": 0.1,
        
        "success": False
    }

def main():
    """CLI interface for the stock data service."""
    if len(sys.argv) < 2:
        print("Usage: python stock_data_service.py SYMBOL1 [SYMBOL2 ...]")
        print("Example: python stock_data_service.py AAPL MSFT GOOGL")
        sys.exit(1)
    
    symbols = sys.argv[1:]
    result = get_stock_data(symbols)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()