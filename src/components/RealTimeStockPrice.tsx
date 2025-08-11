import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { YahooFinanceService, StockData } from "@/services/YahooFinanceService";

interface RealTimeStockPriceProps {
  symbol: string;
  buyPrice?: number;
  className?: string;
}

export const RealTimeStockPrice = ({ symbol, buyPrice, className = "" }: RealTimeStockPriceProps) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const data = await YahooFinanceService.getStock(symbol);
      setStockData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, [symbol]);

  if (!stockData) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-sm text-muted-foreground">โหลดราคา...</div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchPrice}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  const change = stockData.change;
  const changePercent = stockData.changePercent;
  
  // Fixed gain/loss calculation
  const currentPrice = stockData.price;
  const gainLoss = buyPrice && currentPrice !== null ? (currentPrice - buyPrice) : 0;
  const gainLossPercent = buyPrice && buyPrice > 0 && currentPrice !== null ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {YahooFinanceService.formatDisplayPrice(stockData.price, stockData.currency)}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchPrice}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-1 ${change !== null && change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change !== null ? (
            <>
              <span>{change >= 0 ? '+' : ''}{YahooFinanceService.formatNumber(change)}</span>
              {changePercent !== null && (
                <span>({changePercent >= 0 ? '+' : ''}{YahooFinanceService.formatNumber(changePercent)}%)</span>
              )}
            </>
          ) : (
            <span>-</span>
          )}
        </div>
        
        {buyPrice && buyPrice > 0 && currentPrice !== null && (
          <div className={`flex items-center gap-1 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-xs text-muted-foreground">กำไร/ขาดทุน:</span>
            <span>
              {gainLoss >= 0 ? '+' : ''}{YahooFinanceService.formatDisplayPrice(gainLoss, stockData.currency)}
            </span>
            <span>({gainLossPercent >= 0 ? '+' : ''}{YahooFinanceService.formatNumber(gainLossPercent)}%)</span>
          </div>
        )}
      </div>
      
      {lastUpdate && (
        <div className="text-xs text-muted-foreground">
          อัพเดท: {lastUpdate.toLocaleTimeString('th-TH')}
        </div>
      )}
    </div>
  );
};