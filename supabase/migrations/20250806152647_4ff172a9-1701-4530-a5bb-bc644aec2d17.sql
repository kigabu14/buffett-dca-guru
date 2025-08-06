-- เพิ่มตารางสำหรับการวิเคราะห์ Buffett Score
CREATE TABLE public.buffett_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 11 เกณฑ์ของ Warren Buffett (คะแนน 1-5 แต่ละข้อ)
  roe_score INTEGER CHECK (roe_score >= 1 AND roe_score <= 5),
  debt_equity_ratio_score INTEGER CHECK (debt_equity_ratio_score >= 1 AND debt_equity_ratio_score <= 5),
  net_profit_margin_score INTEGER CHECK (net_profit_margin_score >= 1 AND net_profit_margin_score <= 5),
  free_cash_flow_score INTEGER CHECK (free_cash_flow_score >= 1 AND free_cash_flow_score <= 5),
  eps_growth_score INTEGER CHECK (eps_growth_score >= 1 AND eps_growth_score <= 5),
  operating_margin_score INTEGER CHECK (operating_margin_score >= 1 AND operating_margin_score <= 5),
  current_ratio_score INTEGER CHECK (current_ratio_score >= 1 AND current_ratio_score <= 5),
  share_dilution_score INTEGER CHECK (share_dilution_score >= 1 AND share_dilution_score <= 5),
  roa_score INTEGER CHECK (roa_score >= 1 AND roa_score <= 5),
  moat_score INTEGER CHECK (moat_score >= 1 AND moat_score <= 5),
  management_score INTEGER CHECK (management_score >= 1 AND management_score <= 5),
  
  -- คะแนนรวม (จาก 55 คะแนน)
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(roe_score, 0) + COALESCE(debt_equity_ratio_score, 0) + 
    COALESCE(net_profit_margin_score, 0) + COALESCE(free_cash_flow_score, 0) + 
    COALESCE(eps_growth_score, 0) + COALESCE(operating_margin_score, 0) + 
    COALESCE(current_ratio_score, 0) + COALESCE(share_dilution_score, 0) + 
    COALESCE(roa_score, 0) + COALESCE(moat_score, 0) + COALESCE(management_score, 0)
  ) STORED,
  
  -- คำแนะนำ
  recommendation TEXT CHECK (recommendation IN ('DCA_MORE', 'HOLD', 'REDUCE_SELL')),
  
  -- ข้อมูลทางการเงินที่ใช้ในการวิเคราะห์
  current_price NUMERIC,
  roe_percentage NUMERIC,
  debt_equity_ratio NUMERIC,
  net_profit_margin NUMERIC,
  free_cash_flow NUMERIC,
  eps_growth NUMERIC,
  operating_margin NUMERIC,
  current_ratio NUMERIC,
  roa_percentage NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เพิ่มตารางประวัติเงินปันผล
CREATE TABLE public.dividend_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  ex_dividend_date DATE NOT NULL,
  dividend_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  dividend_type TEXT NOT NULL DEFAULT 'CASH', -- CASH, STOCK, SPECIAL
  announcement_date DATE,
  payment_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(symbol, ex_dividend_date, dividend_type)
);

-- เพิ่มตารางปฏิทิน XD
CREATE TABLE public.xd_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  ex_dividend_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE,
  dividend_amount NUMERIC NOT NULL,
  dividend_yield NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(symbol, ex_dividend_date)
);

-- เพิ่มตารางการแจ้งเตือน
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DCA_OPPORTUNITY', 'DIVIDEND_REMINDER', 'BUFFETT_SCORE_UPDATE', 'PRICE_ALERT')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  symbol TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- เพิ่มตารางการตั้งค่าการแจ้งเตือน
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- การแจ้งเตือนผ่าน LINE
  line_notify_token TEXT,
  line_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- การแจ้งเตือนผ่าน Telegram
  telegram_chat_id TEXT,
  telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- การตั้งค่าการแจ้งเตือน
  dca_opportunity_enabled BOOLEAN NOT NULL DEFAULT true,
  dividend_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  buffett_score_update_enabled BOOLEAN NOT NULL DEFAULT true,
  price_alert_enabled BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เพิ่มตารางการตั้งค่าราคาแจ้งเตือน
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('ABOVE', 'BELOW')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เพิ่ม RLS policies
ALTER TABLE public.buffett_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xd_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับ buffett_analysis (ข้อมูลสาธารณะ - อ่านได้ทุกคน)
CREATE POLICY "Buffett analysis is readable by everyone" 
ON public.buffett_analysis 
FOR SELECT 
USING (true);

-- Policies สำหรับ dividend_history (ข้อมูลสาธารณะ - อ่านได้ทุกคน)
CREATE POLICY "Dividend history is readable by everyone" 
ON public.dividend_history 
FOR SELECT 
USING (true);

-- Policies สำหรับ xd_calendar (ข้อมูลสาธารณะ - อ่านได้ทุกคน)
CREATE POLICY "XD calendar is readable by everyone" 
ON public.xd_calendar 
FOR SELECT 
USING (true);

-- Policies สำหรับ notifications (เฉพาะผู้ใช้เจ้าของ)
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies สำหรับ notification_settings (เฉพาะผู้ใช้เจ้าของ)
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies สำหรับ price_alerts (เฉพาะผู้ใช้เจ้าของ)
CREATE POLICY "Users can view their own price alerts" 
ON public.price_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts" 
ON public.price_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts" 
ON public.price_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts" 
ON public.price_alerts 
FOR DELETE 
USING (auth.uid() = user_id);

-- เพิ่ม indexes เพื่อประสิทธิภาพ
CREATE INDEX idx_buffett_analysis_symbol_date ON public.buffett_analysis(symbol, analysis_date DESC);
CREATE INDEX idx_dividend_history_symbol_date ON public.dividend_history(symbol, ex_dividend_date DESC);
CREATE INDEX idx_xd_calendar_date ON public.xd_calendar(ex_dividend_date);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_price_alerts_user_active ON public.price_alerts(user_id, is_active) WHERE is_active = true;

-- เพิ่ม triggers สำหรับ updated_at
CREATE TRIGGER update_buffett_analysis_updated_at
BEFORE UPDATE ON public.buffett_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dividend_history_updated_at
BEFORE UPDATE ON public.dividend_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_alerts_updated_at
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ปรับปรุงตาราง stock_investments เพื่อเพิ่มข้อมูลเงินปันผล
ALTER TABLE public.stock_investments 
ADD COLUMN IF NOT EXISTS dividend_received NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS dividend_yield_at_purchase NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT;