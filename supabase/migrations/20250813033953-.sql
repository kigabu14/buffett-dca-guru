-- Add 52-week high/low columns to stock_markets for storing Yahoo data
ALTER TABLE public.stock_markets
  ADD COLUMN IF NOT EXISTS week_high_52 numeric,
  ADD COLUMN IF NOT EXISTS week_low_52 numeric;