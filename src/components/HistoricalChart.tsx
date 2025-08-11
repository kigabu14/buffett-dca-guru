import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { YahooFinanceService } from '@/services/YahooFinanceService';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HistoricalChartProps {
  symbol: string;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({ symbol, className }) => {
  const { toast } = useToast();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('1mo');
  const [interval, setInterval] = useState('1d');
  const [hasError, setHasError] = useState(false); // Track error state for empty state display

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const historicalData = await YahooFinanceService.getHistoricalData(symbol, period, interval);
      
      const chartData = historicalData.map(point => ({
        date: new Date(point.date).toLocaleDateString('th-TH'),
        price: point.price,
        volume: point.volume
      }));
      
      setData(chartData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      
      // Remove synthetic data generation - show empty state instead
      // เอาการสร้างข้อมูลปลอมออก - แสดงสถานะว่างแทน
      setData([]);
      setHasError(true);
      
      toast({
        title: "ไม่สามารถโหลดข้อมูลได้",
        description: "ไม่สามารถดึงข้อมูลประวัติศาสตร์ราคาได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove generateSampleData function completely as per requirements
  // เอาฟังก์ชัน generateSampleData ออกไปตามข้อกำหนด

  useEffect(() => {
    if (symbol) {
      fetchHistoricalData();
    }
  }, [symbol, period, interval]);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') {
      return [value.toFixed(2), 'ราคา'];
    }
    if (name === 'volume') {
      return [value.toLocaleString(), 'ปริมาณ'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    return tickItem;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              กราฟราคาย้อนหลัง - {symbol}
            </CardTitle>
            <CardDescription>
              แนวโน้มราคาและปริมาณการซื้อขาย
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistoricalData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 วัน</SelectItem>
              <SelectItem value="5d">5 วัน</SelectItem>
              <SelectItem value="1mo">1 เดือน</SelectItem>
              <SelectItem value="3mo">3 เดือน</SelectItem>
              <SelectItem value="6mo">6 เดือน</SelectItem>
              <SelectItem value="1y">1 ปี</SelectItem>
              <SelectItem value="2y">2 ปี</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 นาที</SelectItem>
              <SelectItem value="5m">5 นาที</SelectItem>
              <SelectItem value="15m">15 นาที</SelectItem>
              <SelectItem value="30m">30 นาที</SelectItem>
              <SelectItem value="1h">1 ชั่วโมง</SelectItem>
              <SelectItem value="1d">1 วัน</SelectItem>
              <SelectItem value="1wk">1 สัปดาห์</SelectItem>
              <SelectItem value="1mo">1 เดือน</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          // Empty state when no data available - สถานะว่างเมื่อไม่มีข้อมูล
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">ไม่มีข้อมูล</h3>
              <p className="text-muted-foreground mb-4">
                ไม่สามารถดึงข้อมูลประวัติศาสตร์ราคาสำหรับ {symbol} ได้
              </p>
              <Button
                variant="outline"
                onClick={fetchHistoricalData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisLabel}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#000' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ราคาเริ่มต้น: </span>
              <span className="font-medium">฿{data[0]?.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ราคาปัจจุบัน: </span>
              <span className="font-medium">฿{data[data.length - 1]?.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">สูงสุด: </span>
              <span className="font-medium text-green-600">
                ฿{Math.max(...data.map(d => d.price)).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">ต่ำสุด: </span>
              <span className="font-medium text-red-600">
                ฿{Math.min(...data.map(d => d.price)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};