-- Extend stock_markets with ETF/fund metrics and sparkline data
ALTER TABLE public.stock_markets
  ADD COLUMN IF NOT EXISTS total_assets numeric,
  ADD COLUMN IF NOT EXISTS expense_ratio numeric,
  ADD COLUMN IF NOT EXISTS trailing_return_1y numeric,
  ADD COLUMN IF NOT EXISTS trailing_return_3y numeric,
  ADD COLUMN IF NOT EXISTS trailing_return_5y numeric,
  ADD COLUMN IF NOT EXISTS exchange text,
  ADD COLUMN IF NOT EXISTS is_etf boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fund_category text,
  ADD COLUMN IF NOT EXISTS sparkline jsonb;