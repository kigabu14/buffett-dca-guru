import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface StockInvestment {
  symbol: string;
  quantity: number;
  buy_price: number;
  current_price: number | null;
  market: string;
}

interface PortfolioPieChartProps {
  investments: StockInvestment[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
  '#ff8042',
  '#8dd1e1',
];

export const PortfolioPieChart = ({ investments }: PortfolioPieChartProps) => {
  // Calculate portfolio data for pie chart
  const portfolioData = investments.map((investment, index) => {
    const currentPrice = investment.current_price || investment.buy_price;
    const value = investment.quantity * currentPrice;
    
    return {
      name: investment.symbol,
      value: value,
      percentage: 0, // Will be calculated after all values are known
      market: investment.market,
      color: COLORS[index % COLORS.length]
    };
  });

  // Calculate total value and percentages
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
  portfolioData.forEach(item => {
    item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
  });

  // Sort by value and take top holdings
  const sortedData = portfolioData.sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.market}</p>
          <p className="text-sm">
            มูลค่า: ฿{data.value.toLocaleString()}
          </p>
          <p className="text-sm text-primary">
            สัดส่วน: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            การกระจายพอร์ต
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            ไม่มีข้อมูลหุ้นในพอร์ต
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          การกระจายพอร์ต
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          สัดส่วนการลงทุนแต่ละหุ้น
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedData.slice(0, 8).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div 
                className="w-4 h-4 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-auto">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
          {sortedData.length > 8 && (
            <div className="text-xs text-muted-foreground col-span-2 text-center mt-2">
              และอีก {sortedData.length - 8} หุ้น
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};