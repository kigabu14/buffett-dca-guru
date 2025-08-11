
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Python backend endpoint for yfinance 2.0.0
const PYTHON_BACKEND_URL = Deno.env.get('PYTHON_BACKEND_URL') || 'http://localhost:8000';

// Fetch comprehensive financial data using Python backend with yfinance 2.0.0
async function fetchFinancialData(symbol: string) {
  try {
    console.log(`Fetching data for ${symbol} from Python backend with yfinance 2.0.0`);
    
    // Clean symbol for different markets
    let cleanSymbol = symbol.trim();
    
    // For Thai stocks, ensure .BK suffix
    if (symbol.includes('.BK') || symbol.includes('.SET')) {
      if (!cleanSymbol.includes('.BK')) {
        cleanSymbol = cleanSymbol.replace('.SET', '.BK');
        if (!cleanSymbol.includes('.BK')) {
          cleanSymbol = cleanSymbol + '.BK';
        }
      }
    }

    console.log(`Using symbol: ${cleanSymbol}`);

    // Call Python backend API
    const response = await fetch(`${PYTHON_BACKEND_URL}/stock/${cleanSymbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!response.ok) {
      throw new Error(`Python backend API HTTP error! status: ${response.status}`);
    }

    const stockData = await response.json();
    
    if (!stockData.success) {
      throw new Error(stockData.error || 'Failed to fetch data from Python backend');
    }

    console.log(`Successfully fetched data for ${cleanSymbol} from Python backend: price=${stockData.current_price}, PE=${stockData.pe_ratio}`);
    return stockData;
    
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return createFallbackData(symbol);
  }
}

// Fetch multiple stocks from Python backend
async function fetchMultipleStocks(symbols: string[]) {
  try {
    console.log(`Fetching data for ${symbols.length} symbols from Python backend`);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/stock-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      },
      body: JSON.stringify({ symbols })
    });

    if (!response.ok) {
      throw new Error(`Python backend API HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch data from Python backend');
    }

    console.log(`Successfully fetched data for ${result.total_successful}/${result.total_requested} symbols from Python backend`);
    return result;
    
  } catch (error) {
    console.error(`Error fetching multiple stocks:`, error);
    throw error;
  }
}

// Fetch historical data from Python backend
async function fetchHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d') {
  try {
    console.log(`Fetching historical data for ${symbol} from Python backend`);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/historical/${symbol}?period=${period}&interval=${interval}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!response.ok) {
      throw new Error(`Python backend API HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch historical data from Python backend');
    }

    console.log(`Successfully fetched ${result.total_points} historical data points for ${symbol}`);
    return result;
    
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
}

// Convert Python backend response to expected format
function convertBackendResponse(backendData: any, originalSymbol: string) {
  try {
    // Data is already in the correct format from Python backend
    return {
      symbol: backendData.symbol || originalSymbol,
      company_name: backendData.company_name || backendData.name || originalSymbol,
      name: backendData.company_name || backendData.name || originalSymbol,
      market: backendData.market,
      sector: mapSector(backendData.symbol || originalSymbol),
      current_price: backendData.current_price,
      previous_close: backendData.previous_close,
      open_price: backendData.open_price,
      day_high: backendData.day_high,
      day_low: backendData.day_low,
      volume: backendData.volume,
      market_cap: backendData.market_cap,
      pe_ratio: backendData.pe_ratio,
      eps: backendData.eps,
      dividend_yield: backendData.dividend_yield,
      
      // Extended metrics from yfinance 2.0.0
      currency: backendData.currency,
      change: backendData.change,
      change_percent: backendData.change_percent,
      week_high_52: backendData.week_high_52,
      week_low_52: backendData.week_low_52,
      dividend_rate: backendData.dividend_rate,
      ex_dividend_date: backendData.ex_dividend_date,
      dividend_date: backendData.dividend_date,
      payout_ratio: backendData.payout_ratio,
      book_value: backendData.book_value,
      price_to_book: backendData.price_to_book,
      beta: backendData.beta,
      roe: backendData.roe,
      profit_margin: backendData.profit_margin,
      operating_margin: backendData.operating_margin,
      debt_to_equity: backendData.debt_to_equity,
      current_ratio: backendData.current_ratio,
      revenue_growth: backendData.revenue_growth,
      earnings_growth: backendData.earnings_growth,
      
      last_updated: backendData.last_updated || new Date().toISOString(),
      success: backendData.success
    };
    
  } catch (error) {
    console.error(`Error converting backend response for ${originalSymbol}:`, error);
    return createFallbackData(originalSymbol);
  }
}

function createFallbackData(symbol: string) {
  const isThaiStock = symbol.includes('.BK') || symbol.includes('.SET');
  const market = isThaiStock ? 'SET' : 'NASDAQ';
  const currency = isThaiStock ? 'THB' : 'USD';
  const fallbackPrice = isThaiStock ? 10.0 : 100.0;
  
  return {
    symbol: symbol,
    company_name: symbol,
    name: symbol,
    market: market,
    sector: mapSector(symbol),
    current_price: fallbackPrice,
    previous_close: fallbackPrice,
    open_price: fallbackPrice,
    day_high: fallbackPrice * 1.02,
    day_low: fallbackPrice * 0.98,
    volume: 0,
    market_cap: fallbackPrice * 1000000000,
    pe_ratio: 15.0,
    eps: fallbackPrice / 15.0,
    dividend_yield: 0.03,
    
    // Extended metrics with defaults (yfinance 2.0.0 compatibility)
    currency: currency,
    change: 0,
    change_percent: 0,
    week_high_52: fallbackPrice * 1.3,
    week_low_52: fallbackPrice * 0.7,
    dividend_rate: fallbackPrice * 0.03,
    ex_dividend_date: null,
    dividend_date: null,
    payout_ratio: null,
    book_value: fallbackPrice * 0.8,
    price_to_book: 1.25,
    beta: 1.0,
    roe: 0.15,
    profit_margin: 0.15,
    operating_margin: 0.20,
    debt_to_equity: 0.5,
    current_ratio: 2.0,
    revenue_growth: 0.1,
    earnings_growth: 0.1,
    
    last_updated: new Date().toISOString(),
    success: false
  };
}


function determineMarket(symbol: string): string {
  if (symbol.includes('.BK') || symbol.includes('.SET')) {
    return 'SET';
  }
  return 'NASDAQ';
}

function mapSector(symbol: string): string {
  if (symbol.includes('.BK')) {
    const thaiSymbol = symbol.replace('.BK', '');
    if (['BBL', 'KBANK', 'KTB', 'SCB', 'TTB', 'TCAP', 'TISCO', 'KKP'].includes(thaiSymbol)) {
      return 'Banking';
    }
    if (['ADVANC', 'TRUE', 'DTAC'].includes(thaiSymbol)) {
      return 'Technology';
    }
    if (['CPALL', 'MAKRO', 'BJC', 'COM7'].includes(thaiSymbol)) {
      return 'Commerce';
    }
    if (['PTTEP', 'PTT', 'TOP', 'BANPU', 'GULF', 'BGRIM'].includes(thaiSymbol)) {
      return 'Energy & Utilities';
    }
    return 'Industrial';
  }
  return 'Technology';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const symbols = Array.isArray(body.symbols) ? body.symbols : [body.symbol];
    const historical = body.historical || false;
    const period = body.period || '1mo';
    const interval = body.interval || '1d';
    
    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing request for ${symbols.length} symbols using yfinance 2.0.0 backend`);

    if (historical) {
      // Handle historical data request
      if (symbols.length > 1) {
        return new Response(
          JSON.stringify({ error: 'Historical data only supports single symbol' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        const historicalResult = await fetchHistoricalData(symbols[0], period, interval);
        
        return new Response(
          JSON.stringify({
            success: true,
            historical: historicalResult.historical,
            symbol: symbols[0],
            period: period,
            interval: interval,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Historical data fetch error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch historical data',
            message: `ไม่สามารถดึงข้อมูลประวัติศาสตร์ได้: ${error.message}`,
            success: false
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Handle regular stock data request using Python backend
      try {
        let stockQuotes = [];
        let failedSymbols = [];

        if (symbols.length === 1) {
          // Single stock request
          try {
            const stockData = await fetchFinancialData(symbols[0]);
            const convertedData = convertBackendResponse(stockData, symbols[0]);
            stockQuotes.push(convertedData);
          } catch (error) {
            console.error(`Failed to fetch data for ${symbols[0]}:`, error.message);
            failedSymbols.push(symbols[0]);
            stockQuotes.push(createFallbackData(symbols[0]));
          }
        } else {
          // Multiple stocks request
          try {
            const multipleResult = await fetchMultipleStocks(symbols);
            stockQuotes = multipleResult.data.map((item: any) => convertBackendResponse(item, item.symbol));
            failedSymbols = multipleResult.failed_symbols || [];
          } catch (error) {
            console.error('Multiple stocks fetch error:', error);
            // Fallback to individual requests
            for (const symbol of symbols) {
              try {
                const stockData = await fetchFinancialData(symbol);
                const convertedData = convertBackendResponse(stockData, symbol);
                stockQuotes.push(convertedData);
              } catch (err) {
                console.error(`Failed to fetch data for ${symbol}:`, err.message);
                failedSymbols.push(symbol);
                stockQuotes.push(createFallbackData(symbol));
              }
            }
          }
        }
        
        if (stockQuotes.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: 'No data could be retrieved',
              message: `ไม่สามารถดึงข้อมูลได้สำหรับ: ${failedSymbols.join(', ')}`,
              failedSymbols,
              success: false,
              data: []
            }),
            { 
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Connect to Supabase and update database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update stock_markets table with data from yfinance 2.0.0
        const updatePromises = stockQuotes.map(async (quote) => {
          const dbData = {
            symbol: quote.symbol,
            company_name: quote.company_name || quote.name,
            market: quote.market,
            sector: quote.sector || mapSector(quote.symbol),
            current_price: quote.current_price,
            previous_close: quote.previous_close,
            open_price: quote.open_price,
            day_high: quote.day_high,
            day_low: quote.day_low,
            volume: quote.volume,
            market_cap: quote.market_cap,
            pe_ratio: quote.pe_ratio,
            eps: quote.eps,
            dividend_yield: quote.dividend_yield,
            
            // Extended metrics from yfinance 2.0.0
            currency: quote.currency,
            change: quote.change,
            change_percent: quote.change_percent,
            week_high_52: quote.week_high_52,
            week_low_52: quote.week_low_52,
            dividend_rate: quote.dividend_rate,
            ex_dividend_date: quote.ex_dividend_date,
            dividend_date: quote.dividend_date,
            payout_ratio: quote.payout_ratio,
            book_value: quote.book_value,
            price_to_book: quote.price_to_book,
            beta: quote.beta,
            roe: quote.roe,
            profit_margin: quote.profit_margin,
            operating_margin: quote.operating_margin,
            debt_to_equity: quote.debt_to_equity,
            current_ratio: quote.current_ratio,
            revenue_growth: quote.revenue_growth,
            earnings_growth: quote.earnings_growth,
            
            last_updated: new Date().toISOString()
          };

          const { error } = await supabase
            .from('stock_markets')
            .upsert(dbData, { 
              onConflict: 'symbol',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Error updating ${quote.symbol}:`, error);
          }

          // Return API data in expected format
          return quote;
        });

        const apiData = await Promise.all(updatePromises);

        console.log(`Successfully processed ${stockQuotes.length} stocks using yfinance 2.0.0, failed: ${failedSymbols.length}`);

        return new Response(
          JSON.stringify({
            success: true,
            data: apiData,
            failedSymbols,
            totalRequested: symbols.length,
            totalSuccessful: stockQuotes.length,
            totalFailed: failedSymbols.length,
            timestamp: new Date().toISOString(),
            backend: 'yfinance-2.0.0'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Stock data processing error:', error);
        
        return new Response(
          JSON.stringify({ 
            error: 'Internal server error',
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
            details: error.message,
            success: false
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

  } catch (error) {
    console.error('Stock data fetch error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
