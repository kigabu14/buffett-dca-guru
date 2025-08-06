
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { StockSelector } from "@/components/StockSelector";
import { StockData, YahooFinanceService } from "@/services/YahooFinanceService";

interface DCASimulatorProps {
  symbol?: string;
  currentPrice?: number;
  dividendYield?: number;
}

interface DCAResults {
  totalInvested: number;
  totalShares: number;
  averagePrice: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalDividends: number;
  totalReturnWithDividends: number;
}

export const DCASimulator = ({ symbol, currentPrice, dividendYield }: DCASimulatorProps) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [amount, setAmount] = useState("1000");
  const [frequency, setFrequency] = useState("monthly");
  const [duration, setDuration] = useState("12");
  const [results, setResults] = useState<DCAResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStockSelect = (stock: StockData) => {
    setSelectedStock(stock);
    setResults(null); // Clear previous results
  };

  const calculateDCA = async () => {
    const stockToUse = selectedStock || (symbol && currentPrice ? {
      symbol,
      price: currentPrice,
      dividendYield: dividendYield || 0,
      currency: symbol.includes('.BK') ? 'THB' : 'USD'
    } as StockData : null);

    if (!stockToUse || !amount || !duration) return;

    setLoading(true);
    
    try {
      const investmentAmount = parseFloat(amount);
      const months = parseInt(duration);
      const periodsPerYear = frequency === 'weekly' ? 52 : frequency === 'monthly' ? 12 : 365;
      const totalPeriods = frequency === 'weekly' ? Math.floor(months * 4.33) : 
                          frequency === 'monthly' ? months : months * 30;

      // Get historical data for more accurate simulation
      let historicalPrices: number[] = [];
      try {
        const historicalData = await YahooFinanceService.getHistoricalData(stockToUse.symbol, '1y');
        if (historicalData && historicalData.length > 0) {
          // Use actual historical prices for the simulation
          historicalPrices = historicalData.map(d => d.price).slice(-totalPeriods);
        }
      } catch (error) {
        console.warn('Could not fetch historical data, using simulated prices:', error);
      }

      let totalShares = 0;
      let totalInvested = 0;
      let totalDividends = 0;
      
      for (let i = 0; i < totalPeriods; i++) {
        let price: number;
        
        if (historicalPrices.length > i) {
          // Use actual historical price
          price = historicalPrices[i];
        } else {
          // Fallback to simulation with realistic volatility
          const volatility = 0.015; // 1.5% volatility per period (more realistic)
          const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
          const trendFactor = 1 + (Math.random() * 0.001); // very small random trend
          price = stockToUse.price * randomFactor * trendFactor;
        }
        
        const shares = investmentAmount / price;
        totalShares += shares;
        totalInvested += investmentAmount;
        
        // Calculate dividends (quarterly payments) - more accurate calculation
        if (stockToUse.dividendYield && stockToUse.dividendYield > 0 && i > 0 && i % Math.floor(periodsPerYear / 4) === 0) {
          const quarterlyDividendRate = (stockToUse.dividendYield / 100) / 4; // Convert percentage to decimal
          const currentSharesForDividend = totalShares; // Total shares at this point
          totalDividends += currentSharesForDividend * price * quarterlyDividendRate;
        }
      }

      const averagePrice = totalInvested / totalShares;
      const currentValue = totalShares * stockToUse.price;
      const totalReturn = currentValue - totalInvested;
      const totalReturnPercent = (totalReturn / totalInvested) * 100;
      const totalReturnWithDividends = totalReturn + totalDividends;

      setResults({
        totalInvested,
        totalShares,
        averagePrice,
        currentValue,
        totalReturn,
        totalReturnPercent,
        totalDividends,
        totalReturnWithDividends
      });
    } catch (error) {
      console.error('Error calculating DCA:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    const currency = selectedStock?.currency || (symbol?.includes('.BK') ? 'THB' : 'USD');
    return YahooFinanceService.formatCurrency(value, currency);
  };

  const getFrequencyText = () => {
    switch (frequency) {
      case 'weekly': return 'รายสัปดาห์';
      case 'monthly': return 'รายเดือน';
      case 'daily': return 'รายวัน';
      default: return 'รายเดือน';
    }
  };

  const stockToDisplay = selectedStock || (symbol && currentPrice ? {
    symbol,
    name: symbol,
    price: currentPrice,
    dividendYield: dividendYield || 0,
    currency: symbol.includes('.BK') ? 'THB' : 'USD'
  } as StockData : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          จำลอง DCA (Dollar Cost Averaging)
        </CardTitle>
        <CardDescription>
          คำนวณผลตอบแทนจากการลงทุนแบบ DCA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock Selection */}
        {!symbol && (
          <div className="space-y-2">
            <Label>เลือกหุ้น</Label>
            <StockSelector
              value={selectedStock?.symbol || ""}
              onValueChange={() => {}}
              onStockSelect={handleStockSelect}
              placeholder="ค้นหาและเลือกหุ้นเพื่อจำลอง DCA..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงินต่อครั้ง (บาท)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">ความถี่</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">รายวัน</SelectItem>
                <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                <SelectItem value="monthly">รายเดือน</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">ระยะเวลา (เดือน)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12"
            />
          </div>
        </div>

        {stockToDisplay && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">ข้อมูลหุ้น</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{stockToDisplay.symbol}</span>
                <Badge variant="outline">
                  {stockToDisplay.symbol.includes('.BK') ? 'SET' : 'US'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ราคาปัจจุบัน:</span>
                <span className="font-semibold">{formatCurrency(stockToDisplay.price)}</span>
              </div>
              {stockToDisplay.dividendYield > 0 && (
                <div className="flex items-center justify-between">
                  <span>อัตราปันผล:</span>
                  <span className="font-semibold">{(stockToDisplay.dividendYield * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={calculateDCA} 
          disabled={loading || !stockToDisplay}
          className="w-full"
        >
          {loading ? 'กำลังคำนวณ...' : 'คำนวณ DCA'}
        </Button>

        {results && stockToDisplay && (
          <div className="space-y-4">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ข้อมูลการลงทุน
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>จำนวนเงินลงทุนรวม:</span>
                    <span className="font-medium">{formatCurrency(results.totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวนหุ้นที่ได้:</span>
                    <span className="font-medium">{results.totalShares.toFixed(4)} หุ้น</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ราคาซื้อเฉลี่ย:</span>
                    <span className="font-medium">{formatCurrency(results.averagePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ความถี่การลงทุน:</span>
                    <span className="font-medium">{getFrequencyText()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  ผลตอบแทน
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>มูลค่าปัจจุบัน:</span>
                    <span className="font-medium">{formatCurrency(results.currentValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>กำไร/ขาดทุน:</span>
                    <span className={`font-medium ${results.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.totalReturn >= 0 ? '+' : ''}{formatCurrency(results.totalReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>% ผลตอบแทน:</span>
                    <span className={`font-medium ${results.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.totalReturnPercent >= 0 ? '+' : ''}{results.totalReturnPercent.toFixed(2)}%
                    </span>
                  </div>
                  {results.totalDividends > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>เงินปันผลรวม:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(results.totalDividends)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">ผลตอบแทนรวม:</span>
                        <span className={`font-semibold ${results.totalReturnWithDividends >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {results.totalReturnWithDividends >= 0 ? '+' : ''}{formatCurrency(results.totalReturnWithDividends)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">สรุปการลงทุน DCA:</p>
                <p>
                  หากคุณลงทุน {formatCurrency(parseFloat(amount))} {getFrequencyText()} 
                  เป็นเวลา {duration} เดือน ในหุ้น {stockToDisplay.symbol} คุณจะได้:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>หุ้นทั้งหมด: {results.totalShares.toFixed(4)} หุ้น</li>
                  <li>ราคาเฉลี่ย: {formatCurrency(results.averagePrice)} ต่อหุ้น</li>
                  <li>ผลตอบแทน: {results.totalReturnPercent >= 0 ? '+' : ''}{results.totalReturnPercent.toFixed(2)}%</li>
                  {results.totalDividends > 0 && (
                    <li>เงินปันผล: {formatCurrency(results.totalDividends)}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
