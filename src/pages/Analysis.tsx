import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Brain, RefreshCw, Target, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DividendCalendar } from '@/components/DividendCalendar';

interface BuffettAnalysis {
  id: string;
  symbol: string;
  analysis_date: string;
  total_score: number | null;
  recommendation: string | null;
  roe_percentage: number | null;
  debt_equity_ratio: number | null;
  net_profit_margin: number | null;
  free_cash_flow: number | null;
  eps_growth: number | null;
  operating_margin: number | null;
  current_ratio: number | null;
  roa_percentage: number | null;
  current_price: number | null;
  roe_score: number | null;
  debt_equity_ratio_score: number | null;
  net_profit_margin_score: number | null;
  free_cash_flow_score: number | null;
  eps_growth_score: number | null;
  operating_margin_score: number | null;
  current_ratio_score: number | null;
  share_dilution_score: number | null;
  roa_score: number | null;
  moat_score: number | null;
  management_score: number | null;
}

interface StockInvestment {
  symbol: string;
  company_name: string | null;
  quantity: number;
}

const Analysis = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<BuffettAnalysis[]>([]);
  const [userStocks, setUserStocks] = useState<StockInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's stocks
      const { data: investments, error: investmentsError } = await supabase
        .from('stock_investments')
        .select('symbol, company_name, quantity')
        .eq('user_id', user.id);

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
        return;
      }

      // Group by symbol
      const stockMap = new Map<string, StockInvestment>();
      investments?.forEach(inv => {
        if (stockMap.has(inv.symbol)) {
          const existing = stockMap.get(inv.symbol)!;
          stockMap.set(inv.symbol, {
            ...existing,
            quantity: existing.quantity + inv.quantity
          });
        } else {
          stockMap.set(inv.symbol, {
            symbol: inv.symbol,
            company_name: inv.company_name,
            quantity: inv.quantity
          });
        }
      });

      const stocks = Array.from(stockMap.values());
      setUserStocks(stocks);

      if (stocks.length > 0) {
        // Fetch Buffett analyses for user's stocks
        const symbols = stocks.map(s => s.symbol);
        const { data: analysisData, error: analysisError } = await supabase
          .from('buffett_analysis')
          .select('*')
          .in('symbol', symbols)
          .order('analysis_date', { ascending: false });

        if (analysisError) {
          console.error('Error fetching analyses:', analysisError);
        } else {
          // Get latest analysis for each symbol
          const latestAnalyses = new Map<string, BuffettAnalysis>();
          analysisData?.forEach(analysis => {
            if (!latestAnalyses.has(analysis.symbol)) {
              latestAnalyses.set(analysis.symbol, analysis);
            }
          });
          setAnalyses(Array.from(latestAnalyses.values()));
        }
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBuffettAnalysis = async () => {
    if (userStocks.length === 0) return;
    
    setAnalyzing(true);
    try {
      const symbols = userStocks.map(stock => stock.symbol);
      
      for (const symbol of symbols) {
        try {
          const { error } = await supabase.functions.invoke('buffett-analysis', {
            body: { symbol }
          });
          
          if (error) {
            console.error(`Error analyzing ${symbol}:`, error);
          } else {
            console.log(`Successfully analyzed ${symbol}`);
          }
        } catch (err) {
          console.error(`Failed to analyze ${symbol}:`, err);
        }
      }
      
      // Refresh data after analysis
      await fetchData();
    } catch (error) {
      console.error('Error running Buffett analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRecommendationBadge = (recommendation: string | null, score: number | null) => {
    if (!recommendation || !score) return <Badge variant="outline">ไม่มีข้อมูล</Badge>;
    
    switch (recommendation) {
      case 'DCA_MORE':
        return <Badge variant="default" className="bg-green-500">DCA เพิ่ม</Badge>;
      case 'HOLD':
        return <Badge variant="secondary">ถือไว้</Badge>;
      case 'REDUCE_SELL':
        return <Badge variant="destructive">ลด/ขาย</Badge>;
      default:
        return <Badge variant="outline">{recommendation}</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-muted';
    if (score >= 40) return 'bg-green-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  if (userStocks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent mb-4">
            การวิเคราะห์ Buffett
          </h1>
          <p className="text-muted-foreground">
            ยังไม่มีหุ้นในพอร์ต กรุณาเพิ่มหุ้นก่อนเพื่อเริ่มการวิเคราะห์
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            การวิเคราะห์ Buffett
          </h1>
          <p className="text-muted-foreground">
            วิเคราะห์หุ้นตามหลักการลงทุนของ Warren Buffett
          </p>
        </div>
        <Button 
          onClick={runBuffettAnalysis} 
          disabled={analyzing}
          className="bg-gradient-premium hover:shadow-gold"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ทั้งหมด'}
        </Button>
      </div>

      {/* Analysis Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              สรุปผลการวิเคราะห์
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">หุ้นที่แนะนำซื้อเพิ่ม:</span>
                <span className="font-bold text-green-500">
                  {analyses.filter(a => a.recommendation === 'DCA_MORE').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">หุ้นที่แนะนำถือไว้:</span>
                <span className="font-bold text-yellow-500">
                  {analyses.filter(a => a.recommendation === 'HOLD').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">หุ้นที่แนะนำลด/ขาย:</span>
                <span className="font-bold text-red-500">
                  {analyses.filter(a => a.recommendation === 'REDUCE_SELL').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">คะแนนเฉลี่ย:</span>
                <span className="font-bold">
                  {analyses.length > 0
                    ? Math.round(analyses.reduce((sum, a) => sum + (a.total_score || 0), 0) / analyses.length)
                    : 0
                  }/55
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <DividendCalendar />
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>รายละเอียดการวิเคราะห์</CardTitle>
          <CardDescription>คะแนนและคำแนะนำสำหรับแต่ละหุ้น</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หุ้น</TableHead>
                <TableHead>คะแนนรวม</TableHead>
                <TableHead>ROE</TableHead>
                <TableHead>D/E Ratio</TableHead>
                <TableHead>Profit Margin</TableHead>
                <TableHead>คำแนะนำ</TableHead>
                <TableHead>วันที่วิเคราะห์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStocks.map((stock) => {
                const analysis = analyses.find(a => a.symbol === stock.symbol);
                return (
                  <TableRow key={stock.symbol}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {stock.company_name || stock.symbol}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${getScoreColor(analysis?.total_score)}`}
                            style={{ width: `${((analysis?.total_score || 0) / 55) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {analysis?.total_score || 0}/55
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {analysis?.roe_percentage ? `${analysis.roe_percentage.toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {analysis?.debt_equity_ratio ? analysis.debt_equity_ratio.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {analysis?.net_profit_margin ? `${analysis.net_profit_margin.toFixed(1)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getRecommendationBadge(analysis?.recommendation, analysis?.total_score)}
                    </TableCell>
                    <TableCell>
                      {analysis?.analysis_date 
                        ? new Date(analysis.analysis_date).toLocaleDateString('th-TH')
                        : 'ยังไม่ได้วิเคราะห์'
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;