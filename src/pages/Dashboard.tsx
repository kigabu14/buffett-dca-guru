import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YahooFinanceService, StockData } from "@/services/YahooFinanceService";
import { RealTimeStockPrice } from "@/components/RealTimeStockPrice";
import { DCASimulator } from "@/components/DCASimulator";
import { YahooFinanceStatus } from "@/components/YahooFinanceStatus";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign, BarChart3, Target, Plus, X, RotateCcw } from "lucide-react";

// Constants for watchlist management
const MAX_SYMBOLS = 25;
const DEFAULT_SYMBOLS = YahooFinanceService.getDefaultSymbols();

const Dashboard = () => {
  const { portfolioStats, recentActivities, loading, refreshData } = useDashboardData();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userStocks, setUserStocks] = useState<any[]>([]);
  
  // Watchlist state management
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [newSymbol, setNewSymbol] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load watchlist on component mount and user change
  useEffect(() => {
    loadWatchlist();
  }, [user]);

  // Fetch stock data when selectedSymbols changes
  useEffect(() => {
    if (selectedSymbols.length > 0) {
      fetchStockData();
    }
  }, [selectedSymbols]);

  // Fetch user stocks when user changes
  useEffect(() => {
    if (user) {
      fetchUserStocks();
    }
  }, [user]);

  const loadWatchlist = async () => {
    try {
      const symbols = await YahooFinanceService.loadUserWatchlist(user?.id);
      setSelectedSymbols(symbols);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setSelectedSymbols(DEFAULT_SYMBOLS);
    }
  };

  const saveWatchlist = async (symbols: string[]) => {
    setIsSaving(true);
    try {
      await YahooFinanceService.persistWatchlist(symbols, user?.id);
      toast({
        title: "บันทึกสำเร็จ",
        description: "รายการหุ้นติดตามได้รับการบันทึกแล้ว",
      });
    } catch (error) {
      console.error('Error saving watchlist:', error);
      toast({
        title: "ไม่สามารถบันทึกได้",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSymbol = async () => {
    const symbol = newSymbol.toUpperCase().trim();
    if (!symbol) return;
    
    if (selectedSymbols.includes(symbol)) {
      toast({
        title: "หุ้นซ้ำ",
        description: "หุ้นนี้มีอยู่ในรายการแล้ว",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedSymbols.length >= MAX_SYMBOLS) {
      toast({
        title: "เกินจำนวนสูงสุด",
        description: `สามารถติดตามหุ้นได้สูงสุด ${MAX_SYMBOLS} ตัว`,
        variant: "destructive"
      });
      return;
    }
    
    const newSymbols = [...selectedSymbols, symbol];
    setSelectedSymbols(newSymbols);
    setNewSymbol('');
    await saveWatchlist(newSymbols);
  };

  const removeSymbol = async (symbolToRemove: string) => {
    const newSymbols = selectedSymbols.filter(symbol => symbol !== symbolToRemove);
    setSelectedSymbols(newSymbols);
    await saveWatchlist(newSymbols);
  };

  const resetToDefault = async () => {
    setSelectedSymbols(DEFAULT_SYMBOLS);
    await saveWatchlist(DEFAULT_SYMBOLS);
    toast({
      title: "รีเซ็ตเสร็จสิ้น",
      description: "กลับไปใช้รายการหุ้นเริ่มต้น",
    });
  };

  const fetchUserStocks = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_investments')
        .select('symbol, company_name, quantity, buy_price, current_price, market')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Fetch current prices from Yahoo Finance for accurate calculation
      if (data && data.length > 0) {
        const symbols = [...new Set(data.map(stock => stock.symbol))];
        try {
          const stockPrices = await YahooFinanceService.getStocks(symbols);
          const priceMap = new Map(stockPrices.map(s => [s.symbol, s.price]));
          
          // Update stocks with current prices - do NOT fallback to current_price or buy_price
          const updatedStocks = data.map(stock => ({
            ...stock,
            current_price_yahoo: priceMap.get(stock.symbol) ?? null
          }));
          
          setUserStocks(updatedStocks);
        } catch (error) {
          console.error('Error fetching current prices:', error);
          setUserStocks(data || []);
        }
      } else {
        setUserStocks([]);
      }
    } catch (error) {
      console.error('Error fetching user stocks:', error);
    }
  };

  const fetchStockData = async () => {
    setLoadingStocks(true);
    try {
      const stocks = await YahooFinanceService.getStocks(selectedSymbols);
      setStockData(stocks);
      setLastUpdate(new Date());
      
      // Check for missing symbols and warn user
      const receivedSymbols = stocks.map(s => s.symbol);
      const missingSymbols = selectedSymbols.filter(symbol => !receivedSymbols.includes(symbol));
      
      if (missingSymbols.length > 0) {
        toast({
          title: "ไม่พบข้อมูลบางหุ้น",
          description: `ไม่พบข้อมูล: ${missingSymbols.join(', ')} - กำลังลบออกจากรายการ`,
          variant: "destructive"
        });
        
        // Automatically remove missing symbols from watchlist
        const validSymbols = selectedSymbols.filter(symbol => receivedSymbols.includes(symbol));
        setSelectedSymbols(validSymbols);
        await saveWatchlist(validSymbols);
      } else {
        toast({
          title: "อัพเดทข้อมูลสำเร็จ",
          description: `ดึงข้อมูลหุ้น ${stocks.length} ตัวจาก Yahoo Finance`,
        });
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setStockData([]);
      toast({
        title: "ไม่สามารถดึงข้อมูลหุ้นได้",
        description: "กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoadingStocks(false);
    }
  };

  const getDCAScoreColor = (score: number) => {
    if (score >= 7) return "bg-green-100 text-green-800";
    if (score >= 5) return "bg-blue-100 text-blue-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPriceChangeColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground";
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const marketStats = {
    totalStocks: stockData.length,
    gainers: stockData.filter(s => s.changePercent !== null && s.changePercent > 0).length,
    losers: stockData.filter(s => s.changePercent !== null && s.changePercent < 0).length,
    avgChange: (() => {
      const validChanges = stockData.filter(s => s.changePercent !== null).map(s => s.changePercent!);
      return validChanges.length > 0 ? validChanges.reduce((sum, change) => sum + change, 0) / validChanges.length : null;
    })()
  };

  return (
    <div className="p-6 space-y-6">
      {/* Yahoo Finance Status */}
      <YahooFinanceStatus />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            แดชบอร์ดหุ้น
          </h1>
          <p className="text-muted-foreground">
            ข้อมูลหุ้นแบบเรียลไทม์จาก Yahoo Finance API
            {lastUpdate && (
              <span className="ml-2">
                อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={fetchStockData}
          disabled={loadingStocks}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStocks ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>
      
      {/* Market Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พอร์ตโฟลิโอ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('th-TH', { 
                style: 'currency', 
                currency: 'THB' 
              }).format(portfolioStats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              มูลค่ารวมการลงทุน
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ติดตามหุ้น</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketStats.totalStocks}</div>
            <p className="text-xs text-muted-foreground">
              หุ้นทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หุ้นขาขึ้น</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marketStats.gainers}</div>
            <p className="text-xs text-muted-foreground">
              จาก {marketStats.totalStocks} หุ้น
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หุ้นขาลง</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{marketStats.losers}</div>
            <p className="text-xs text-muted-foreground">
              จาก {marketStats.totalStocks} หุ้น
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Management */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            จัดการรายการหุ้นติดตาม
          </CardTitle>
          <CardDescription>
            เพิ่ม/ลบหุ้นที่ต้องการติดตาม (สูงสุด {MAX_SYMBOLS} ตัว) - ปัจจุบัน: {selectedSymbols.length}/{MAX_SYMBOLS}
            {isSaving && <span className="text-blue-600 ml-2">กำลังบันทึก...</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new symbol */}
          <div className="flex gap-2">
            <Input
              placeholder="ป้อนสัญลักษณ์หุ้น (เช่น AAPL, PTT.BK)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
              className="flex-1"
            />
            <Button 
              onClick={addSymbol}
              disabled={!newSymbol.trim() || selectedSymbols.length >= MAX_SYMBOLS || isSaving}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              เพิ่ม
            </Button>
            <Button 
              onClick={resetToDefault}
              variant="outline"
              disabled={isSaving}
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              รีเซ็ต
            </Button>
          </div>

          {/* Symbol chips */}
          <div className="flex flex-wrap gap-2">
            {selectedSymbols.map((symbol) => (
              <Badge 
                key={symbol} 
                variant="secondary" 
                className="px-3 py-1 flex items-center gap-1"
              >
                {symbol}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeSymbol(symbol)}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Portfolio Holdings with Real-time Prices */}
      {userStocks.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              พอร์ตของฉัน
            </CardTitle>
            <CardDescription>
              หุ้นในพอร์ตของคุณพร้อมราคาเรียลไทม์
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userStocks.map((stock) => (
                <Card key={stock.symbol} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{stock.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{stock.company_name}</p>
                    </div>
                    <Badge variant="outline">{stock.quantity} หุ้น</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ราคาซื้อ:</span>
                      <span>
                        {stock.symbol.includes('.BK') ? '฿' : '$'}{stock.buy_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ราคาปัจจุบัน:</span>
                      <span className="font-medium" title={stock.current_price_yahoo === null ? "ไม่มีข้อมูล" : undefined}>
                        {YahooFinanceService.formatDisplayPrice(
                          stock.current_price_yahoo, 
                          stock.symbol.includes('.BK') ? 'THB' : 'USD',
                          { placeholder: 'N/A' }
                        )}
                      </span>
                    </div>
                    <RealTimeStockPrice 
                      symbol={stock.symbol} 
                      buyPrice={stock.buy_price}
                      className="text-sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Stock Watchlist Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            รายการหุ้นติดตาม
          </CardTitle>
          <CardDescription>
            ข้อมูลหุ้นที่คุณเลือกติดตาม จาก Yahoo Finance API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStocks ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สัญลักษณ์</TableHead>
                  <TableHead>ชื่อบริษัท</TableHead>
                  <TableHead>ตลาด</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead className="text-right">เปลี่ยนแปลง</TableHead>
                  <TableHead className="text-right">%เปลี่ยนแปลง</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">P/E</TableHead>
                  <TableHead className="text-right">52W High</TableHead>
                  <TableHead className="text-right">52W Low</TableHead>
                  <TableHead className="text-center">DCA Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.map((stock) => {
                  const dcaScore = YahooFinanceService.calculateDCAScore(stock);
                  const recommendation = YahooFinanceService.getDCARecommendation(dcaScore);
                  
                  return (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {stock.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.market}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {YahooFinanceService.formatDisplayPrice(stock.price, stock.currency, { placeholder: 'N/A' })}
                      </TableCell>
                      <TableCell className={`text-right ${getPriceChangeColor(stock.change)}`}>
                        {stock.change !== null ? `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className={`text-right ${getPriceChangeColor(stock.changePercent)}`}>
                        {YahooFinanceService.formatPercent(stock.changePercent, { placeholder: 'N/A' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {YahooFinanceService.formatLargeNumber(stock.volume)}
                      </TableCell>
                      <TableCell className="text-right" title={stock.pe === null ? "ไม่มีข้อมูล" : undefined}>
                        {stock.pe !== null ? stock.pe.toFixed(2) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {YahooFinanceService.formatDisplayPrice(stock.weekHigh52, stock.currency, { placeholder: 'N/A' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {YahooFinanceService.formatDisplayPrice(stock.weekLow52, stock.currency, { placeholder: 'N/A' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getDCAScoreColor(dcaScore)}>
                          {dcaScore}/8
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DCA Simulator */}
      <DCASimulator />
    </div>
  );
};

export default Dashboard;