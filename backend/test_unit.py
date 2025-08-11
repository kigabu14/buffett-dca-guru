"""
Unit tests for yfinance 2.0.0 integration
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from stock_service import StockDataService

class TestStockDataService(unittest.TestCase):
    """Test cases for StockDataService"""
    
    def test_create_fallback_data_us_stock(self):
        """Test fallback data creation for US stocks"""
        result = StockDataService._create_fallback_data('AAPL')
        
        self.assertEqual(result['symbol'], 'AAPL')
        self.assertEqual(result['currency'], 'USD')
        self.assertEqual(result['market'], 'NASDAQ')
        self.assertEqual(result['current_price'], 100.0)
        self.assertFalse(result['success'])
        
    def test_create_fallback_data_thai_stock(self):
        """Test fallback data creation for Thai stocks"""
        result = StockDataService._create_fallback_data('PTT.BK')
        
        self.assertEqual(result['symbol'], 'PTT.BK')
        self.assertEqual(result['currency'], 'THB')
        self.assertEqual(result['market'], 'SET')
        self.assertEqual(result['current_price'], 10.0)
        self.assertFalse(result['success'])
    
    @patch('stock_service.yf.Ticker')
    def test_get_stock_data_success(self, mock_ticker):
        """Test successful stock data retrieval"""
        # Mock yfinance response
        mock_ticker_instance = Mock()
        mock_ticker.return_value = mock_ticker_instance
        
        # Mock info data
        mock_ticker_instance.info = {
            'longName': 'Apple Inc.',
            'currency': 'USD',
            'exchange': 'NASDAQ',
            'marketCap': 3000000000000,
            'forwardPE': 25.5,
            'trailingEps': 6.05,
            'dividendYield': 0.0162,
            'dividendRate': 0.96,
            'bookValue': 4.4,
            'priceToBook': 34.1,
            'returnOnEquity': 1.5,
            'profitMargins': 0.25,
            'operatingMargins': 0.30,
            'debtToEquity': 1.73,
            'currentRatio': 1.05,
            'revenueGrowth': 0.04,
            'earningsGrowth': 0.05,
            'beta': 1.24,
            'fiftyTwoWeekHigh': 199.62,
            'fiftyTwoWeekLow': 164.08
        }
        
        # Mock history data
        mock_history = Mock()
        mock_history.empty = False
        mock_history.__len__ = Mock(return_value=2)
        mock_history.iloc = Mock()
        mock_history.iloc.__getitem__ = Mock(side_effect=[
            # Latest day
            Mock(**{'Close': 150.0, 'Volume': 50000000, 'High': 152.0, 'Low': 148.0, 'Open': 149.0}),
            # Previous day
            Mock(**{'Close': 148.0})
        ])
        mock_ticker_instance.history.return_value = mock_history
        
        # Test the method
        result = StockDataService.get_stock_data('AAPL')
        
        # Assertions
        self.assertTrue(result['success'])
        self.assertEqual(result['symbol'], 'AAPL')
        self.assertEqual(result['company_name'], 'Apple Inc.')
        self.assertEqual(result['current_price'], 150.0)
        self.assertEqual(result['previous_close'], 148.0)
        self.assertEqual(result['change'], 2.0)
        self.assertAlmostEqual(result['change_percent'], 1.35, places=2)
        self.assertEqual(result['currency'], 'USD')
        self.assertEqual(result['market'], 'NASDAQ')
    
    @patch('stock_service.yf.Ticker')
    def test_get_stock_data_empty_history(self, mock_ticker):
        """Test handling of empty history data"""
        mock_ticker_instance = Mock()
        mock_ticker.return_value = mock_ticker_instance
        
        # Mock empty history
        mock_history = Mock()
        mock_history.empty = True
        mock_ticker_instance.history.return_value = mock_history
        mock_ticker_instance.info = {}
        
        result = StockDataService.get_stock_data('INVALID')
        
        # Should return fallback data
        self.assertFalse(result['success'])
        self.assertEqual(result['symbol'], 'INVALID')
    
    def test_get_multiple_stocks(self):
        """Test multiple stocks retrieval"""
        with patch.object(StockDataService, 'get_stock_data') as mock_get_stock:
            # Mock responses
            mock_get_stock.side_effect = [
                {'symbol': 'AAPL', 'success': True, 'current_price': 150.0},
                {'symbol': 'MSFT', 'success': True, 'current_price': 300.0},
                {'symbol': 'INVALID', 'success': False, 'error': 'Not found'}
            ]
            
            result = StockDataService.get_multiple_stocks(['AAPL', 'MSFT', 'INVALID'])
            
            self.assertEqual(len(result), 3)
            self.assertTrue(result[0]['success'])
            self.assertTrue(result[1]['success'])
            self.assertFalse(result[2]['success'])
    
    def test_check_api_status(self):
        """Test API status check"""
        with patch.object(StockDataService, 'get_stock_data') as mock_get_stock:
            # Mock successful response
            mock_get_stock.return_value = {
                'success': True,
                'current_price': 150.0
            }
            
            result = StockDataService.check_api_status()
            
            self.assertEqual(result['status'], 'connected')
            self.assertIn('yfinance 2.0.0', result['message'])
            self.assertEqual(result['test_symbol'], 'AAPL')
            self.assertEqual(result['test_price'], 150.0)

if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)