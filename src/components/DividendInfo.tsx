
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, DollarSign } from "lucide-react";
import { StockData, YahooFinanceService } from "@/services/YahooFinanceService";

interface DividendInfoProps {
  stock: StockData;
}

export const DividendInfo = ({ stock }: DividendInfoProps) => {
  const formatDividendYield = (yield: number) => {
    if (yield <= 0) return '-';
    return `${(yield * 100).toFixed(2)}%`;
  };

  const formatDividendRate = (rate: number, currency: string) => {
    if (rate <= 0) return '-';
    return YahooFinanceService.formatCurrency(rate, currency);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          ข้อมูลเงินปันผล
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">อัตราปันผลต่อปี</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-lg">
                {formatDividendYield(stock.dividendYield)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">เงินปันผลต่อหุ้นต่อปี</div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-lg">
                {formatDividendRate(stock.dividendRate, stock.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">วัน XD (Ex-Dividend)</div>
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
            <div className="text-sm text-muted-foreground">วันจ่ายเงินปันผล</div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              <span className="font-medium">
                {stock.dividendDate ? 
                  YahooFinanceService.formatDate(stock.dividendDate) : 
                  'ไม่มีข้อมูล'
                }
              </span>
            </div>
          </div>
        </div>

        {stock.dividendYield > 0 && (
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

        {stock.dividendYield <= 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="font-semibold mb-1">ไม่มีข้อมูลเงินปันผล</div>
              <div>หุ้นนี้อาจไม่จ่ายเงินปันผล หรือไม่มีข้อมูลในระบบ</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
