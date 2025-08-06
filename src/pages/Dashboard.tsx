import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, TrendingDown, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { portfolioStats, recentActivities, loading, refreshData } = useDashboardData();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);

  const runBuffettAnalysis = async () => {
    if (!portfolioStats?.topStocks.length) return;
    
    setAnalyzing(true);
    try {
      // Run Buffett analysis for all stocks in portfolio
      const symbols = portfolioStats.topStocks.map(stock => stock.symbol);
      
      for (const symbol of symbols) {
        try {
          const { error } = await supabase.functions.invoke('buffett-analysis', {
            body: { symbol }
          });
          
          if (error) {
            console.error(`Error analyzing ${symbol}:`, error);
          }
        } catch (err) {
          console.error(`Failed to analyze ${symbol}:`, err);
        }
      }
      
      // Refresh dashboard data after analysis
      await refreshData();
    } catch (error) {
      console.error('Error running Buffett analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            แดชบอร์ด
          </h1>
          <p className="text-muted-foreground">
            ภาพรวมพอร์ตการลงทุนของคุณ
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runBuffettAnalysis} 
            disabled={analyzing || !portfolioStats?.topStocks.length}
            variant="outline"
            className="border-primary/20"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            วิเคราะห์ Buffett
          </Button>
          <Button 
            onClick={() => navigate('/portfolio')}
            className="bg-gradient-premium hover:shadow-gold"
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มหุ้น
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่าพอร์ตรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{loading ? '...' : (portfolioStats?.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              จาก {loading ? '...' : portfolioStats?.totalStocks || 0} หุ้น
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน</CardTitle>
            {(portfolioStats?.totalGainLoss || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(portfolioStats?.totalGainLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {loading ? '...' : (
                <>
                  {(portfolioStats?.totalGainLoss || 0) >= 0 ? '+' : ''}฿{(portfolioStats?.totalGainLoss || 0).toLocaleString()}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : (
                <>
                  {(portfolioStats?.gainLossPercentage || 0) >= 0 ? '+' : ''}{(portfolioStats?.gainLossPercentage || 0).toFixed(2)}%
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินปันผล/ปี</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : (portfolioStats?.totalDividendYield || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราผลตอบแทนเฉลี่ย
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนน Buffett เฉลี่ย</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : Math.round(portfolioStats?.averageBuffettScore || 0)}/55
            </div>
            <p className="text-xs text-muted-foreground">
              คุณภาพโดยรวม: {
                loading ? '...' : 
                (portfolioStats?.averageBuffettScore || 0) >= 40 ? 'ดีเยี่ยม' :
                (portfolioStats?.averageBuffettScore || 0) >= 30 ? 'ดี' :
                (portfolioStats?.averageBuffettScore || 0) >= 20 ? 'ปานกลาง' : 'ควรปรับปรุง'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Distribution & Top Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Holdings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>หุ้นใหญ่ในพอร์ต</CardTitle>
            <CardDescription>หุ้นที่มีสัดส่วนมากที่สุด</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground">กำลังโหลด...</div>
            ) : portfolioStats?.topStocks.length ? (
              portfolioStats.topStocks.slice(0, 5).map((stock, index) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-premium flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">฿{stock.value.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{stock.percentage.toFixed(1)}%</p>
                      <Badge 
                        variant={stock.gainLoss >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {stock.gainLoss >= 0 ? '+' : ''}{stock.gainLossPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                ยังไม่มีการลงทุน กรุณาเพิ่มหุ้นในพอร์ต
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buffett Score Summary */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>คะแนน Buffett Analysis</CardTitle>
            <CardDescription>การวิเคราะห์ตามหลักการ Warren Buffett</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground">กำลังโหลด...</div>
            ) : portfolioStats?.topStocks.length ? (
              portfolioStats.topStocks.slice(0, 5).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-premium rounded-full transition-all duration-300"
                          style={{ width: `${(stock.buffettScore / 55) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{stock.buffettScore}/55</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {stock.buffettScore >= 40 ? 'DCA เพิ่ม' : stock.buffettScore >= 30 ? 'ถือไว้' : 'ลด/ขาย'}
                      </p>
                      <Badge 
                        variant={
                          stock.buffettScore >= 40 ? "default" : 
                          stock.buffettScore >= 30 ? "secondary" : "destructive"
                        }
                        className="text-xs"
                      >
                        {stock.buffettScore >= 40 ? 'BUY' : stock.buffettScore >= 30 ? 'HOLD' : 'SELL'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                ยังไม่มีข้อมูลการวิเคราะห์ กรุณากดปุ่ม "วิเคราะห์ Buffett"
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
          <CardDescription>การซื้อขายและการเปลี่ยนแปลงในพอร์ต</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground">กำลังโหลด...</div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                ยังไม่มีกิจกรรมการลงทุน
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;