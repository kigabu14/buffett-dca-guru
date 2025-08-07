import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns';
import { th } from 'date-fns/locale';

interface XDEvent {
  id: string;
  symbol: string;
  ex_dividend_date: string;
  payment_date: string | null;
  dividend_amount: number;
  dividend_yield: number | null;
}

interface UserStock {
  symbol: string;
  quantity: number;
}

export const DividendCalendar = () => {
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
    try {
      setLoading(true);
      
      // Fetch user's stock investments
      const { data: stocksData, error: stocksError } = await supabase
        .from('stock_investments')
        .select('symbol, quantity')
        .eq('user_id', user?.id);

      if (stocksError) throw stocksError;
      setUserStocks(stocksData || []);

      if (stocksData && stocksData.length > 0) {
        const symbols = stocksData.map(stock => stock.symbol);
        
        // Fetch upcoming XD events for user's stocks
        const { data: xdData, error: xdError } = await supabase
          .from('xd_calendar')
          .select('*')
          .in('symbol', symbols)
          .gte('ex_dividend_date', new Date().toISOString().split('T')[0])
          .order('ex_dividend_date', { ascending: true })
          .limit(10);

        if (xdError) throw xdError;
        setXdEvents(xdData || []);
      }
    } catch (error) {
      console.error('Error fetching dividend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedDividend = (symbol: string, dividendAmount: number): number => {
    const userStock = userStocks.find(stock => stock.symbol === symbol);
    return userStock ? userStock.quantity * dividendAmount : 0;
  };

  const getDateStatus = (exDividendDate: string) => {
    const xdDate = parseISO(exDividendDate);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(xdDate, today)) {
      return { status: 'past', color: 'bg-gray-100 text-gray-600', label: 'ผ่านแล้ว' };
    } else if (isBefore(xdDate, threeDaysFromNow)) {
      return { status: 'imminent', color: 'bg-yellow-100 text-yellow-800', label: 'ใกล้จะถึง' };
    } else {
      return { status: 'upcoming', color: 'bg-green-100 text-green-800', label: 'กำลังจะมา' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ปฏิทินเงินปันผล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">กำลังโหลดข้อมูล...</div>
        </CardContent>
      </Card>
    );
  }

  if (userStocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ปฏิทินเงินปันผล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            ไม่มีหุ้นในพอร์ต กรุณาเพิ่มหุ้นก่อนดูปฏิทินเงินปันผล
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          ปฏิทินเงินปันผล
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          วันปันผลของหุ้นในพอร์ตของคุณ
        </p>
      </CardHeader>
      <CardContent>
        {xdEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            ไม่มีข้อมูลเงินปันผลสำหรับหุ้นในพอร์ตของคุณ
          </div>
        ) : (
          <div className="space-y-4">
            {xdEvents.map((event) => {
              const dateStatus = getDateStatus(event.ex_dividend_date);
              const expectedDividend = calculateExpectedDividend(event.symbol, event.dividend_amount);
              
              return (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-medium">
                        {event.symbol}
                      </Badge>
                      <Badge className={dateStatus.color}>
                        {dateStatus.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>วัน XD: {format(parseISO(event.ex_dividend_date), 'dd MMM yyyy', { locale: th })}</span>
                      </div>
                      
                      {event.payment_date && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>วันจ่าย: {format(parseISO(event.payment_date), 'dd MMM yyyy', { locale: th })}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>อัตราปันผล: ฿{event.dividend_amount} ต่อหุ้น</span>
                        {event.dividend_yield && (
                          <span className="text-green-600">({event.dividend_yield.toFixed(2)}%)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">
                      ฿{expectedDividend.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ปันผลที่คาดว่าจะได้รับ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};