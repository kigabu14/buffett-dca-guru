-- Add is_estimated column to track fallback/fabricated values
ALTER TABLE public.stock_markets 
ADD COLUMN IF NOT EXISTS is_estimated BOOLEAN DEFAULT false;

-- Remove legacy seed/mock data that may have Thai company names or null last_updated
DELETE FROM public.stock_markets 
WHERE (company_name LIKE 'บริษัท%' AND last_updated IS NULL)
   OR (created_at < '2025-08-01'::date AND last_updated IS NULL);

-- Add comment to clarify is_estimated usage
COMMENT ON COLUMN public.stock_markets.is_estimated IS 'Indicates if any financial metrics were estimated/fabricated due to missing Yahoo Finance data';

-- Create index for querying estimated vs real data
CREATE INDEX IF NOT EXISTS idx_stock_markets_is_estimated ON public.stock_markets(is_estimated, last_updated DESC);