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
  const gainLoss = buyPrice ? (currentPrice - buyPrice) : 0;
  const gainLossPercent = buyPrice && buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {stockData.currency === 'THB' ? '฿' : '$'}{stockData.price.toFixed(2)}
          </span>
          {stockData.isSampleData && (
            <Badge variant="secondary" className="text-xs">
              ตัวอย่าง
            </Badge>
          )}
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
        <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}</span>
          <span>({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
        </div>
        
        {buyPrice && buyPrice > 0 && (
          <div className={`flex items-center gap-1 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-xs text-muted-foreground">กำไร/ขาดทุน:</span>
            <span>
              {gainLoss >= 0 ? '+' : ''}{stockData.currency === 'THB' ? '฿' : '$'}{gainLoss.toFixed(2)}
            </span>
            <span>({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)</span>
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