
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";
import { StockData, YahooFinanceService } from "@/services/YahooFinanceService";

interface DividendInfoProps {
  stock: StockData;
}

export const DividendInfo = ({ stock }: DividendInfoProps) => {
  const formatDividendYield = (yieldValue: number | null) => {
    if (yieldValue == null || yieldValue <= 0) return '-';
    return `${(yieldValue * 100).toFixed(2)}%`;
  };

  const formatDividendRate = (rate: number | null, currency?: string) => {
    if (rate == null || rate <= 0) return '-';
    return YahooFinanceService.formatCurrency(rate, currency);
  };

  const formatPriceRange = (low: number | null, high: number | null, currency?: string) => {
    if (low == null || high == null || low <= 0 || high <= 0) return '-';
    return `${YahooFinanceService.formatCurrency(low, currency)} - ${YahooFinanceService.formatCurrency(high, currency)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          ข้อมูลเงินปันผลและราคา
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Forward Dividend & Yield */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Forward Dividend & Yield</div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-lg">
              {stock.forwardDividendYield > 0 ? 
                `${formatDividendRate(stock.dividendRate, stock.currency)} (${formatDividendYield(stock.forwardDividendYield)})` : 
                formatDividendRate(stock.dividendRate, stock.currency) + ' (' + formatDividendYield(stock.dividendYield) + ')'
              }
            </span>
          </div>
        </div>

        {/* Date Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Ex-Dividend Date</div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-600" />
              <span className="font-medium">
                {stock.exDividendDate ? 
                  YahooFinanceService.formatDate(stock.exDividendDate) : 
                  'ไม่มีข้อมูล'
                }
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Earnings Date</div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {stock.earningsDate ? 
                  YahooFinanceService.formatDate(stock.earningsDate) : 
                  'ไม่มีข้อมูล'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Price Ranges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">52 Week Range</div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="font-medium">
                {formatPriceRange(stock.weekLow52, stock.weekHigh52, stock.currency)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Day's Range</div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">
                {formatPriceRange(stock.dayLow, stock.dayHigh, stock.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Information */}
        {stock.dividendYield != null && stock.dividendYield > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm">
              <div className="font-semibold text-green-800 mb-1">สถานะเงินปันผล</div>
              <div className="text-green-700">
                {stock.dividendYield > 0.04 ? 
                  '🎯 อัตราปันผลสูง - เหมาะสำหรับผู้ลงทุนที่ต้องการรายได้' :
                  stock.dividendYield > 0.02 ?
                  '✅ อัตราปันผลปานกลาง - เหมาะสำหรับการลงทุนระยะยาว' :
                  '📊 อัตราปันผลต่ำ - เน้นการเติบโตของราคา'
                }
              </div>
            </div>
          </div>
        )}

        {(stock.dividendYield == null || stock.dividendYield <= 0) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="font-semibold mb-1">ไม่มีข้อมูลเงินปันผล</div>
              <div>หุ้นนี้อาจไม่จ่ายเงินปันผล หรือไม่มีข้อมูลในระบบ (null หมายถึงไม่มีข้อมูลจาก backend)</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
