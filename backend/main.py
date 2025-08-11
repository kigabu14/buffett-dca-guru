"""
FastAPI application for yfinance 2.0.0 stock data service
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from .stock_service import StockDataService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Data API",
    description="Stock data service using yfinance 2.0.0 for Warren Buffett DCA analysis",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class StockRequest(BaseModel):
    symbols: List[str]
    historical: Optional[bool] = False
    period: Optional[str] = "1mo"
    interval: Optional[str] = "1d"

class SingleStockRequest(BaseModel):
    symbol: str

# Response models
class StockResponse(BaseModel):
    success: bool
    data: List[dict]
    total_requested: int
    total_successful: int
    total_failed: int
    failed_symbols: List[str]
    timestamp: str

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Stock Data API powered by yfinance 2.0.0",
        "version": "1.0.0",
        "endpoints": {
            "/stock-data": "POST - Get stock data for multiple symbols",
            "/stock/{symbol}": "GET - Get stock data for single symbol",
            "/historical/{symbol}": "GET - Get historical data for symbol",
            "/health": "GET - API health check",
            "/status": "GET - yfinance API status"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "yfinance-stock-data"}

@app.get("/status")
async def api_status():
    """Check yfinance API status"""
    try:
        status = StockDataService.check_api_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"API status check failed: {str(e)}")

@app.post("/stock-data")
async def get_stock_data(request: StockRequest):
    """
    Get stock data for multiple symbols
    Compatible with existing Supabase Edge Function interface
    """
    try:
        if not request.symbols:
            raise HTTPException(status_code=400, detail="Symbols array is required")
        
        logger.info(f"Processing request for {len(request.symbols)} symbols")
        
        if request.historical:
            # Handle historical data request
            if len(request.symbols) > 1:
                raise HTTPException(status_code=400, detail="Historical data only supports single symbol")
            
            symbol = request.symbols[0]
            historical_data = StockDataService.get_historical_data(
                symbol, 
                request.period, 
                request.interval
            )
            
            return {
                "success": True,
                "historical": historical_data,
                "symbol": symbol,
                "period": request.period,
                "interval": request.interval,
                "timestamp": StockDataService._create_fallback_data("dummy")["last_updated"]
            }
        else:
            # Handle regular stock data request
            stock_data = StockDataService.get_multiple_stocks(request.symbols)
            
            successful_data = [data for data in stock_data if data.get('success', False)]
            failed_symbols = [data['symbol'] for data in stock_data if not data.get('success', False)]
            
            return {
                "success": len(successful_data) > 0,
                "data": stock_data,
                "total_requested": len(request.symbols),
                "total_successful": len(successful_data),
                "total_failed": len(failed_symbols),
                "failed_symbols": failed_symbols,
                "timestamp": StockDataService._create_fallback_data("dummy")["last_updated"]
            }
            
    except Exception as e:
        logger.error(f"Error processing stock data request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/stock/{symbol}")
async def get_single_stock(symbol: str):
    """Get stock data for a single symbol"""
    try:
        stock_data = StockDataService.get_stock_data(symbol)
        return stock_data
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@app.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str, 
    period: str = "1mo", 
    interval: str = "1d"
):
    """Get historical data for a symbol"""
    try:
        historical_data = StockDataService.get_historical_data(symbol, period, interval)
        return {
            "success": True,
            "historical": historical_data,
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "total_points": len(historical_data)
        }
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)