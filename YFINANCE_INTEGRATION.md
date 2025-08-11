# yfinance 2.0.0 Integration

This document describes the integration of yfinance 2.0.0 into the Buffett DCA Guru application.

## Architecture

The application now uses a hybrid architecture for stock data fetching:

1. **Frontend**: React/TypeScript application (unchanged)
2. **Edge Function**: Supabase Edge Function (Deno/TypeScript) - modified to call Python backend
3. **Python Backend**: FastAPI service using yfinance 2.0.0 (new)

## Components

### Python Backend (`backend/`)

- **`stock_service.py`**: Core service using yfinance 2.0.0 for data fetching
- **`main.py`**: FastAPI application with REST endpoints
- **`test_service.py`**: Test script for validation

### Updated Edge Function

- **`supabase/functions/stock-data/index.ts`**: Modified to call Python backend instead of direct Yahoo Finance API

## API Endpoints

### Python Backend (Port 8000)

- `GET /` - API information
- `GET /health` - Health check
- `GET /status` - yfinance API status
- `POST /stock-data` - Get stock data for multiple symbols
- `GET /stock/{symbol}` - Get stock data for single symbol
- `GET /historical/{symbol}` - Get historical data

### Example Request/Response

```json
POST /stock-data
{
  "symbols": ["AAPL", "MSFT", "PTT.BK"],
  "historical": false
}

Response:
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "company_name": "Apple Inc.",
      "current_price": 150.00,
      "pe_ratio": 25.5,
      "dividend_yield": 0.0162,
      // ... all yfinance 2.0.0 metrics
    }
  ],
  "total_requested": 3,
  "total_successful": 3,
  "failed_symbols": []
}
```

## Deployment

### Using Docker

```bash
# Build and run Python backend
docker-compose up -d

# The backend will be available at http://localhost:8000
```

### Environment Variables

- `PYTHON_BACKEND_URL`: URL of the Python backend (default: http://localhost:8000)
- `PORT`: Port for Python backend (default: 8000)

## Features

### Enhanced Data with yfinance 2.0.0

The integration now provides comprehensive financial data:

- **Basic Data**: Price, volume, market cap, P/E ratio
- **Financial Health**: ROE, debt-to-equity, profit margins
- **Dividend Info**: Yield, rate, ex-dividend dates
- **Growth Metrics**: Revenue growth, earnings growth
- **Risk Metrics**: Beta, 52-week ranges
- **Value Metrics**: Book value, price-to-book ratio

### Warren Buffett Analysis

The enhanced data supports improved Warren Buffett investment analysis:

- More accurate financial health ratios
- Better dividend analysis
- Enhanced growth metrics
- Improved risk assessment

## Testing

### Backend Testing

```bash
cd backend
python test_service.py
```

### Integration Testing

The Edge Function automatically falls back to individual requests if the Python backend is unavailable, ensuring reliability.

## Migration Notes

- Frontend code remains unchanged
- Database schema supports all new fields
- Backward compatibility maintained
- Enhanced error handling and fallbacks

## Troubleshooting

### Common Issues

1. **Python Backend Not Available**: Edge Function falls back to individual requests
2. **Network Timeouts**: Automatic retry logic implemented
3. **Data Format Issues**: Comprehensive data validation and fallbacks

### Monitoring

- Check `/health` endpoint for backend status
- Check `/status` endpoint for yfinance API status
- Monitor Edge Function logs in Supabase dashboard