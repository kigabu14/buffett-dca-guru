-- Function to combine duplicate stock investments for each user
CREATE OR REPLACE FUNCTION combine_duplicate_investments()
RETURNS void AS $$
DECLARE
    inv_record RECORD;
    duplicate_record RECORD;
    combined_quantity NUMERIC;
    combined_commission NUMERIC;
    combined_dividend_received NUMERIC;
    total_cost_existing NUMERIC;
    total_cost_duplicate NUMERIC;
    average_buy_price NUMERIC;
    weighted_dividend_yield NUMERIC;
    combined_notes TEXT;
BEGIN
    -- Loop through all unique symbol-market-user combinations that have duplicates
    FOR inv_record IN 
        SELECT user_id, symbol, market, COUNT(*) as count_investments
        FROM stock_investments 
        GROUP BY user_id, symbol, market 
        HAVING COUNT(*) > 1
    LOOP
        -- Get the oldest investment (keep this one)
        SELECT * INTO duplicate_record 
        FROM stock_investments 
        WHERE user_id = inv_record.user_id 
          AND symbol = inv_record.symbol 
          AND market = inv_record.market
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Calculate combined values
        SELECT 
            SUM(quantity),
            SUM(commission),
            SUM(dividend_received),
            SUM((quantity * buy_price) + commission), -- total cost including commission
            STRING_AGG(DISTINCT notes, ' | ' ORDER BY created_at) FILTER (WHERE notes IS NOT NULL)
        INTO 
            combined_quantity,
            combined_commission,
            combined_dividend_received,
            total_cost_existing,
            combined_notes
        FROM stock_investments 
        WHERE user_id = inv_record.user_id 
          AND symbol = inv_record.symbol 
          AND market = inv_record.market;
        
        -- Calculate average buy price (excluding commission)
        average_buy_price := (total_cost_existing - combined_commission) / combined_quantity;
        
        -- Calculate weighted average dividend yield
        SELECT 
            CASE 
                WHEN SUM(quantity) > 0 THEN 
                    SUM(quantity * COALESCE(dividend_yield_at_purchase, 0)) / SUM(quantity)
                ELSE NULL 
            END
        INTO weighted_dividend_yield
        FROM stock_investments 
        WHERE user_id = inv_record.user_id 
          AND symbol = inv_record.symbol 
          AND market = inv_record.market
          AND dividend_yield_at_purchase IS NOT NULL;
        
        -- Update the oldest record with combined values
        UPDATE stock_investments 
        SET 
            quantity = combined_quantity,
            buy_price = average_buy_price,
            commission = combined_commission,
            dividend_received = combined_dividend_received,
            dividend_yield_at_purchase = weighted_dividend_yield,
            notes = combined_notes,
            updated_at = now()
        WHERE id = duplicate_record.id;
        
        -- Delete the duplicate records (keep only the oldest one)
        DELETE FROM stock_investments 
        WHERE user_id = inv_record.user_id 
          AND symbol = inv_record.symbol 
          AND market = inv_record.market
          AND id != duplicate_record.id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to combine existing duplicates
SELECT combine_duplicate_investments();

-- Create a trigger to prevent duplicate entries in the future
CREATE OR REPLACE FUNCTION prevent_duplicate_investments()
RETURNS TRIGGER AS $$
DECLARE
    existing_investment RECORD;
    combined_quantity NUMERIC;
    combined_commission NUMERIC;
    combined_dividend_received NUMERIC;
    total_cost_existing NUMERIC;
    total_cost_new NUMERIC;
    average_buy_price NUMERIC;
    weighted_dividend_yield NUMERIC;
    combined_notes TEXT;
BEGIN
    -- Check if this stock already exists for this user
    SELECT * INTO existing_investment
    FROM stock_investments 
    WHERE user_id = NEW.user_id 
      AND symbol = NEW.symbol 
      AND market = NEW.market
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF FOUND THEN
        -- Calculate combined values
        total_cost_existing := (existing_investment.quantity * existing_investment.buy_price) + existing_investment.commission;
        total_cost_new := (NEW.quantity * NEW.buy_price) + NEW.commission;
        
        combined_quantity := existing_investment.quantity + NEW.quantity;
        combined_commission := existing_investment.commission + NEW.commission;
        combined_dividend_received := existing_investment.dividend_received + COALESCE(NEW.dividend_received, 0);
        
        -- Calculate average buy price
        average_buy_price := (total_cost_existing + total_cost_new - combined_commission) / combined_quantity;
        
        -- Calculate weighted average dividend yield
        IF existing_investment.dividend_yield_at_purchase IS NOT NULL OR NEW.dividend_yield_at_purchase IS NOT NULL THEN
            weighted_dividend_yield := (
                (existing_investment.quantity * COALESCE(existing_investment.dividend_yield_at_purchase, 0)) +
                (NEW.quantity * COALESCE(NEW.dividend_yield_at_purchase, 0))
            ) / combined_quantity;
        ELSE
            weighted_dividend_yield := NULL;
        END IF;
        
        -- Combine notes
        IF existing_investment.notes IS NOT NULL AND NEW.notes IS NOT NULL THEN
            combined_notes := existing_investment.notes || ' | ' || NEW.notes;
        ELSE
            combined_notes := COALESCE(NEW.notes, existing_investment.notes);
        END IF;
        
        -- Update existing record
        UPDATE stock_investments 
        SET 
            quantity = combined_quantity,
            buy_price = average_buy_price,
            commission = combined_commission,
            dividend_received = combined_dividend_received,
            dividend_yield_at_purchase = weighted_dividend_yield,
            current_price = COALESCE(NEW.current_price, existing_investment.current_price),
            company_name = COALESCE(NEW.company_name, existing_investment.company_name),
            notes = combined_notes,
            updated_at = now()
        WHERE id = existing_investment.id;
        
        -- Prevent the insert by returning NULL
        RETURN NULL;
    END IF;
    
    -- If no duplicate found, allow the insert
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preventing duplicates on INSERT
DROP TRIGGER IF EXISTS prevent_duplicate_investments_trigger ON stock_investments;
CREATE TRIGGER prevent_duplicate_investments_trigger
    BEFORE INSERT ON stock_investments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_investments();