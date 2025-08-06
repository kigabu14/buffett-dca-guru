-- เพิ่ม policies ที่ขาดหายไปสำหรับ notifications
CREATE POLICY "System can create notifications for users" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- ปรับปรุงตาราง stock_investments เพื่อเพิ่มข้อมูลเงินปันผล
ALTER TABLE public.stock_investments 
ADD COLUMN IF NOT EXISTS dividend_received NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS dividend_yield_at_purchase NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- เพิ่มตารางสำหรับการติดตามตลาดหุ้น
CREATE TABLE IF NOT EXISTS public.stock_markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('SET', 'NASDAQ', 'NYSE', 'SP500')),
  sector TEXT,
  industry TEXT,
  
  -- ข้อมูลราคาปัจจุบัน
  current_price NUMERIC,
  previous_close NUMERIC,
  open_price NUMERIC,
  day_high NUMERIC,
  day_low NUMERIC,
  volume BIGINT,
  
  -- ข้อมูลเพิ่มเติม
  market_cap NUMERIC,
  pe_ratio NUMERIC,
  eps NUMERIC,
  dividend_yield NUMERIC,
  
  -- วันที่อัพเดทล่าสุด
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เพิ่ม RLS policy สำหรับ stock_markets (ข้อมูลสาธารณะ)
ALTER TABLE public.stock_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock market data is readable by everyone" 
ON public.stock_markets 
FOR SELECT 
USING (true);

-- เพิ่ม index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_stock_markets_symbol ON public.stock_markets(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_markets_market ON public.stock_markets(market);
CREATE INDEX IF NOT EXISTS idx_stock_markets_updated ON public.stock_markets(last_updated DESC);

-- เพิ่ม trigger สำหรับ updated_at
CREATE TRIGGER update_stock_markets_updated_at
BEFORE UPDATE ON public.stock_markets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- เพิ่มข้อมูลตัวอย่างหุ้นไทยยอดนิยม
INSERT INTO public.stock_markets (symbol, company_name, market, sector) VALUES
('ADVANC', 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)', 'SET', 'Technology'),
('BBL', 'ธนาคารกรุงเทพ จำกัด (มหาชน)', 'SET', 'Banking'),
('CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)', 'SET', 'Commerce'),
('CPF', 'บริษัท เจริญโภคภัณฑ์อาหาร จำกัด (มหาชน)', 'SET', 'Agro & Food Industry'),
('KBANK', 'ธนาคารกสิกรไทย จำกัด (มหาชน)', 'SET', 'Banking'),
('KTB', 'ธนาคารกรุงไทย จำกัด (มหาชน)', 'SET', 'Banking'),
('SCB', 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', 'SET', 'Banking'),
('TTB', 'ธนาคารทหารไทยธนชาต จำกัด (มหาชน)', 'SET', 'Banking'),
('PTTEP', 'บริษัท ปตท.สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)', 'SET', 'Energy & Utilities'),
('TOP', 'บริษัท ไทยออยล์ จำกัด (มหาชน)', 'SET', 'Energy & Utilities')
ON CONFLICT (symbol) DO NOTHING;