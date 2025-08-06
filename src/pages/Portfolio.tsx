import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockInvestment {
  id: string;
  symbol: string;
  company_name: string;
  quantity: number;
  buy_price: number;
  current_price: number;
  market: string;
  purchase_date: string;
  commission: number;
  dividend_received: number;
  notes?: string;
}

const Portfolio = () => {
  const [investments, setInvestments] = useState<StockInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state for adding new investment
  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    company_name: '',
    quantity: '',
    buy_price: '',
    market: 'SET',
    purchase_date: new Date().toISOString().split('T')[0],
    commission: '0',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลพอร์ตได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStockPrices = async () => {
    if (investments.length === 0) return;
    
    setRefreshing(true);
    try {
      const symbols = investments.map(inv => {
        // Format symbol for Yahoo Finance API
        if (inv.market === 'SET') {
          return inv.symbol + '.BK';
        }
        return inv.symbol;
      });

      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.success) {
        await fetchInvestments(); // Reload data
        toast({
          title: "อัพเดทราคาสำเร็จ",
          description: `อัพเดทราคา ${data.updated_count} หุ้น`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถอัพเดทราคาได้",
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const addInvestment = async () => {
    if (!newInvestment.symbol || !newInvestment.quantity || !newInvestment.buy_price) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "สัญลักษณ์หุ้น จำนวนหุ้น และราคาซื้อเป็นข้อมูลจำเป็น",
      });
      return;
    }

    try {
      const investmentData = {
        user_id: user?.id,
        symbol: newInvestment.symbol.toUpperCase(),
        company_name: newInvestment.company_name || newInvestment.symbol.toUpperCase(),
        quantity: parseFloat(newInvestment.quantity),
        buy_price: parseFloat(newInvestment.buy_price),
        current_price: parseFloat(newInvestment.buy_price), // Initial current price
        market: newInvestment.market,
        purchase_date: newInvestment.purchase_date,
        commission: parseFloat(newInvestment.commission),
        dividend_received: 0,
        notes: newInvestment.notes
      };

      const { error } = await supabase
        .from('stock_investments')
        .insert([investmentData]);

      if (error) throw error;

      // Reset form
      setNewInvestment({
        symbol: '',
        company_name: '',
        quantity: '',
        buy_price: '',
        market: 'SET',
        purchase_date: new Date().toISOString().split('T')[0],
        commission: '0',
        notes: ''
      });

      setIsAddDialogOpen(false);
      await fetchInvestments();

      toast({
        title: "เพิ่มการลงทุนสำเร็จ",
        description: `เพิ่ม ${investmentData.symbol} เข้าพอร์ตแล้ว`,
      });

      // Auto-refresh stock price for new investment
      setTimeout(() => {
        refreshStockPrices();
      }, 1000);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถเพิ่มการลงทุนได้",
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const calculateGainLoss = (investment: StockInvestment) => {
    const totalCost = (investment.quantity * investment.buy_price) + investment.commission;
    const currentValue = investment.quantity * investment.current_price;
    const gainLoss = currentValue - totalCost + investment.dividend_received;
    const percentage = ((gainLoss / totalCost) * 100);
    
    return {
      gainLoss,
      percentage,
      currentValue,
      totalCost
    };
  };

  const totalPortfolioValue = investments.reduce((sum, inv) => {
    const { currentValue } = calculateGainLoss(inv);
    return sum + currentValue;
  }, 0);

  const totalGainLoss = investments.reduce((sum, inv) => {
    const { gainLoss } = calculateGainLoss(inv);
    return sum + gainLoss;
  }, 0);

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
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            อัพเดทราคา
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-premium hover:shadow-gold">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหุ้น
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>เพิ่มการลงทุนใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการซื้อหุ้นของคุณ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="market">ตลาดหุ้น</Label>
                    <Select value={newInvestment.market} onValueChange={(value) => 
                      setNewInvestment(prev => ({ ...prev, market: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SET">SET (ไทย)</SelectItem>
                        <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                        <SelectItem value="NYSE">NYSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="symbol">สัญลักษณ์หุ้น</Label>
                    <Input
                      id="symbol"
                      placeholder="เช่น ADVANC, AAPL"
                      value={newInvestment.symbol}
                      onChange={(e) => setNewInvestment(prev => ({ 
                        ...prev, 
                        symbol: e.target.value.toUpperCase() 
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="company_name">ชื่อบริษัท (ไม่บังคับ)</Label>
                  <Input
                    id="company_name"
                    placeholder="ชื่อบริษัท"
                    value={newInvestment.company_name}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      company_name: e.target.value 
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">จำนวนหุ้น</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="100"
                      value={newInvestment.quantity}
                      onChange={(e) => setNewInvestment(prev => ({ 
                        ...prev, 
                        quantity: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buy_price">ราคาซื้อ</Label>
                    <Input
                      id="buy_price"
                      type="number"
                      step="0.01"
                      placeholder="250.00"
                      value={newInvestment.buy_price}
                      onChange={(e) => setNewInvestment(prev => ({ 
                        ...prev, 
                        buy_price: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">วันที่ซื้อ</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={newInvestment.purchase_date}
                      onChange={(e) => setNewInvestment(prev => ({ 
                        ...prev, 
                        purchase_date: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission">ค่าธรรมเนียม</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newInvestment.commission}
                      onChange={(e) => setNewInvestment(prev => ({ 
                        ...prev, 
                        commission: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Input
                    id="notes"
                    placeholder="หมายเหตุเพิ่มเติม"
                    value={newInvestment.notes}
                    onChange={(e) => setNewInvestment(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addInvestment} className="flex-1">
                    เพิ่มการลงทุน
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
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
              ฿{totalPortfolioValue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
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
              {totalGainLoss >= 0 ? '+' : ''}฿{totalGainLoss.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPortfolioValue > 0 ? 
                `${totalGainLoss >= 0 ? '+' : ''}${((totalGainLoss / (totalPortfolioValue - totalGainLoss)) * 100).toFixed(2)}%` : 
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
              ฿{totalDividends.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              รายได้จากเงินปันผล
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings List */}
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
              <p className="text-muted-foreground">ยังไม่มีการลงทุนในพอร์ต</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                เพิ่มหุ้นแรกของคุณ
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => {
                const { gainLoss, percentage, currentValue, totalCost } = calculateGainLoss(investment);
                
                return (
                  <div 
                    key={investment.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-premium flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {investment.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{investment.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          {investment.company_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {investment.quantity} หุ้น @ ฿{investment.buy_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className="font-semibold">
                            ฿{currentValue.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                          </p>
                          <div className={`flex items-center text-sm ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {gainLoss >= 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {gainLoss >= 0 ? '+' : ''}฿{gainLoss.toFixed(2)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;