import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { YahooFinanceService } from "@/services/YahooFinanceService";
import { Loader2, TrendingUp } from "lucide-react";

interface HistoricalChartProps {
  symbol: string;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export const HistoricalChart = ({ symbol, className = "" }: HistoricalChartProps) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("1mo");
  const [interval, setInterval] = useState("1d");

  const periods = [
    { value: "1mo", label: "1 เดือน" },
    { value: "3mo", label: "3 เดือน" },
    { value: "6mo", label: "6 เดือน" },
    { value: "1y", label: "1 ปี" },
    { value: "2y", label: "2 ปี" },
    { value: "5y", label: "5 ปี" }
  ];

  const intervals = [
    { value: "1d", label: "รายวัน" },
    { value: "1wk", label: "รายสัปดาห์" },
    { value: "1mo", label: "รายเดือน" }
  ];

  const fetchHistoricalData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    try {
      const historicalData = await YahooFinanceService.getHistoricalData(symbol, period, interval);
      setData(historicalData);
    } catch (error) {
      console.error("Error fetching historical data:", error);
      // Generate sample data for demo
      const sampleData = generateSampleData(symbol, period);
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (symbol: string, period: string): ChartDataPoint[] => {
    const now = new Date();
    const basePrice = symbol.includes('.BK') ? 50 : 150;
    const points = period === '1mo' ? 30 : period === '3mo' ? 90 : period === '6mo' ? 180 : 365;
    
    return Array.from({ length: points }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (points - i));
      
      const variation = (Math.random() - 0.5) * 0.1;
      const trendFactor = i / points * 0.2;
      const price = basePrice * (1 + trendFactor + variation);
      
      return {
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 100000
      };
    });
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol, period, interval]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') {
      return [YahooFinanceService.formatCurrency(value), 'ราคา'];
    }
    if (name === 'volume') {
      return [YahooFinanceService.formatLargeNumber(value), 'ปริมาณ'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              กราฟราคาประวัติศาสตร์
            </CardTitle>
            <CardDescription>
              กราฟแสดงการเปลี่ยนแปลงราคาของ {symbol}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => YahooFinanceService.formatCurrency(value)}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `วันที่: ${new Date(label).toLocaleDateString('th-TH')}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchHistoricalData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            รีเฟรชข้อมูล
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};