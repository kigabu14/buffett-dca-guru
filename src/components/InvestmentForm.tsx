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
  const [symbol, setSymbol] = useState(editingInvestment?.symbol || '');
  const [companyName, setCompanyName] = useState(editingInvestment?.company_name || '');
  const [quantity, setQuantity] = useState(editingInvestment?.quantity?.toString() || '');
  const [buyPrice, setBuyPrice] = useState(editingInvestment?.buy_price?.toString() || '');
  const [commission, setCommission] = useState(editingInvestment?.commission?.toString() || '0');
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
          
          if (data.price && !buyPrice && !editingInvestment) {
            setBuyPrice(data.price.toString());
          }
          
          if (data.dividendYield && !dividendYieldAtPurchase) {
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

  // Auto-calculate commission when quantity or price changes
  useEffect(() => {
    if (quantity && buyPrice && !editingInvestment) {
      const totalValue = parseFloat(quantity) * parseFloat(buyPrice);
      const calculatedCommission = totalValue * 0.0025; // 0.25% commission
      setCommission(calculatedCommission.toFixed(2));
    }
  }, [quantity, buyPrice, editingInvestment]);

  // Calculate totals
  const totalCost = quantity && buyPrice ? 
    (parseFloat(quantity) * parseFloat(buyPrice)) + parseFloat(commission || '0') : 0;
  
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
      commission: parseFloat(commission || '0'),
      purchase_date: purchaseDate,
      market,
      dividend_received: parseFloat(dividendReceived || '0'),
      dividend_yield_at_purchase: dividendYieldAtPurchase ? 
        parseFloat(dividendYieldAtPurchase) / 100 : null,
      notes: notes || null,
      current_price: stockData?.price || parseFloat(buyPrice),
    };

    console.log('Investment form submitting clean data:', data);
    onSubmit(data);
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          {editingInvestment ? (
            <>
              <TrendingUp className="h-5 w-5 text-blue-600" />
              แก้ไขการลงทุน: {editingInvestment.symbol}
            </>
          ) : (
            <>
              <Building2 className="h-5 w-5 text-green-600" />
              เพิ่มหุ้นใหม่เข้าพอร์ต
            </>
          )}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <Card className="border-border/50 bg-gradient-to-br from-card/50 to-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4 text-primary" />
                ข้อมูลหุ้น
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="market" className="text-sm font-medium">ตลาด</Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger className="bg-background/50 border-border/50">
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
                  <Label htmlFor="symbol" className="text-sm font-medium">
                    สัญลักษณ์หุ้น *
                  </Label>
                  <Input
                    id="symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="เช่น AAPL, PTT"
                    className="bg-background/50 border-border/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">ชื่อบริษัท</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="จะถูกดึงมาอัตโนมัติ"
                  className="bg-background/50 border-border/50"
                />
              </div>

              {/* Stock Preview */}
              {stockData && (
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-800">{stockData.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {stockData.market}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {stockData.currency}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-700">
                          ฿{stockData.price?.toFixed(2)}
                        </div>
                        <div className={`text-sm ${stockData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Transaction Details */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-4 w-4 text-primary" />
                รายละเอียดการซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">จำนวนหุ้น *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    min="0"
                    step="1"
                    className="bg-background/50 border-border/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buyPrice" className="text-sm font-medium">ราคาซื้อ/หุ้น *</Label>
                  <Input
                    id="buyPrice"
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="100.00"
                    min="0"
                    step="0.01"
                    className="bg-background/50 border-border/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-sm font-medium">ค่าธรรมเนียม</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate" className="text-sm font-medium">วันที่ซื้อ</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {quantity && buyPrice && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>มูลค่าหุ้น:</span>
                        <span className="font-medium">
                          ฿{(parseFloat(quantity) * parseFloat(buyPrice)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ค่าธรรมเนียม:</span>
                        <span className="font-medium">฿{parseFloat(commission || '0').toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-blue-700">
                        <span>ต้นทุนรวม:</span>
                        <span>฿{totalCost.toLocaleString()}</span>
                      </div>
                      
                      {currentValue > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span>มูลค่าปัจจุบัน:</span>
                            <span className="font-medium">฿{currentValue.toLocaleString()}</span>
                          </div>
                          <div className={`flex justify-between font-semibold ${potentialGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span>กำไร/ขาดทุน:</span>
                            <span>
                              {potentialGainLoss >= 0 ? '+' : ''}฿{potentialGainLoss.toLocaleString()} 
                              ({potentialGainLoss >= 0 ? '+' : ''}{potentialGainLossPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Section */}
        <Card className="border-border/50 bg-gradient-to-r from-card/50 to-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-4 w-4 text-primary" />
              ข้อมูลเพิ่มเติม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dividendReceived" className="text-sm font-medium">เงินปันผลที่ได้รับ</Label>
                <Input
                  id="dividendReceived"
                  type="number"
                  value={dividendReceived}
                  onChange={(e) => setDividendReceived(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="bg-background/50 border-border/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dividendYieldAtPurchase" className="text-sm font-medium">อัตราปันผล ณ วันซื้อ (%)</Label>
                <Input
                  id="dividendYieldAtPurchase"
                  type="number"
                  value={dividendYieldAtPurchase}
                  onChange={(e) => setDividendYieldAtPurchase(e.target.value)}
                  placeholder="3.50"
                  min="0"
                  step="0.01"
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="บันทึกเพิ่มเติมเกี่ยวกับการลงทุนนี้..."
                rows={3}
                className="bg-background/50 border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
            className="flex-1 bg-gradient-premium hover:shadow-gold"
          >
            {loading ? 'กำลังโหลด...' : editingInvestment ? 'บันทึกการแก้ไข' : 'เพิ่มเข้าพอร์ต'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};