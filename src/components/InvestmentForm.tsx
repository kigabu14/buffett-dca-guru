import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Calculator, DollarSign, TrendingUp, Building2 } from 'lucide-react';
import { YahooFinanceService } from '@/services/YahooFinanceService';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';

interface StockInvestment {
  id: string;
  symbol: string;
  company_name: string | null;
  quantity: number;
  buy_price: number;
  current_price: number | null;
  commission: number;
  purchase_date: string;
  market: string;
  dividend_received: number;
  dividend_yield_at_purchase: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface InvestmentFormProps {
  editingInvestment: StockInvestment | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const InvestmentForm = ({ editingInvestment, onSubmit, onCancel }: InvestmentFormProps) => {
  const { settings } = useSettings();
  const [symbol, setSymbol] = useState(editingInvestment?.symbol || '');
  const [companyName, setCompanyName] = useState(editingInvestment?.company_name || '');
  const [quantity, setQuantity] = useState(editingInvestment?.quantity?.toString() || '');
  const [buyPrice, setBuyPrice] = useState(editingInvestment?.buy_price?.toString() || '');
  const [commissionRate, setCommissionRate] = useState(
    editingInvestment ? (editingInvestment.commission / (editingInvestment.quantity * editingInvestment.buy_price) * 100).toFixed(2) : settings.commissionRate.toString()
  );
  const [purchaseDate, setPurchaseDate] = useState(
    editingInvestment?.purchase_date || new Date().toISOString().split('T')[0]
  );
  const [market, setMarket] = useState(editingInvestment?.market || 'SET');
  const [dividendReceived, setDividendReceived] = useState(
    editingInvestment?.dividend_received?.toString() || '0'
  );
  const [dividendYieldAtPurchase, setDividendYieldAtPurchase] = useState(
    editingInvestment?.dividend_yield_at_purchase ? 
      (editingInvestment.dividend_yield_at_purchase * 100).toString() : ''
  );
  const [notes, setNotes] = useState(editingInvestment?.notes || '');
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fetch stock data when symbol changes
  useEffect(() => {
    const fetchStockData = async () => {
      if (symbol && symbol.length > 2) {
        setLoading(true);
        try {
          const searchSymbol = market === 'SET' && !symbol.includes('.BK') 
            ? symbol + '.BK' 
            : symbol;
          
          const data = await YahooFinanceService.getStock(searchSymbol);
          setStockData(data);
          
          if (data.name && !companyName) {
            setCompanyName(data.name);
          }
          
          // Don't auto-populate buyPrice if fetched price is null
          // ไม่ต้องใส่ราคาซื้ออัตโนมัติถ้าราคาที่ดึงมาเป็น null
          if (data.price != null && !buyPrice && !editingInvestment) {
            setBuyPrice(data.price.toString());
          }
          
          // Use returned currency where available
          if (data.dividendYield != null && !dividendYieldAtPurchase) {
            setDividendYieldAtPurchase((data.dividendYield * 100).toFixed(2));
          }
        } catch (error) {
          console.error('Error fetching stock data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchStockData, 500);
    return () => clearTimeout(debounceTimer);
  }, [symbol, market, editingInvestment]);

  // Calculate commission based on percentage
  const calculateCommission = () => {
    if (quantity && buyPrice && commissionRate) {
      const totalValue = parseFloat(quantity) * parseFloat(buyPrice);
      return totalValue * (parseFloat(commissionRate) / 100);
    }
    return 0;
  };

  const commission = calculateCommission();

  // Calculate totals
  const totalCost = quantity && buyPrice ? 
    (parseFloat(quantity) * parseFloat(buyPrice)) + commission : 0;
  
  const currentValue = quantity && stockData?.price ? 
    parseFloat(quantity) * stockData.price : 0;
    
  const potentialGainLoss = currentValue && totalCost ? currentValue - totalCost : 0;
  const potentialGainLossPercent = totalCost > 0 ? (potentialGainLoss / totalCost) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !quantity || !buyPrice) {
      return;
    }

    const data = {
      symbol: symbol.toUpperCase(),
      company_name: companyName || null,
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice),
      commission: commission,
      purchase_date: purchaseDate,
      market,
      dividend_received: parseFloat(dividendReceived || '0'),
      dividend_yield_at_purchase: dividendYieldAtPurchase ? 
        parseFloat(dividendYieldAtPurchase) / 100 : null,
      notes: notes || null,
      current_price: stockData?.price || parseFloat(buyPrice)
    };

    console.log('Investment form submitting clean data:', data);
    onSubmit(data);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingInvestment ? 'แก้ไขการลงทุน' : 'เพิ่มหุ้นใหม่เข้าพอร์ต'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="market">ตลาด</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SET">SET (หุ้นไทย)</SelectItem>
                <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                <SelectItem value="NYSE">NYSE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="symbol">สัญลักษณ์หุ้น *</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="เช่น AAPL, PTT"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">ชื่อบริษัท</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="จะถูกดึงมาอัตโนมัติ"
          />
        </div>

        {stockData && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{stockData.name}</h4>
                <p className="text-sm text-muted-foreground">{stockData.market} • {stockData.currency || 'ไม่ระบุ'}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {stockData.price != null ? 
                    `${stockData.currency === 'THB' ? '฿' : stockData.currency ? '$' : '฿'}${stockData.price.toFixed(2)}` : 
                    'ไม่มีข้อมูลราคา'
                  }
                </div>
                {stockData.changePercent != null ? (
                  <div className={`text-sm ${stockData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">ไม่มีข้อมูลการเปลี่ยนแปลง</div>
                )}
                {stockData.exDividendDate && (
                  <div className="text-xs text-muted-foreground">
                    Ex-Div: {new Date(stockData.exDividendDate).toLocaleDateString('th-TH')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">จำนวนหุ้น *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min="0"
              step="1"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buyPrice">ราคาซื้อ/หุ้น *</Label>
            <Input
              id="buyPrice"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="100.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commissionRate">ค่าธรรมเนียม (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="0.15"
              min="0"
              step="0.01"
              max="5"
            />
            <p className="text-xs text-muted-foreground">
              ค่าธรรมเนียม: ฿{commission.toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dividendReceived">เงินปันผลที่ได้รับ</Label>
            <Input
              id="dividendReceived"
              type="number"
              value={dividendReceived}
              onChange={(e) => setDividendReceived(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dividendYieldAtPurchase">อัตราปันผล ณ วันซื้อ (%)</Label>
            <Input
              id="dividendYieldAtPurchase"
              type="number"
              value={dividendYieldAtPurchase}
              onChange={(e) => setDividendYieldAtPurchase(e.target.value)}
              placeholder="3.50"
              min="0"
              step="0.01"
            />
            {stockData?.dividendYield != null && stockData.dividendYield > 0 && (
              <p className="text-xs text-muted-foreground">
                อัตราปันผลปัจจุบัน: {(stockData.dividendYield * 100).toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">หมายเหตุ</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="บันทึกเพิ่มเติมเกี่ยวกับการลงทุนนี้..."
            rows={3}
          />
        </div>

        {quantity && buyPrice && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>มูลค่าหุ้น:</span>
              <span>฿{(parseFloat(quantity) * parseFloat(buyPrice)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าธรรมเนียม:</span>
              <span>฿{commission.toFixed(2)} ({commissionRate}%)</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>ต้นทุนรวม:</span>
              <span>฿{totalCost.toLocaleString()}</span>
            </div>
            {currentValue > 0 && (
              <div className={`flex justify-between font-semibold ${potentialGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>กำไร/ขาดทุน:</span>
                <span>
                  {potentialGainLoss >= 0 ? '+' : ''}฿{potentialGainLoss.toLocaleString()} 
                  ({potentialGainLoss >= 0 ? '+' : ''}{potentialGainLossPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={!symbol || !quantity || !buyPrice || loading}
            className="flex-1"
          >
            {loading ? 'กำลังโหลด...' : editingInvestment ? 'บันทึกการแก้ไข' : 'เพิ่มเข้าพอร์ต'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};