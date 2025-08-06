
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { InvestmentForm } from '@/components/InvestmentForm';
import { PortfolioSummary } from '@/components/PortfolioSummary';

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
  const [editingInvestment, setEditingInvestment] = useState<StockInvestment | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

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

        await fetchInvestments();
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

  const handleAddInvestment = async (investmentData: any) => {
    if (!user) return;

    try {
      const dataWithUserId = {
        ...investmentData,
        user_id: user.id
      };

      const { error } = editingInvestment 
        ? await supabase
            .from('stock_investments')
            .update(dataWithUserId)
            .eq('id', editingInvestment.id)
        : await supabase
            .from('stock_investments')
            .insert(dataWithUserId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: editingInvestment 
          ? `แก้ไข ${investmentData.symbol} สำเร็จ`
          : `เพิ่ม ${investmentData.symbol} เข้าพอร์ตแล้ว`,
      });

      setAddDialogOpen(false);
      setEditingInvestment(null);
      fetchInvestments();
    } catch (error) {
      console.error('Error saving investment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: editingInvestment ? "ไม่สามารถแก้ไขการลงทุนได้" : "ไม่สามารถเพิ่มการลงทุนได้",
        variant: "destructive"
      });
    }
  };

  const handleEditInvestment = (investment: StockInvestment) => {
    setEditingInvestment(investment);
    setAddDialogOpen(true);
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

  // Calculate portfolio totals
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
          
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) {
              setEditingInvestment(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-premium hover:shadow-gold">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มหุ้น
              </Button>
            </DialogTrigger>
            <InvestmentForm
              editingInvestment={editingInvestment}
              onSubmit={handleAddInvestment}
              onCancel={() => {
                setAddDialogOpen(false);
                setEditingInvestment(null);
              }}
            />
          </Dialog>
        </div>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary 
        totalPortfolioValue={totalPortfolioValue}
        investmentsCount={investments.length}
        totalGainLoss={totalGainLoss}
        totalCostBasis={totalCostBasis}
        totalDividends={totalDividends}
      />

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
                              onClick={() => handleEditInvestment(investment)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
