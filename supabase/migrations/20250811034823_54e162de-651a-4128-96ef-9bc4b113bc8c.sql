-- Add Yahoo Finance price fetching support to stock_investments table
-- This migration adds columns and triggers to support automatic price updates from Yahoo Finance

-- Add missing columns to stock_investments table (current_price already exists)
ALTER TABLE public.stock_investments 
ADD COLUMN IF NOT EXISTS previous_close NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS yahoo_symbol TEXT,
ADD COLUMN IF NOT EXISTS price_last_fetched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_dividend_yield NUMERIC;

-- Create index on (symbol, market) for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stock_investments_symbol_market 
ON public.stock_investments(symbol, market);

-- Function to set yahoo_symbol based on market rules
CREATE OR REPLACE FUNCTION set_yahoo_symbol()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate yahoo_symbol based on market if not provided
    IF NEW.yahoo_symbol IS NULL THEN
        CASE NEW.market
            WHEN 'TH' THEN 
                NEW.yahoo_symbol := NEW.symbol || '.BK';
            WHEN 'JP' THEN 
                NEW.yahoo_symbol := NEW.symbol || '.T';
            WHEN 'US' THEN 
                NEW.yahoo_symbol := NEW.symbol;
            ELSE 
                NEW.yahoo_symbol := NEW.symbol;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate yahoo_symbol on INSERT or UPDATE
CREATE TRIGGER set_yahoo_symbol_trigger
    BEFORE INSERT OR UPDATE ON public.stock_investments
    FOR EACH ROW
    EXECUTE FUNCTION set_yahoo_symbol();

-- Update existing records to set yahoo_symbol if missing
UPDATE public.stock_investments 
SET yahoo_symbol = CASE 
    WHEN market = 'TH' THEN symbol || '.BK'
    WHEN market = 'JP' THEN symbol || '.T'
    WHEN market = 'US' THEN symbol
    ELSE symbol
END
WHERE yahoo_symbol IS NULL;