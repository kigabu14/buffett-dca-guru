
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Edit, Trash2, Sparkles, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { InvestmentForm } from '@/components/InvestmentForm';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { DividendCalendar } from '@/components/DividendCalendar';
import { PortfolioPieChart } from '@/components/PortfolioPieChart';
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
    if (!user) {
      console.error('No user found for investment submission');
      return;
    }

    console.log('Starting investment submission:', { investmentData, userId: user.id });

    try {
      // Filter out any fields that don't exist in the database
      const {
        commission_rate, // Remove this field since it doesn't exist in DB
        ...cleanedData
      } = investmentData;

      const dataWithUserId = {
        ...cleanedData,
        user_id: user.id
      };

      console.log('Data to submit:', dataWithUserId);

      const { data, error } = editingInvestment 
        ? await supabase
            .from('stock_investments')
            .update(dataWithUserId)
            .eq('id', editingInvestment.id)
            .select()
        : await supabase
            .from('stock_investments')
            .insert(dataWithUserId)
            .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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
      let errorMessage = 'ไม่สามารถเพิ่มการลงทุนได้';
      
      if (error.message) {
        errorMessage = error.message.includes('violates row-level security policy') 
          ? 'ไม่มีสิทธิ์เพิ่มการลงทุน กรุณาล็อกอินใหม่' 
          : `เกิดข้อผิดพลาด: ${error.message}`;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: editingInvestment ? "ไม่สามารถแก้ไขการลงทุนได้" : errorMessage,
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

  // Exchange rate for USD to THB (you might want to fetch this from an API)
  const USD_TO_THB = 35.5; // Example rate, you can make this dynamic

  // Calculate portfolio totals with USD conversion
  const totalPortfolioValue = investments.reduce((sum, inv) => {
    const value = calculateTotalValue(inv);
    if (inv.market === 'NASDAQ' || inv.market === 'NYSE') {
      return sum + (value * USD_TO_THB);
    }
    return sum + value;
  }, 0);
  
  const totalCostBasis = investments.reduce((sum, inv) => {
    const cost = (inv.quantity * inv.buy_price) + inv.commission;
    if (inv.market === 'NASDAQ' || inv.market === 'NYSE') {
      return sum + (cost * USD_TO_THB);
    }
    return sum + cost;
  }, 0);
  
  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalDividends = investments.reduce((sum, inv) => {
    const dividend = inv.dividend_received;
    if (inv.market === 'NASDAQ' || inv.market === 'NYSE') {
      return sum + (dividend * USD_TO_THB);
    }
    return sum + dividend;
  }, 0);

  // Calculate USD amounts for display
  const totalUSDValue = investments.reduce((sum, inv) => {
    if (inv.market === 'NASDAQ' || inv.market === 'NYSE') {
      return sum + calculateTotalValue(inv);
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">กำลังโหลดข้อมูลพอร์ต...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Animated Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-premium rounded-3xl opacity-10 blur-xl"></div>
          <Card className="relative border-border/50 bg-gradient-to-r from-card/80 to-muted/40 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <BarChart3 className="h-8 w-8 text-primary" />
                      <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-premium bg-clip-text text-transparent">
                      พอร์ตการลงทุน
                    </h1>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    จัดการและติดตามการลงทุนอย่างชาญฉลาด
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {investments.length} หุ้น
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      มูลค่า ฿{totalPortfolioValue.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={refreshStockPrices}
                    disabled={refreshing || investments.length === 0}
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <RefreshCw className={`mr-2 h-4 w-4 relative z-10 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                    <span className="relative z-10">อัพเดทราคา</span>
                  </Button>
                  
                  <Dialog open={addDialogOpen} onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) {
                      setEditingInvestment(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="group relative overflow-hidden bg-gradient-premium hover:shadow-gold transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Plus className="mr-2 h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="relative z-10">เพิ่มหุ้น</span>
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
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Summary with animations */}
        <div className="transform transition-all duration-500 hover:scale-[1.02]">
          <PortfolioSummary 
            totalPortfolioValue={totalPortfolioValue}
            investmentsCount={investments.length}
            totalGainLoss={totalGainLoss}
            totalCostBasis={totalCostBasis}
            totalDividends={totalDividends}
            totalUSDValue={totalUSDValue}
          />
        </div>

        <Separator className="my-8" />

        {/* Charts and Calendar Section */}
        {investments.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {user && <PortfolioPieChart investments={investments} />}
              {user && <DividendCalendar />}
            </div>
            <Separator className="my-8" />
          </>
        )}

        {/* Holdings Table with enhanced design */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-lg shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-background/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  รายการถือครอง
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  รายละเอียดหุ้นทั้งหมดในพอร์ต • อัพเดทล่าสุด {new Date().toLocaleTimeString('th-TH')}
                </CardDescription>
              </div>
              {investments.length > 0 && (
                <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                  {investments.length} รายการ
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {investments.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-gradient-premium opacity-20 absolute inset-0 animate-pulse"></div>
                  <BarChart3 className="h-16 w-16 text-muted-foreground relative z-10 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold mb-2">เริ่มต้นการลงทุนของคุณ</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  ยังไม่มีหุ้นในพอร์ต เพิ่มหุ้นแรกของคุณเพื่อเริ่มติดตามการลงทุน
                </p>
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-gradient-premium hover:shadow-gold transform hover:scale-105 transition-all duration-300"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  เพิ่มหุ้นแรกของคุณ
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="font-semibold">หุ้น</TableHead>
                        <TableHead className="text-right font-semibold">จำนวน</TableHead>
                        <TableHead className="text-right font-semibold">ราคาซื้อ</TableHead>
                        <TableHead className="text-right font-semibold">ราคาปัจจุบัน</TableHead>
                        <TableHead className="text-right font-semibold">มูลค่า</TableHead>
                        <TableHead className="text-right font-semibold">กำไร/ขาดทุน</TableHead>
                        <TableHead className="text-right font-semibold">%</TableHead>
                        <TableHead className="text-center font-semibold">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map((investment, index) => {
                        const currentValue = calculateTotalValue(investment);
                        const gainLoss = calculateGainLoss(investment);
                        const gainLossPercent = calculateGainLossPercentage(investment);
                        const currentPrice = investment.current_price || investment.buy_price;

                        return (
                          <TableRow 
                            key={investment.id}
                            className="group hover:bg-muted/30 transition-all duration-300 border-border/30"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-premium flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                    <span className="text-sm font-bold text-primary-foreground">
                                      {investment.symbol.slice(0, 2)}
                                    </span>
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background border border-border rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      {investment.market === 'SET' ? '🇹🇭' : '🇺🇸'}
                                    </span>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-base">{investment.symbol}</div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {investment.company_name || 'ไม่ระบุชื่อบริษัท'}
                                  </div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {investment.market}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {investment.quantity.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ฿{investment.buy_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-medium">฿{currentPrice.toFixed(2)}</span>
                                {currentPrice !== investment.buy_price && (
                                  <div className={`p-1 rounded-full ${currentPrice > investment.buy_price ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {currentPrice > investment.buy_price ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-lg">
                              ฿{currentValue.toLocaleString()}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {gainLoss >= 0 ? '+' : ''}฿{Math.abs(gainLoss).toLocaleString()}
                                {gainLoss >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <Badge 
                                variant={gainLossPercent >= 0 ? "default" : "destructive"}
                                className="font-bold"
                              >
                                {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditInvestment(investment)}
                                  className="h-9 w-9 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteInvestment(investment.id, investment.symbol)}
                                  className="h-9 w-9 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portfolio;
