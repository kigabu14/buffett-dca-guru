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

  // Handle null values properly - จัดการค่า null อย่างถูกต้อง
  const change = stockData.change;
  const changePercent = stockData.changePercent;
  const currentPrice = stockData.price;
  
  // Calculate gain/loss only if current price and buy price are available
  // คำนวณกำไร/ขาดทุนเฉพาะเมื่อมีราคาปัจจุบันและราคาซื้อ
  const gainLoss = (buyPrice && currentPrice != null) ? (currentPrice - buyPrice) : null;
  const gainLossPercent = (buyPrice && buyPrice > 0 && currentPrice != null) ? 
    ((currentPrice - buyPrice) / buyPrice) * 100 : null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {/* Display currency symbol based on stockData.currency, show '-' for null price */}
            {/* แสดงสัญลักษณ์สกุลเงินตาม stockData.currency แสดง '-' สำหรับราคา null */}
            {YahooFinanceService.formatDisplayPrice(currentPrice, stockData.currency)}
          </span>
          {/* Remove isSampleData badge as per requirements */}
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
        <div className={`flex items-center gap-1 ${
          change != null && change >= 0 ? 'text-green-600' : 
          change != null && change < 0 ? 'text-red-600' : 'text-muted-foreground'
        }`}>
          {/* Show '-' for null change/changePercent */}
          {/* แสดง '-' สำหรับ change/changePercent ที่เป็น null */}
          <span>
            {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}` : '-'}
          </span>
          <span>
            ({changePercent != null ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : '-'})
          </span>
        </div>
        
        {buyPrice && buyPrice > 0 && (
          <div className={`flex items-center gap-1 ${
            gainLoss != null && gainLoss >= 0 ? 'text-green-600' : 
            gainLoss != null && gainLoss < 0 ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            <span className="text-xs text-muted-foreground">กำไร/ขาดทุน:</span>
            <span>
              {gainLoss != null ? 
                `${gainLoss >= 0 ? '+' : ''}${YahooFinanceService.formatCurrency ? YahooFinanceService.formatCurrency(Math.abs(gainLoss), stockData.currency) : YahooFinanceService.formatDisplayPrice(Math.abs(gainLoss), stockData.currency)}` : 
                '-'
              }
            </span>
            <span>
              ({gainLossPercent != null ? `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%` : '-'})
            </span>
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