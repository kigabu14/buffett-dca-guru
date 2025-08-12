-- Patch C: Symbol normalization, unique index for xd_calendar, and additional optimizations

-- 1. Create function to normalize Thai symbols (add .BK suffix if missing)
CREATE OR REPLACE FUNCTION normalize_thai_symbols()
RETURNS void AS $$
BEGIN
    -- Update Thai symbols that don't have .BK suffix
    UPDATE public.stock_markets 
    SET symbol = symbol || '.BK'
    WHERE market = 'SET' 
      AND symbol !~ '\.BK$'
      AND symbol ~ '^[A-Z]{1,6}$';
    
    -- Update any investments table symbols as well
    UPDATE public.stock_investments 
    SET symbol = symbol || '.BK'
    WHERE market = 'SET' 
      AND symbol !~ '\.BK$'
      AND symbol ~ '^[A-Z]{1,6}$';
    
    -- Update xd_calendar symbols
    UPDATE public.xd_calendar 
    SET symbol = symbol || '.BK'
    WHERE symbol !~ '\.BK$'
      AND symbol ~ '^[A-Z]{1,6}$'
      AND EXISTS (
        SELECT 1 FROM public.stock_markets sm 
        WHERE sm.market = 'SET' 
        AND sm.symbol = xd_calendar.symbol || '.BK'
      );
      
    RAISE NOTICE 'Thai symbol normalization completed';
END;
$$ LANGUAGE plpgsql;

-- Execute the symbol normalization
SELECT normalize_thai_symbols();

-- Drop the function after use
DROP FUNCTION normalize_thai_symbols();

-- 2. Add unique index for xd_calendar (symbol, ex_dividend_date)
-- First remove any duplicates that might exist
DELETE FROM public.xd_calendar 
WHERE id NOT IN (
    SELECT DISTINCT ON (symbol, ex_dividend_date) id
    FROM public.xd_calendar
    ORDER BY symbol, ex_dividend_date, created_at DESC
);

-- Create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_xd_calendar_symbol_ex_date 
ON public.xd_calendar(symbol, ex_dividend_date);

-- 3. Ensure all required columns exist with proper types
-- Add any missing columns to stock_markets if they don't exist
ALTER TABLE public.stock_markets 
ADD COLUMN IF NOT EXISTS is_estimated BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON INDEX idx_xd_calendar_symbol_ex_date IS 'Unique constraint for xd_calendar to prevent duplicate dividend records for the same stock and ex-dividend date';

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_xd_calendar_ex_dividend_date 
ON public.xd_calendar(ex_dividend_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_markets_last_updated 
ON public.stock_markets(last_updated DESC);

-- 5. Add validation function for dividend data integrity
CREATE OR REPLACE FUNCTION validate_dividend_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure dividend_amount is positive when provided
    IF NEW.dividend_amount IS NOT NULL AND NEW.dividend_amount < 0 THEN
        RAISE EXCEPTION 'Dividend amount cannot be negative';
    END IF;
    
    -- Ensure dividend_yield is within reasonable range (0-100%)
    IF NEW.dividend_yield IS NOT NULL AND (NEW.dividend_yield < 0 OR NEW.dividend_yield > 100) THEN
        RAISE EXCEPTION 'Dividend yield must be between 0 and 100 percent';
    END IF;
    
    -- Ensure ex_dividend_date is not in the future by more than a year
    IF NEW.ex_dividend_date IS NOT NULL AND NEW.ex_dividend_date > CURRENT_DATE + INTERVAL '1 year' THEN
        RAISE EXCEPTION 'Ex-dividend date cannot be more than a year in the future';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dividend data validation
DROP TRIGGER IF EXISTS validate_dividend_data_trigger ON public.xd_calendar;
CREATE TRIGGER validate_dividend_data_trigger
    BEFORE INSERT OR UPDATE ON public.xd_calendar
    FOR EACH ROW
    EXECUTE FUNCTION validate_dividend_data();

-- Add final comment
COMMENT ON TABLE public.xd_calendar IS 'Ex-dividend calendar with normalized symbols and dividend information';