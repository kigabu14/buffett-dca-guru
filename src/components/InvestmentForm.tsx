
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StockSelector } from '@/components/StockSelector';
import { AlertCircle } from 'lucide-react';

interface StockInvestment {
  id: string;
  symbol: string;
  company_name: string | null;
  quantity: number;
  buy_price: number;
  commission: number;
  purchase_date: string;
  market: string;
  notes: string | null;
}

interface InvestmentFormProps {
  editingInvestment: StockInvestment | null;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export const InvestmentForm = ({ editingInvestment, onSubmit, onCancel }: InvestmentFormProps) => {
  const [selectedStock, setSelectedStock] = useState('');
  const [stockPrice, setStockPrice] = useState<number>(0);
  const [currentStockData, setCurrentStockData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    quantity: '',
    buy_price: '',
    commission_rate: '0.25',
    purchase_date: new Date().toISOString().split('T')[0],
    market: '',
    notes: ''
  });

  // Reset form when editing investment changes
  useEffect(() => {
    if (editingInvestment) {
      setFormData({
        symbol: editingInvestment.symbol,
        company_name: editingInvestment.company_name || editingInvestment.symbol,
        quantity: editingInvestment.quantity.toString(),
        buy_price: editingInvestment.buy_price.toString(),
        commission_rate: ((editingInvestment.commission / (editingInvestment.quantity * editingInvestment.buy_price)) * 100).toFixed(2),
        purchase_date: editingInvestment.purchase_date,
        market: editingInvestment.market,
        notes: editingInvestment.notes || ''
      });
    } else {
      resetForm();
    }
  }, [editingInvestment]);

  // Update form when stock is selected
  useEffect(() => {
    if (currentStockData && !editingInvestment) {
      setFormData(prev => ({
        ...prev,
        symbol: currentStockData.symbol,
        company_name: currentStockData.name,
        market: currentStockData.market,
        buy_price: currentStockData.price > 0 ? currentStockData.price.toString() : prev.buy_price
      }));
      setStockPrice(currentStockData.price);
    }
  }, [currentStockData, editingInvestment]);

  const resetForm = () => {
    setFormData({
      symbol: '',
      company_name: '',
      quantity: '',
      buy_price: '',
      commission_rate: '0.25',
      purchase_date: new Date().toISOString().split('T')[0],
      market: '',
      notes: ''
    });
    setSelectedStock('');
    setStockPrice(0);
    setCurrentStockData(null);
  };

  const handleStockSelect = (stock: any) => {
    setFormData(prev => ({
      ...prev,
      symbol: stock.symbol,
      company_name: stock.name,
      market: stock.market,
      buy_price: stock.price > 0 ? stock.price.toString() : prev.buy_price
    }));
    setStockPrice(stock.price);
    setCurrentStockData(stock);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.quantity || !formData.buy_price) {
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const buyPrice = parseFloat(formData.buy_price);
    const commissionRate = parseFloat(formData.commission_rate);
    
    const totalValue = quantity * buyPrice;
    const commission = (totalValue * commissionRate) / 100;

    const investmentData = {
      symbol: formData.symbol,
      company_name: formData.company_name || formData.symbol,
      quantity,
      buy_price: buyPrice,
      commission,
      commission_rate: commissionRate,
      purchase_date: formData.purchase_date,
      market: formData.market,
      notes: formData.notes,
      current_price: stockPrice > 0 ? stockPrice : buyPrice,
      dividend_received: 0,
      dividend_yield_at_purchase: null
    };

    onSubmit(investmentData);
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingInvestment ? 'แก้ไขการลงทุน' : 'เพิ่มการลงทุนใหม่'}
        </DialogTitle>
        <DialogDescription>
          กรอกข้อมูลการซื้อหุ้นของคุณ
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stock Selector */}
        {!editingInvestment && (
          <div>
            <Label>เลือกหุ้น</Label>
            <StockSelector
              value={selectedStock}
              onValueChange={setSelectedStock}
              onStockSelect={handleStockSelect}
              placeholder="ค้นหาหุ้น..."
            />
          </div>
        )}

        {/* Stock Info Display */}
        {(formData.symbol || editingInvestment) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              หุ้น: {formData.symbol} | ตลาด: {formData.market} | 
              {stockPrice > 0 && !editingInvestment && 
                ` ราคาปัจจุบัน: ${formData.market === 'SET' ? '฿' : '$'}${stockPrice.toFixed(2)}`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">จำนวนหุ้น</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="100"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="buy_price">ราคาซื้อ (แก้ไขได้)</Label>
            <Input
              id="buy_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="250.00"
              value={formData.buy_price}
              onChange={(e) => setFormData(prev => ({ ...prev, buy_price: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="commission_rate">ค่าธรรมเนียม (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.01"
              min="0"
              max="5"
              placeholder="0.25"
              value={formData.commission_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.quantity && formData.buy_price && formData.commission_rate ? 
                `ค่าธรรมเนียม: ฿${((parseFloat(formData.quantity) * parseFloat(formData.buy_price) * parseFloat(formData.commission_rate)) / 100).toFixed(2)}` : 
                'ค่าธรรมเนียมจะคำนวณอัตโนมัติ'
              }
            </p>
          </div>
          <div>
            <Label htmlFor="purchase_date">วันที่ซื้อ</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">หมายเหตุ</Label>
          <Textarea
            id="notes"
            placeholder="หมายเหตุเพิ่มเติม..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {editingInvestment ? 'บันทึกการแก้ไข' : 'เพิ่มการลงทุน'}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
          >
            ยกเลิก
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};
