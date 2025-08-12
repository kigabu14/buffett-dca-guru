
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables for configuration
const LOG_LEVEL = Deno.env.get('LOG_LEVEL') || 'info';

// Helper function to log based on level
function debugLog(...args: any[]) {
  if (LOG_LEVEL === 'debug') {
    console.log(...args);
  }
}

function infoLog(...args: any[]) {
  console.log(...args);
}

// Yahoo Finance API endpoints
const YAHOO_FINANCE_BASE = 'https://query2.finance.yahoo.com/v8/finance/chart';
const YAHOO_FINANCE_QUOTESUMMARY = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary';

// Symbol normalization helper
function normalizeSymbol(raw: string, marketHint?: string): string {
  const cleanSymbol = raw.trim().toUpperCase();
  
  // If already has .BK suffix, keep as is
  if (cleanSymbol.endsWith('.BK')) {
    return cleanSymbol;
  }
  
  // Only append .BK when market is explicitly specified as SET
  if (marketHint === 'SET') {
    return `${cleanSymbol}.BK`;
  }
  
  // Do not auto-append any suffix when market is unknown.
  // Frontend will pass the correct suffix (e.g., .BK) when appropriate.
  return cleanSymbol;
}

// Market inference helper
function inferMarket(symbol: string): string {
  if (symbol.endsWith('.BK')) {
    return 'SET';
  }
  // Default to null for unknown markets - let existing logic handle
  return 'NASDAQ'; // Keep existing behavior for now
}

// Date conversion helper for Yahoo Finance epoch timestamps
function epochToDate(epoch: number | null): string | null {
  if (!epoch || epoch === 0) return null;
  try {
    return new Date(epoch * 1000).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Retry helper for Yahoo Finance API calls
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 1): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // If server error or rate limit, retry
      if (attempt < maxRetries && [429, 500, 502, 503].includes(response.status)) {
        const delay = 300 * Math.pow(2, attempt);
        debugLog(`HTTP ${response.status} for ${url}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = 300 * Math.pow(2, attempt);
        debugLog(`Network error for ${url}, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  throw lastError!;
}

// Fetch comprehensive financial data from multiple Yahoo Finance endpoints
async function fetchFinancialData(symbol: string) {
  try {
    debugLog(`Fetching data for ${symbol} from Yahoo Finance`);
    
    // Normalize symbol for Yahoo Finance API
    const normalizedSymbol = normalizeSymbol(symbol);
    const market = inferMarket(normalizedSymbol);
    
    debugLog(`Using normalized symbol: ${normalizedSymbol}, inferred market: ${market}`);

    // Fetch from multiple endpoints in parallel
    const [chartData, summaryData] = await Promise.all([
      fetchChartData(normalizedSymbol),
      fetchQuoteSummary(normalizedSymbol)
    ]);

    return parseComprehensiveData(chartData, summaryData, symbol, normalizedSymbol, market);
    
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return createFallbackData(symbol);
  }
}

// Fetch chart data (price, volume, etc.)
async function fetchChartData(symbol: string) {
  const chartUrl = `${YAHOO_FINANCE_BASE}/${symbol}`;
  
  const response = await fetchWithRetry(chartUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Chart API HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Fetch quote summary data (financial metrics, P/E, dividend info, etc.)
async function fetchQuoteSummary(symbol: string) {
  const modules = [
    'defaultKeyStatistics',
    'financialData', 
    'summaryDetail',
    'quoteType',
    'price',
    'summaryProfile'
  ].join(',');
  
  const summaryUrl = `${YAHOO_FINANCE_QUOTESUMMARY}/${symbol}?modules=${modules}`;
  
  try {
    const response = await fetchWithRetry(summaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      debugLog(`Summary API failed for ${symbol}, status: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    debugLog(`Error fetching summary for ${symbol}:`, error);
    return null;
  }
}

function parseComprehensiveData(chartData: any, summaryData: any, originalSymbol: string, normalizedSymbol: string, market: string) {
  try {
    const result = chartData?.chart?.result?.[0];
    if (!result) {
      throw new Error('No chart data found');
    }

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    
    if (!meta) {
      throw new Error('Invalid chart data structure');
    }

    // Extract basic price data - prefer meta.previousClose over derived calculation
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    
    // If neither current price nor previous close available, this is a failed fetch
    if (!currentPrice && !previousClose) {
      debugLog(`No usable price data for ${originalSymbol}`);
      return {
        symbol: normalizedSymbol,
        name: normalizedSymbol,
        price: null,
        current_price: null,
        previous_close: null,
        change: null,
        changePercent: null,
        market: market,
        currency: null,
        success: false,
        source: 'fallback',
        is_estimated: false
      };
    }

    // Calculate change & change_percent only if both current_price and previous_close exist
    let change = null;
    let changePercent = null;
    
    if (currentPrice !== null && currentPrice !== undefined && 
        previousClose !== null && previousClose !== undefined && previousClose > 0) {
      change = currentPrice - previousClose;
      changePercent = (change / previousClose) * 100;
    }

    const finalCurrentPrice = currentPrice ?? previousClose ?? null;
    const finalPreviousClose = previousClose ?? null;

    // Extract summary data if available
    let summaryResult = null;
    if (summaryData?.quoteSummary?.result?.[0]) {
      summaryResult = summaryData.quoteSummary.result[0];
    }

    const defaultKeyStats = summaryResult?.defaultKeyStatistics || {};
    const financialInfo = summaryResult?.financialData || {};
    const summaryDetail = summaryResult?.summaryDetail || {};
    const price = summaryResult?.price || {};
    const summaryProfile = summaryResult?.summaryProfile || {};

    // Currency - prefer meta over summary
    const currency = meta.currency || summaryDetail.currency || (market === 'SET' ? 'THB' : 'USD');

    // Get latest quote data from chart
    const volume = meta.regularMarketVolume || (quotes?.volume?.slice(-1)?.[0]) || null;
    const dayHigh = meta.regularMarketDayHigh || (quotes?.high?.slice(-1)?.[0]) || null;
    const dayLow = meta.regularMarketDayLow || (quotes?.low?.slice(-1)?.[0]) || null;
    const open = meta.regularMarketOpen || (quotes?.open?.slice(-1)?.[0]) || null;

    // Extended metrics mapping - use null when not available, no fabricated defaults
    const extendedMetrics = {
      // 52-week range
      week_high_52: summaryDetail.fiftyTwoWeekHigh?.raw || defaultKeyStats.fiftyTwoWeekHigh?.raw || meta.fiftyTwoWeekHigh || null,
      week_low_52: summaryDetail.fiftyTwoWeekLow?.raw || defaultKeyStats.fiftyTwoWeekLow?.raw || meta.fiftyTwoWeekLow || null,
      
      // Dividend information - use null-coalescing and proper mapping
      dividend_rate: summaryDetail.dividendRate?.raw ?? financialInfo.trailingAnnualDividendRate?.raw ?? null,
      dividend_yield: summaryDetail.dividendYield?.raw ?? financialInfo.dividendYield?.raw ?? null,
      ex_dividend_date: epochToDate(summaryDetail.exDividendDate?.raw),
      dividend_date: epochToDate(summaryDetail.dividendDate?.raw),
      payout_ratio: summaryDetail.payoutRatio?.raw || defaultKeyStats.payoutRatio?.raw || null,
      
      // Financial ratios
      book_value: defaultKeyStats.bookValue?.raw || financialInfo.bookValue?.raw || null,
      price_to_book: defaultKeyStats.priceToBook?.raw || null,
      beta: defaultKeyStats.beta?.raw || null,
      
      // Performance metrics
      roe: financialInfo.returnOnEquity?.raw || defaultKeyStats.roe?.raw || null,
      profit_margin: defaultKeyStats.profitMargins?.raw || financialInfo.profitMargins?.raw || null,
      operating_margin: financialInfo.operatingMargins?.raw || defaultKeyStats.operatingMargins?.raw || null,
      debt_to_equity: financialInfo.debtToEquity?.raw || defaultKeyStats.debtToEquity?.raw || null,
      current_ratio: financialInfo.currentRatio?.raw || null,
      
      // Growth metrics
      revenue_growth: financialInfo.revenueGrowth?.raw || null,
      earnings_growth: financialInfo.earningsGrowth?.raw || null,
      
      // Basic financial data - no defaults, use null when missing
      market_cap: price.marketCap?.raw || meta.marketCap || null,
      pe_ratio: defaultKeyStats.forwardPE?.raw || defaultKeyStats.trailingPE?.raw || 
               summaryDetail.forwardPE?.raw || summaryDetail.trailingPE?.raw || null,
      eps: defaultKeyStats.trailingEps?.raw || financialInfo.trailingEps?.raw || null
    };

    // Company name - prefer from price module, fallback to profile, then meta
    const companyName = price.longName || price.shortName || summaryProfile.longBusinessSummary || meta.longName || meta.shortName || normalizedSymbol;
    
    // Sector - prefer summaryProfile.sector, fallback to existing mapSector logic
    const sector = summaryProfile.sector || mapSector(normalizedSymbol);

    const successfulData = {
      symbol: normalizedSymbol,
      name: companyName,
      price: finalCurrentPrice,
      current_price: finalCurrentPrice,
      previous_close: finalPreviousClose,
      change: change,
      changePercent: changePercent,
      market: market,
      currency: currency,
      sector: sector,
      
      // Price data
      open: open,
      dayHigh: dayHigh,
      dayLow: dayLow,
      volume: volume,
      
      // Extended metrics
      ...extendedMetrics,
      
      success: true,
      source: 'live',
      is_estimated: false
    };

    infoLog(`${originalSymbol} → ${normalizedSymbol}: price=${finalCurrentPrice}, source=live, PE=${extendedMetrics.pe_ratio || 'null'}, dividend=${extendedMetrics.dividend_yield || 'null'}`);
    debugLog(`Successfully parsed comprehensive data for ${originalSymbol}:`, successfulData);

    return successfulData;
    
  } catch (error) {
    console.error(`Error parsing comprehensive data for ${originalSymbol}:`, error);
    return createFallbackData(originalSymbol, normalizedSymbol, market);
  }
}

function createFallbackData(originalSymbol: string, normalizedSymbol?: string, market?: string) {
  const finalSymbol = normalizedSymbol || normalizeSymbol(originalSymbol);
  const finalMarket = market || inferMarket(finalSymbol);
  
  infoLog(`${originalSymbol} → ${finalSymbol}: source=fallback, no usable data`);
  
  return {
    symbol: finalSymbol,
    name: finalSymbol,
    price: null,
    current_price: null,
    previous_close: null,
    change: null,
    changePercent: null,
    market: finalMarket,
    currency: finalMarket === 'SET' ? 'THB' : 'USD',
    sector: mapSector(finalSymbol),
    
    // Price data
    open: null,
    dayHigh: null,
    dayLow: null,
    volume: null,
    
    // Extended metrics - all null for fallback
    market_cap: null,
    pe_ratio: null,
    eps: null,
    book_value: null,
    price_to_book: null,
    
    // Dividend data
    dividend_yield: null,
    dividend_rate: null,
    ex_dividend_date: null,
    dividend_date: null,
    payout_ratio: null,
    
    // 52-week range
    week_high_52: null,
    week_low_52: null,
    beta: null,
    
    // Financial health ratios
    roe: null,
    profit_margin: null,
    operating_margin: null,
    debt_to_equity: null,
    current_ratio: null,
    
    // Growth metrics
    revenue_growth: null,
    earnings_growth: null,
    
    success: false,
    source: 'fallback',
    is_estimated: false
  };
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
    
    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    infoLog(`Processing request for ${symbols.length} symbols:`, symbols.slice(0, 5));

    const stockQuotes = [];
    const failedSymbols = [];
    
    // Process symbols with controlled concurrency
    const maxConcurrent = 3;
    for (let i = 0; i < symbols.length; i += maxConcurrent) {
      const batch = symbols.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (symbol: string) => {
        const cleanSymbol = symbol.trim();
        try {
          const realData = await fetchFinancialData(cleanSymbol);
          return { success: true, data: realData };
        } catch (error) {
          console.error(`Failed to fetch data for ${cleanSymbol}:`, error.message);
          return { success: false, symbol: cleanSymbol, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          stockQuotes.push(result.data);
        } else {
          failedSymbols.push(result.symbol);
        }
      });

      // Small delay between batches to avoid overwhelming Yahoo Finance
      if (i + maxConcurrent < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    // Update stock_markets table with extended metrics
    const updatePromises = stockQuotes.map(async (quote) => {
      // Build dbData for database upsert with all extended fields
      const dbData = {
        symbol: quote.symbol, // Already normalized
        company_name: quote.name,
        market: quote.market,
        sector: quote.sector,
        current_price: quote.current_price,
        previous_close: quote.previous_close,
        open_price: quote.open,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        volume: quote.volume,
        market_cap: quote.market_cap,
        pe_ratio: quote.pe_ratio,
        eps: quote.eps,
        dividend_yield: quote.dividend_yield,
        
        // Extended metrics
        currency: quote.currency,
        change: quote.change,
        change_percent: quote.changePercent,
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
        
        // New fields
        is_estimated: quote.is_estimated,
        
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

      // Build apiData for response (snake_case)
      return {
        symbol: quote.symbol,
        company_name: quote.name,
        market: quote.market,
        sector: quote.sector,
        current_price: quote.current_price,
        previous_close: quote.previous_close,
        open_price: quote.open,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        volume: quote.volume,
        market_cap: quote.market_cap,
        pe_ratio: quote.pe_ratio,
        eps: quote.eps,
        dividend_yield: quote.dividend_yield,
        
        // Extended metrics in snake_case for frontend consumption
        currency: quote.currency,
        change: quote.change,
        change_percent: quote.changePercent,
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
        
        // Response metadata
        is_estimated: quote.is_estimated,
        source: quote.source,
        
        last_updated: new Date().toISOString()
      };
    });

    const apiData = await Promise.all(updatePromises);

    // Upsert xd_calendar rows when both ex_dividend_date and dividend_rate are available
    const calendarPromises = stockQuotes
      .filter(quote => quote.ex_dividend_date && quote.dividend_rate)
      .map(async (quote) => {
        const calendarData = {
          symbol: quote.symbol,
          ex_dividend_date: quote.ex_dividend_date,
          dividend_amount: quote.dividend_rate,
          dividend_yield: quote.dividend_yield ? quote.dividend_yield * 100 : null, // Convert to percentage
          payment_date: quote.dividend_date,
        };

        const { error } = await supabase
          .from('xd_calendar')
          .upsert(calendarData, { 
            onConflict: 'symbol,ex_dividend_date',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Error updating xd_calendar for ${quote.symbol}:`, error);
        }
      });

    // Wait for calendar updates to complete
    await Promise.all(calendarPromises);

    infoLog(`Successfully processed ${stockQuotes.length} stocks, failed: ${failedSymbols.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: apiData,
        failedSymbols,
        totalRequested: symbols.length,
        totalSuccessful: stockQuotes.length,
        totalFailed: failedSymbols.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
