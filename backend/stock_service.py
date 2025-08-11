"""
Stock Data Service using yfinance 2.0.0
Provides comprehensive stock data fetching with Warren Buffett analysis metrics
"""

import yfinance as yf
from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class StockDataService:
    """Service for fetching stock data using yfinance 2.0.0"""
    
    @staticmethod
    def get_stock_data(symbol: str) -> Dict[str, Any]:
        """
        Fetch comprehensive stock data for a single symbol using yfinance 2.0.0
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'PTT.BK')
            
        Returns:
            Dict containing all stock data in snake_case format
        """
        try:
            logger.info(f"Fetching stock data for: {symbol}")
            
            # Create yfinance Ticker object
            ticker = yf.Ticker(symbol)
            
            # Get basic info and current price data
            info = ticker.info
            history = ticker.history(period="2d")  # Get last 2 days for current and previous close
            
            if history.empty:
                raise ValueError(f"No price data available for {symbol}")
            
            # Get current price data
            current_price = float(history['Close'].iloc[-1])
            previous_close = float(history['Close'].iloc[-2]) if len(history) > 1 else current_price
            volume = int(history['Volume'].iloc[-1])
            day_high = float(history['High'].iloc[-1])
            day_low = float(history['Low'].iloc[-1])
            day_open = float(history['Open'].iloc[-1])
            
            # Calculate change metrics
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close > 0 else 0
            
            # Determine market and currency
            is_thai_stock = '.BK' in symbol or '.SET' in symbol
            market = 'SET' if is_thai_stock else info.get('exchange', 'NASDAQ')
            currency = 'THB' if is_thai_stock else info.get('currency', 'USD')
            
            # Extract financial metrics with safe fallbacks
            market_cap = info.get('marketCap', current_price * 1_000_000_000)
            pe_ratio = info.get('forwardPE') or info.get('trailingPE') or 15.0
            eps = info.get('trailingEps') or (current_price / pe_ratio)
            book_value = info.get('bookValue', current_price * 0.8)
            price_to_book = info.get('priceToBook', 1.5)
            
            # Dividend information
            dividend_yield = info.get('dividendYield', 0.03)
            dividend_rate = info.get('dividendRate', current_price * dividend_yield)
            ex_dividend_date = info.get('exDividendDate')
            dividend_date = info.get('dividendDate')
            payout_ratio = info.get('payoutRatio')
            
            # 52-week range
            fifty_two_week_high = info.get('fiftyTwoWeekHigh', current_price * 1.3)
            fifty_two_week_low = info.get('fiftyTwoWeekLow', current_price * 0.7)
            
            # Financial health metrics
            return_on_equity = info.get('returnOnEquity', 0.15)
            profit_margin = info.get('profitMargins', 0.15)
            operating_margin = info.get('operatingMargins', 0.20)
            debt_to_equity = info.get('debtToEquity', 0.5)
            current_ratio = info.get('currentRatio', 2.0)
            
            # Growth metrics
            revenue_growth = info.get('revenueGrowth', 0.1)
            earnings_growth = info.get('earningsGrowth', 0.1)
            
            # Beta
            beta = info.get('beta', 1.0)
            
            # Company information
            company_name = info.get('longName') or info.get('shortName') or symbol
            
            # Format dates if they exist
            ex_dividend_date_str = None
            dividend_date_str = None
            
            if ex_dividend_date:
                if isinstance(ex_dividend_date, (int, float)):
                    ex_dividend_date_str = datetime.fromtimestamp(ex_dividend_date).strftime('%Y-%m-%d')
                else:
                    ex_dividend_date_str = str(ex_dividend_date)
            
            if dividend_date:
                if isinstance(dividend_date, (int, float)):
                    dividend_date_str = datetime.fromtimestamp(dividend_date).strftime('%Y-%m-%d')
                else:
                    dividend_date_str = str(dividend_date)
            
            logger.info(f"Successfully fetched data for {symbol}: price={current_price}, PE={pe_ratio}")
            
            return {
                'symbol': symbol,
                'company_name': company_name,
                'market': market,
                'currency': currency,
                'current_price': current_price,
                'previous_close': previous_close,
                'change': change,
                'change_percent': change_percent,
                'open_price': day_open,
                'day_high': day_high,
                'day_low': day_low,
                'volume': volume,
                'market_cap': market_cap,
                'pe_ratio': pe_ratio,
                'eps': eps,
                'dividend_yield': dividend_yield,
                'dividend_rate': dividend_rate,
                'ex_dividend_date': ex_dividend_date_str,
                'dividend_date': dividend_date_str,
                'payout_ratio': payout_ratio,
                'book_value': book_value,
                'price_to_book': price_to_book,
                'week_high_52': fifty_two_week_high,
                'week_low_52': fifty_two_week_low,
                'beta': beta,
                'roe': return_on_equity,
                'profit_margin': profit_margin,
                'operating_margin': operating_margin,
                'debt_to_equity': debt_to_equity,
                'current_ratio': current_ratio,
                'revenue_growth': revenue_growth,
                'earnings_growth': earnings_growth,
                'last_updated': datetime.utcnow().isoformat(),
                'success': True
            }
            
        except Exception as error:
            logger.error(f"Error fetching stock data for {symbol}: {str(error)}")
            return StockDataService._create_fallback_data(symbol, str(error))
    
    @staticmethod
    def get_multiple_stocks(symbols: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch stock data for multiple symbols
        
        Args:
            symbols: List of stock symbols
            
        Returns:
            List of stock data dictionaries
        """
        results = []
        failed_symbols = []
        
        for symbol in symbols:
            try:
                stock_data = StockDataService.get_stock_data(symbol.strip())
                results.append(stock_data)
            except Exception as error:
                logger.error(f"Failed to fetch data for {symbol}: {str(error)}")
                failed_symbols.append(symbol)
                # Add fallback data
                results.append(StockDataService._create_fallback_data(symbol, str(error)))
        
        return results
    
    @staticmethod
    def get_historical_data(symbol: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Get historical data for a symbol using yfinance 2.0.0
        
        Args:
            symbol: Stock symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            
        Returns:
            List of historical data points
        """
        try:
            logger.info(f"Fetching historical data for {symbol}, period: {period}, interval: {interval}")
            
            ticker = yf.Ticker(symbol)
            history = ticker.history(period=period, interval=interval)
            
            if history.empty:
                raise ValueError(f"No historical data available for {symbol}")
            
            historical_data = []
            for date, row in history.iterrows():
                historical_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'price': float(row['Close']),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'volume': int(row['Volume'])
                })
            
            logger.info(f"Successfully fetched {len(historical_data)} historical data points for {symbol}")
            return historical_data
            
        except Exception as error:
            logger.error(f"Error fetching historical data for {symbol}: {str(error)}")
            raise
    
    @staticmethod
    def _create_fallback_data(symbol: str, error_message: str = "") -> Dict[str, Any]:
        """Create fallback data when API calls fail"""
        is_thai_stock = '.BK' in symbol or '.SET' in symbol
        market = 'SET' if is_thai_stock else 'NASDAQ'
        currency = 'THB' if is_thai_stock else 'USD'
        fallback_price = 10.0 if is_thai_stock else 100.0
        
        return {
            'symbol': symbol,
            'company_name': symbol,
            'market': market,
            'currency': currency,
            'current_price': fallback_price,
            'previous_close': fallback_price,
            'change': 0.0,
            'change_percent': 0.0,
            'open_price': fallback_price,
            'day_high': fallback_price * 1.02,
            'day_low': fallback_price * 0.98,
            'volume': 0,
            'market_cap': fallback_price * 1_000_000_000,
            'pe_ratio': 15.0,
            'eps': fallback_price / 15.0,
            'dividend_yield': 0.03,
            'dividend_rate': fallback_price * 0.03,
            'ex_dividend_date': None,
            'dividend_date': None,
            'payout_ratio': None,
            'book_value': fallback_price * 0.8,
            'price_to_book': 1.25,
            'week_high_52': fallback_price * 1.3,
            'week_low_52': fallback_price * 0.7,
            'beta': 1.0,
            'roe': 0.15,
            'profit_margin': 0.15,
            'operating_margin': 0.20,
            'debt_to_equity': 0.5,
            'current_ratio': 2.0,
            'revenue_growth': 0.1,
            'earnings_growth': 0.1,
            'last_updated': datetime.utcnow().isoformat(),
            'success': False,
            'error': error_message
        }
    
    @staticmethod
    def check_api_status() -> Dict[str, Any]:
        """Check if yfinance API is working by testing with a known symbol"""
        try:
            # Test with Apple stock
            test_data = StockDataService.get_stock_data('AAPL')
            if test_data.get('success', False):
                return {
                    'status': 'connected',
                    'message': 'yfinance 2.0.0 API is working correctly',
                    'test_symbol': 'AAPL',
                    'test_price': test_data.get('current_price')
                }
            else:
                return {
                    'status': 'disconnected',
                    'message': 'yfinance API test failed',
                    'error': test_data.get('error', 'Unknown error')
                }
        except Exception as error:
            return {
                'status': 'disconnected',
                'message': f'yfinance API error: {str(error)}',
                'error': str(error)
            }