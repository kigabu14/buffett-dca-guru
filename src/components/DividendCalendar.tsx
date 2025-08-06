import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface XDEvent {
  id: string;
  symbol: string;
  ex_dividend_date: string;
  record_date: string | null;
  payment_date: string | null;
  dividend_amount: number;
  dividend_yield: number | null;
}

interface UserStock {
  symbol: string;
  quantity: number;
}

const DividendCalendar = () => {
  const { user } = useAuth();
  const [xdEvents, setXdEvents] = useState<XDEvent[]>([]);
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select('symbol, quantity')
        .eq('user_id', user.id);

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
        return;
      }

      // Group by symbol and sum quantities
      const stockMap = new Map<string, number>();
      investments?.forEach(inv => {
        const current = stockMap.get(inv.symbol) || 0;
        stockMap.set(inv.symbol, current + inv.quantity);
      });

      const stocks = Array.from(stockMap.entries()).map(([symbol, quantity]) => ({
        symbol,
        quantity
      }));
      setUserStocks(stocks);

      if (stocks.length > 0) {
        // Fetch XD calendar for user's stocks
        const symbols = stocks.map(s => s.symbol);
        const { data: xdData, error: xdError } = await supabase
          .from('xd_calendar')
          .select('*')
          .in('symbol', symbols)
          .gte('ex_dividend_date', new Date().toISOString().split('T')[0])
          .order('ex_dividend_date', { ascending: true })
          .limit(20);

        if (xdError) {
          console.error('Error fetching XD calendar:', xdError);
        } else {
          setXdEvents(xdData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dividend calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedDividend = (symbol: string, dividendAmount: number) => {
    const stock = userStocks.find(s => s.symbol === symbol);
    return stock ? stock.quantity * dividendAmount : 0;
  };

  const getDateStatus = (exDividendDate: string) => {
    const today = new Date();
    const exDate = new Date(exDividendDate);
    const diffDays = Math.ceil((exDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'past', color: 'secondary', text: 'ผ่านไปแล้ว' };
    if (diffDays === 0) return { status: 'today', color: 'destructive', text: 'วันนี้' };
    if (diffDays <= 7) return { status: 'soon', color: 'default', text: `อีก ${diffDays} วัน` };
    return { status: 'future', color: 'outline', text: `อีก ${diffDays} วัน` };
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ปฏิทิน XD
          </CardTitle>
          <CardDescription>วันจ่ายเงินปันผลของหุ้นในพอร์ต</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  if (userStocks.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ปฏิทิน XD
          </CardTitle>
          <CardDescription>วันจ่ายเงินปันผลของหุ้นในพอร์ต</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            ยังไม่มีหุ้นในพอร์ต กรุณาเพิ่มหุ้นก่อน
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          ปฏิทิน XD
        </CardTitle>
        <CardDescription>วันจ่ายเงินปันผลของหุ้นในพอร์ต</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {xdEvents.length > 0 ? (
          xdEvents.map((event) => {
            const dateStatus = getDateStatus(event.ex_dividend_date);
            const expectedDividend = calculateExpectedDividend(event.symbol, event.dividend_amount);
            
            return (
              <div key={event.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{new Date(event.ex_dividend_date).getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.ex_dividend_date).toLocaleDateString('th-TH', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{event.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      เงินปันผล ฿{event.dividend_amount.toFixed(2)} ต่อหุ้น
                    </div>
                    {event.dividend_yield && (
                      <div className="text-xs text-muted-foreground">
                        Yield: {event.dividend_yield.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={dateStatus.color as any} className="text-xs">
                    {dateStatus.text}
                  </Badge>
                  {expectedDividend > 0 && (
                    <div className="flex items-center text-sm font-semibold text-primary">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ฿{expectedDividend.toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    XD: {new Date(event.ex_dividend_date).toLocaleDateString('th-TH')}
                  </div>
                  {event.payment_date && (
                    <div className="text-xs text-muted-foreground">
                      จ่าย: {new Date(event.payment_date).toLocaleDateString('th-TH')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground">
            ไม่มีข้อมูลเงินปันผลที่จะมาถึง
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DividendCalendar;