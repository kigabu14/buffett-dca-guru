import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { YahooFinanceService } from "@/services/YahooFinanceService";
import { useToast } from "@/hooks/use-toast";
import { Wifi, WifiOff, Loader2, CheckCircle, XCircle } from "lucide-react";

export const YahooFinanceStatus = () => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const result = await YahooFinanceService.checkApiStatus();
      setStatus(result.status);
      setLastCheck(new Date());
      
      toast({
        title: result.status === 'connected' ? "เชื่อมต่อสำเร็จ" : "เชื่อมต่อไม่ได้",
        description: result.message,
        variant: result.status === 'connected' ? "default" : "destructive"
      });
    } catch (error) {
      setStatus('disconnected');
      setLastCheck(new Date());
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบสถานะ Yahoo Finance API ได้",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = () => {
    if (checking) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">เชื่อมต่อแล้ว</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">ไม่ได้เชื่อมต่อ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบสถานะ</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          สถานะ Yahoo Finance API
        </CardTitle>
        <CardDescription>
          ตรวจสอบการเชื่อมต่อกับ Yahoo Finance API สำหรับข้อมูลหุ้นแบบเรียลไทม์
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {lastCheck && (
              <span className="text-sm text-muted-foreground">
                ตรวจสอบล่าสุด: {lastCheck.toLocaleTimeString('th-TH')}
              </span>
            )}
          </div>
          <Button 
            onClick={checkStatus} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                ตรวจสอบสถานะ
              </>
            )}
          </Button>
        </div>
        
        {status === 'disconnected' && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="text-sm font-semibold text-destructive mb-2">
              ไม่สามารถเชื่อมต่อกับ Yahoo Finance API ได้
            </h4>
            <p className="text-sm text-muted-foreground">
              • ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต<br/>
              • Yahoo Finance อาจมีปัญหาชั่วคราว<br/>
              • ลองใหม่อีกครั้งในภายหลัง
            </p>
          </div>
        )}
        
        {status === 'connected' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              เชื่อมต่อกับ Yahoo Finance API สำเร็จ
            </h4>
            <p className="text-sm text-green-700">
              ระบบสามารถดึงข้อมูลหุ้นแบบเรียลไทม์ได้ปกติ
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};