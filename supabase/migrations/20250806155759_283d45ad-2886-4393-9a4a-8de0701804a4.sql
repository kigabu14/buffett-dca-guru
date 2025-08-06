-- Create XD calendar table for dividend ex-dates
CREATE TABLE IF NOT EXISTS public.xd_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  ex_dividend_date DATE NOT NULL,
  record_date DATE,
  payment_date DATE,
  dividend_amount NUMERIC NOT NULL,
  dividend_yield NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for XD calendar
ALTER TABLE public.xd_calendar ENABLE ROW LEVEL SECURITY;

-- Create policy for XD calendar - readable by everyone
CREATE POLICY "XD calendar is readable by everyone" 
ON public.xd_calendar 
FOR SELECT 
USING (true);

-- Create dividend history table
CREATE TABLE IF NOT EXISTS public.dividend_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  ex_dividend_date DATE NOT NULL,
  announcement_date DATE,
  payment_date DATE,
  dividend_amount NUMERIC NOT NULL,
  dividend_type TEXT NOT NULL DEFAULT 'CASH',
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for dividend history
ALTER TABLE public.dividend_history ENABLE ROW LEVEL SECURITY;

-- Create policy for dividend history - readable by everyone
CREATE POLICY "Dividend history is readable by everyone" 
ON public.dividend_history 
FOR SELECT 
USING (true);

-- Create trigger for dividend history updated_at
CREATE TRIGGER update_dividend_history_updated_at
BEFORE UPDATE ON public.dividend_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create buffett analysis table
CREATE TABLE IF NOT EXISTS public.buffett_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_score INTEGER,
  recommendation TEXT,
  
  -- Financial ratios
  roe_percentage NUMERIC,
  debt_equity_ratio NUMERIC,
  net_profit_margin NUMERIC,
  free_cash_flow NUMERIC,
  eps_growth NUMERIC,
  operating_margin NUMERIC,
  current_ratio NUMERIC,
  roa_percentage NUMERIC,
  current_price NUMERIC,
  
  -- Individual scores (1-5 each)
  roe_score INTEGER,
  debt_equity_ratio_score INTEGER,
  net_profit_margin_score INTEGER,
  free_cash_flow_score INTEGER,
  eps_growth_score INTEGER,
  operating_margin_score INTEGER,
  current_ratio_score INTEGER,
  share_dilution_score INTEGER,
  roa_score INTEGER,
  moat_score INTEGER,
  management_score INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for buffett analysis
ALTER TABLE public.buffett_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for buffett analysis - readable by everyone
CREATE POLICY "Buffett analysis is readable by everyone" 
ON public.buffett_analysis 
FOR SELECT 
USING (true);

-- Create trigger for buffett analysis updated_at
CREATE TRIGGER update_buffett_analysis_updated_at
BEFORE UPDATE ON public.buffett_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();