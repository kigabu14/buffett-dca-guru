
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { YahooFinanceService } from '@/services/YahooFinanceService';

export const YahooFinanceStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [message, setMessage] = useState('กำลังตรวจสอบ...');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    setMessage('กำลังตรวจสอบการเชื่อมต่อ...');
    
    try {
      const result = await YahooFinanceService.checkApiStatus();
      setStatus(result.status);
      setMessage(result.message);
      setLastChecked(new Date());
    } catch (error) {
      setStatus('disconnected');
      setMessage('เกิดข้อผิดพลาดในการตรวจสอบ');
      console.error('Status check error:', error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-accent" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success text-success-foreground">เชื่อมต่อแล้ว</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">ไม่สามารถเชื่อมต่อ</Badge>;
      case 'checking':
        return <Badge variant="secondary">กำลังตรวจสอบ</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบสถานะ</Badge>;
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <div className="font-medium">Yahoo Finance API</div>
              <div className="text-sm text-muted-foreground">{message}</div>
              {lastChecked && (
                <div className="text-xs text-muted-foreground">
                  ตรวจสอบล่าสุด: {lastChecked.toLocaleTimeString('th-TH')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={status === 'checking'}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${status === 'checking' ? 'animate-spin' : ''}`} />
              ตรวจสอบ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
