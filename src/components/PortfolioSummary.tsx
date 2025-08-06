
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioSummaryProps {
  totalPortfolioValue: number;
  investmentsCount: number;
  totalGainLoss: number;
  totalCostBasis: number;
  totalDividends: number;
}

export const PortfolioSummary = ({ 
  totalPortfolioValue, 
  investmentsCount, 
  totalGainLoss, 
  totalCostBasis,
  totalDividends 
}: PortfolioSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">มูลค่าพอร์ตรวม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ฿{totalPortfolioValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            จาก {investmentsCount} หุ้น
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">กำไร/ขาดทุนรวม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalGainLoss >= 0 ? '+' : ''}฿{totalGainLoss.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalCostBasis > 0 ? 
              `${totalGainLoss >= 0 ? '+' : ''}${((totalGainLoss / totalCostBasis) * 100).toFixed(2)}%` : 
              '0%'
            }
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">เงินปันผลรวม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ฿{totalDividends.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            รายได้จากเงินปันผล
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
