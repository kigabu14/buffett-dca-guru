import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, TrendingDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  // Mock data - ในการใช้งานจริงจะดึงจากฐานข้อมูล
  const portfolioStats = {
    totalValue: 125000,
    totalGainLoss: 12500,
    gainLossPercentage: 11.11,
    dividendYield: 4.2,
    totalStocks: 8
  };

  const topStocks = [
    { symbol: 'ADVANC', name: 'แอดวานซ์ อินโฟร์ เซอร์วิส', value: 25000, percentage: 20, buffettScore: 42 },
    { symbol: 'BBL', name: 'ธนาคารกรุงเทพ', value: 20000, percentage: 16, buffettScore: 38 },
    { symbol: 'KBANK', name: 'ธนาคารกสิกรไทย', value: 18000, percentage: 14.4, buffettScore: 40 },
  ];

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
        <Button className="bg-gradient-premium hover:shadow-gold">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มหุ้น
        </Button>
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
              ฿{portfolioStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              จาก {portfolioStats.totalStocks} หุ้น
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร/ขาดทุน</CardTitle>
            {portfolioStats.totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolioStats.totalGainLoss >= 0 ? '+' : ''}฿{portfolioStats.totalGainLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioStats.gainLossPercentage >= 0 ? '+' : ''}{portfolioStats.gainLossPercentage.toFixed(2)}%
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
              {portfolioStats.dividendYield}%
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
              40/55
            </div>
            <p className="text-xs text-muted-foreground">
              คุณภาพโดยรวม: ดี
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
            {topStocks.map((stock, index) => (
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
                  <p className="text-sm text-muted-foreground">{stock.percentage}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Buffett Score Summary */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>คะแนน Buffett Analysis</CardTitle>
            <CardDescription>การวิเคราะห์ตามหลักการ Warren Buffett</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topStocks.map((stock) => (
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
                  <p className="text-xs text-muted-foreground">
                    {stock.buffettScore >= 40 ? 'DCA เพิ่ม' : stock.buffettScore >= 30 ? 'ถือไว้' : 'ลด/ขาย'}
                  </p>
                </div>
              </div>
            ))}
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">ซื้อ ADVANC</p>
                  <p className="text-sm text-muted-foreground">100 หุ้น @ ฿250</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">2 วันที่แล้ว</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">เงินปันผล BBL</p>
                  <p className="text-sm text-muted-foreground">฿0.75 ต่อหุ้น</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">1 สัปดาห์ที่แล้ว</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;