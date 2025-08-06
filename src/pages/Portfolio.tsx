import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StockSelector } from '@/components/StockSelector';
import { RealTimeStockPrice } from '@/components/RealTimeStockPrice';
import { DCASimulator } from '@/components/DCASimulator';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [investments, setInvestments] = useState<StockInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [stockPrice, setStockPrice] = useState<number>(0);
  const [currentStockData, setCurrentStockData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    quantity: '',
    buy_price: '',
    commission_rate: '0.25', // ค่าธรรมเนียมเริ่มต้น 0.25%
    purchase_date: new Date().toISOString().split('T')[0],
    market: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  // อัพเดทข้อมูลเมื่อเลือกหุ้น
  useEffect(() => {
    if (currentStockData) {
      setFormData(prev => ({
        ...prev,
        symbol: currentStockData.symbol,
        company_name: currentStockData.name,
        market: currentStockData.market,
        buy_price: currentStockData.price.toString() // ใช้ราคาปัจจุบันเป็น default
      }));
      setStockPrice(currentStockData.price);
    }
  }, [currentStockData]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลพอร์ตได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStockPrices = async () => {
    if (investments.length === 0) {
      toast({
        title: "ไม่มีหุ้นในพอร์ต",
        description: "กรุณาเพิ่มหุ้นก่อนอัพเดทราคา",
        variant: "destructive"
      });
      return;
    }
    
    setRefreshing(true);
    try {
      const symbols = investments.map(inv => {
        // เพิ่ม .BK สำหรับหุ้นไทย
        if (inv.market === 'SET' && !inv.symbol.includes('.BK')) {
          return inv.symbol + '.BK';
        }
        return inv.symbol;
      });

      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols }
      });

      if (error) {
        console.error('Stock data error:', error);
        throw new Error('ไม่สามารถดึงข้อมูลราคาได้');
      }

      if (data?.data && data.data.length > 0) {
        // อัพเดทราคาในฐานข้อมูล
        for (const stockData of data.data) {
          const investment = investments.find(inv => {
            const invSymbol = inv.market === 'SET' && !inv.symbol.includes('.BK') 
              ? inv.symbol + '.BK' 
              : inv.symbol;
            return invSymbol === stockData.symbol;
          });

          if (investment) {
            await supabase
              .from('stock_investments')
              .update({ 
                current_price: stockData.current_price || stockData.price || investment.buy_price 
              })
              .eq('id', investment.id);
          }
        }

        await fetchInvestments(); // รีโหลดข้อมูล
        toast({
          title: "อัพเดทราคาสำเร็จ",
          description: `อัพเดทราคา ${data.data.length} หุ้น`,
        });
      } else {
        toast({
          title: "เตือน",
          description: "ไม่พบข้อมูลราคาหุ้น ใช้ข้อมูลเดิม",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
      toast({
        title: "ไม่สามารถอัพเดทราคาได้",
        description: "กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.symbol || !formData.quantity || !formData.buy_price) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "หุ้น จำนวน และราคาซื้อเป็นข้อมูลจำเป็น",
        variant: "destructive"
      });
      return;
    }

    try {
      const quantity = parseFloat(formData.quantity);
      const buyPrice = parseFloat(formData.buy_price);
      const commissionRate = parseFloat(formData.commission_rate);
      
      // คำนวณค่าธรรมเนียม
      const totalValue = quantity * buyPrice;
      const commission = (totalValue * commissionRate) / 100;

      const { error } = await supabase
        .from('stock_investments')
        .insert({
          user_id: user.id,
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
        });

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `เพิ่ม ${formData.symbol} เข้าพอร์ตแล้ว`,
      });

      setAddDialogOpen(false);
      resetForm();
      fetchInvestments();
    } catch (error) {
      console.error('Error adding investment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มการลงทุนได้",
        variant: "destructive"
      });
    }
  };

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
  };

  const deleteInvestment = async (id: string, symbol: string) => {
    try {
      const { error } = await supabase
        .from('stock_investments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
        description: `ลบ ${symbol} ออกจากพอร์ตแล้ว`,
      });

      fetchInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการลงทุนได้",
        variant: "destructive"
      });
    }
  };

  const calculateTotalValue = (investment: StockInvestment) => {
    const currentPrice = investment.current_price || investment.buy_price;
    return investment.quantity * currentPrice;
  };

  const calculateGainLoss = (investment: StockInvestment) => {
    const currentValue = calculateTotalValue(investment);
    const costBasis = (investment.quantity * investment.buy_price) + investment.commission;
    return currentValue - costBasis;
  };

  const calculateGainLossPercentage = (investment: StockInvestment) => {
    const costBasis = (investment.quantity * investment.buy_price) + investment.commission;
    const gainLoss = calculateGainLoss(investment);
    return costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
  };

  // Handle stock selection
  const handleStockSelect = (stock: any) => {
    setFormData(prev => ({
      ...prev,
      symbol: stock.symbol,
      company_name: stock.name,
      market: stock.market,
      buy_price: stock.price > 0 ? stock.price.toString() : prev.buy_price
    }));
    setStockPrice(stock.price);
  };

  // คำนวณผลรวมพอร์ต
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + calculateTotalValue(inv), 0);
  const totalCostBasis = investments.reduce((sum, inv) => 
    sum + (inv.quantity * inv.buy_price) + inv.commission, 0);
  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalDividends = investments.reduce((sum, inv) => sum + inv.dividend_received, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">กำลังโหลดข้อมูลพอร์ต...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            พอร์ตการลงทุน
          </h1>
          <p className="text-muted-foreground">
            จัดการและติดตามการลงทุนของคุณ
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshStockPrices}
            disabled={refreshing || investments.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            อัพเดทราคา
          </Button>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-premium hover:shadow-gold">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหุ้น
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มการลงทุนใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการซื้อหุ้นของคุณ
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddInvestment} className="space-y-4">
                {/* Stock Selector */}
                <div>
                  <Label>เลือกหุ้น</Label>
                  <StockSelector
                    value={selectedStock}
                    onValueChange={setSelectedStock}
                    onStockSelect={handleStockSelect}
                    placeholder="ค้นหาหุ้น..."
                  />
                </div>

                {/* แสดงข้อมูลหุ้นที่เลือก */}
                {formData.symbol && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      หุ้น: {formData.symbol} | ตลาด: {formData.market} | 
                      ราคาปัจจุบัน: {stockPrice > 0 ? `${formData.market === 'SET' ? '฿' : '$'}${stockPrice.toFixed(2)}` : 'ไม่พบข้อมูล'}
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
                    <Label htmlFor="buy_price">ราคาซื้อ</Label>
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
                    เพิ่มการลงทุน
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Summary */}
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
              จาก {investments.length} หุ้น
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

      {/* Holdings Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>รายการถือครอง</CardTitle>
          <CardDescription>
            รายละเอียดหุ้นทั้งหมดในพอร์ต
          </CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">ยังไม่มีการลงทุนในพอร์ต</p>
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-premium hover:shadow-gold"
              >
                เพิ่มหุ้นแรกของคุณ
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หุ้น</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ราคาซื้อ</TableHead>
                    <TableHead className="text-right">ราคาปัจจุบัน</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead className="text-right">กำไร/ขาดทุน</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => {
                    const currentValue = calculateTotalValue(investment);
                    const gainLoss = calculateGainLoss(investment);
                    const gainLossPercent = calculateGainLossPercentage(investment);
                    const currentPrice = investment.current_price || investment.buy_price;

                    return (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-premium flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-foreground">
                                {investment.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold">{investment.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {investment.company_name}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {investment.market}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {investment.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{investment.buy_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            ฿{currentPrice.toFixed(2)}
                            {currentPrice !== investment.buy_price && (
                              <div className={`ml-2 ${currentPrice > investment.buy_price ? 'text-green-500' : 'text-red-500'}`}>
                                {currentPrice > investment.buy_price ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ฿{currentValue.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {gainLoss >= 0 ? '+' : ''}฿{gainLoss.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${gainLossPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInvestment(investment.id, investment.symbol)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;