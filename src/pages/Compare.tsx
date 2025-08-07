import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockSelector } from "@/components/StockSelector";
import { YahooFinanceService, StockData } from "@/services/YahooFinanceService";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

const Compare = () => {
  const { toast } = useToast();
  const [selectedStocks, setSelectedStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);

  const addStock = async (stockData: StockData) => {
    if (selectedStocks.find(s => s.symbol === stockData.symbol)) {
      toast({
        title: "หุ้นนี้มีอยู่แล้ว",
        description: "กรุณาเลือกหุ้นอื่น",
        variant: "destructive"
      });
      return;
    }

    if (selectedStocks.length >= 5) {
      toast({
        title: "เปรียบเทียบได้สูงสุด 5 หุ้น",
        description: "กรุณาลบหุ้นบางตัวก่อน",
        variant: "destructive"
      });
      return;
    }

    setSelectedStocks(prev => [...prev, stockData]);
  };

  const removeStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const metrics = [
    { key: 'price', label: 'ราคาปัจจุบัน', format: 'currency' },
    { key: 'change', label: 'เปลี่ยนแปลง', format: 'change' },
    { key: 'changePercent', label: '% เปลี่ยนแปลง', format: 'percent' },
    { key: 'marketCap', label: 'มูลค่าตลาด', format: 'number' },
    { key: 'pe', label: 'P/E Ratio', format: 'decimal' },
    { key: 'eps', label: 'EPS', format: 'decimal' },
    { key: 'dividendYield', label: 'Dividend Yield', format: 'percent' },
    { key: 'weekHigh52', label: '52W High', format: 'currency' },
    { key: 'weekLow52', label: '52W Low', format: 'currency' },
    { key: 'volume', label: 'Volume', format: 'number' }
  ];

  const formatValue = (value: any, format: string, currency: string = 'USD') => {
    if (value === null || value === undefined) return '-';
    
    // Don't treat 0 as invalid for certain metrics
    const allowZero = ['change', 'changePercent'].includes(format);
    if (!allowZero && value === 0) return '-';
    
    switch (format) {
      case 'currency':
        return YahooFinanceService.formatCurrency(value, currency);
      case 'change':
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
      case 'percent':
        // Handle percentage values that might already be in decimal form
        const percentValue = value > 1 ? value : value * 100;
        return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
      case 'number':
        return YahooFinanceService.formatLargeNumber(value);
      case 'decimal':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getBestValue = (metric: string) => {
    if (selectedStocks.length === 0) return null;
    
    const values = selectedStocks.map(s => s[metric as keyof StockData] as number)
      .filter(v => v != null && v !== undefined && !isNaN(v));
    if (values.length === 0) return null;
    
    // For most metrics, higher is better, but for P/E ratio, lower might be better
    if (metric === 'pe') {
      return Math.min(...values);
    }
    return Math.max(...values);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
          เปรียบเทียบหุ้น
        </h1>
        <p className="text-muted-foreground">
          เปรียบเทียบข้อมูลทางการเงินของหุ้นต่างๆ
        </p>
      </div>

      {/* Stock Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            เลือกหุ้นเพื่อเปรียบเทียบ
          </CardTitle>
          <CardDescription>
            เลือกได้สูงสุด 5 หุ้น
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockSelector
            value=""
            onValueChange={() => {}}
            onStockSelect={addStock}
            placeholder="ค้นหาหุ้น (เช่น AAPL, BBL.BK)"
          />
        </CardContent>
      </Card>

      {/* Selected Stocks */}
      {selectedStocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>หุ้นที่เลือก</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map((stock) => (
                <Badge
                  key={stock.symbol}
                  variant="secondary"
                  className="flex items-center gap-2 py-2 px-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stock.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {YahooFinanceService.formatCurrency(stock.price, stock.currency)}
                    </span>
                    {stock.isSampleData && (
                      <span className="text-xs text-yellow-600">(ตัวอย่าง)</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeStock(stock.symbol)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {selectedStocks.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ตารางเปรียบเทียบ
            </CardTitle>
            <CardDescription>
              เปรียบเทียบข้อมูลทางการเงินแบบละเอียด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">ข้อมูล</TableHead>
                    {selectedStocks.map((stock) => (
                      <TableHead key={stock.symbol} className="text-center min-w-[120px]">
                        <div className="space-y-1">
                          <div className="font-semibold">{stock.symbol}</div>
                          <Badge variant="outline" className="text-xs">
                            {stock.market}
                          </Badge>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => {
                    const bestValue = getBestValue(metric.key);
                    
                    return (
                      <TableRow key={metric.key}>
                        <TableCell className="font-medium">{metric.label}</TableCell>
                        {selectedStocks.map((stock) => {
                          const value = stock[metric.key as keyof StockData] as number;
                          const isBest = value === bestValue && value != null && value !== undefined && !isNaN(value);
                          const colorClass = ['change', 'changePercent'].includes(metric.key) 
                            ? getChangeColor(value) 
                            : '';
                          
                          return (
                            <TableCell 
                              key={stock.symbol} 
                              className={`text-center ${colorClass} ${isBest ? 'font-bold bg-green-50' : ''}`}
                            >
                              {formatValue(value, metric.format, stock.currency)}
                              {isBest && value != null && value !== undefined && !isNaN(value) && (
                                <TrendingUp className="inline h-3 w-3 ml-1 text-green-600" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DCA Score Comparison */}
      {selectedStocks.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>คะแนน DCA (Warren Buffett Style)</CardTitle>
            <CardDescription>
              การประเมินคุณภาพหุ้นตามหลักการลงทุนของ Warren Buffett
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedStocks.map((stock) => {
                const dcaScore = YahooFinanceService.calculateDCAScore(stock);
                const recommendation = YahooFinanceService.getDCARecommendation(dcaScore);
                
                return (
                  <Card key={stock.symbol} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{stock.symbol}</h4>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <Badge variant="outline">{stock.market}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">คะแนน DCA:</span>
                        <Badge className={
                          dcaScore >= 7 ? 'bg-green-100 text-green-800' :
                          dcaScore >= 5 ? 'bg-blue-100 text-blue-800' :
                          dcaScore >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {dcaScore}/8
                        </Badge>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(dcaScore / 8) * 100}%` }}
                        />
                      </div>
                      
                      <div className="text-sm">
                        <span className={recommendation.color}>
                          {recommendation.message}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {stock.roe && <div>ROE: {(stock.roe * 100).toFixed(2)}%</div>}
                        {stock.debtToEquity && <div>D/E: {stock.debtToEquity.toFixed(2)}</div>}
                        {stock.profitMargin && <div>Profit Margin: {(stock.profitMargin * 100).toFixed(2)}%</div>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedStocks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">เริ่มเปรียบเทียบหุ้น</h3>
            <p className="text-muted-foreground mb-4">
              เลือกหุ้นอย่างน้อย 2 ตัวเพื่อเริ่มการเปรียบเทียบ
            </p>
          </CardContent>
        </Card>
      )}

      {selectedStocks.length === 1 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              เลือกหุ้นอีกอย่างน้อย 1 ตัวเพื่อเริ่มการเปรียบเทียบ
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Compare;