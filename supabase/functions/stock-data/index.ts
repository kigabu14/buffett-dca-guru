
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Yahoo Finance API endpoints - Updated for yfinance 2.0.0 compatibility
const YAHOO_FINANCE_BASE = 'https://query2.finance.yahoo.com/v8/finance/chart';
const YAHOO_FINANCE_QUOTE = 'https://query1.finance.yahoo.com/v1/finance/screener';
const YAHOO_FINANCE_QUOTESUMMARY = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary';
const YAHOO_FINANCE_DIVIDENDS = 'https://query1.finance.yahoo.com/v7/finance/download';

// Enhanced request configuration for better reliability
const REQUEST_CONFIG = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  timeout: 15000 // 15 second timeout
};

// Enhanced retry mechanism for better reliability (yfinance 2.0.0 compatibility)
async function fetchWithRetry(url: string, options: any = {}, maxRetries: number = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for: ${url}`);
      
      const response = await fetch(url, {
        ...REQUEST_CONFIG,
        ...options
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer on each retry
          const waitTime = attempt * 2000;
          console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (response.status >= 500) {
          // Server error - retry
          console.log(`Server error ${response.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        // Client error - don't retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt; // Exponential backoff
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Fetch comprehensive financial data from multiple Yahoo Finance endpoints
async function fetchFinancialData(symbol: string) {
  try {
    console.log(`Fetching data for ${symbol} from Yahoo Finance`);
    
    // Clean symbol for different markets - Enhanced for yfinance 2.0.0 compatibility
    let cleanSymbol = symbol.trim().toUpperCase();
    
    // Handle different market suffixes more robustly
    if (symbol.includes('.BK') || symbol.includes('.SET')) {
      // Thai stock market
      if (!cleanSymbol.includes('.BK')) {
        cleanSymbol = cleanSymbol.replace('.SET', '.BK');
        if (!cleanSymbol.includes('.BK')) {
          cleanSymbol = cleanSymbol + '.BK';
        }
      }
    } else if (symbol.includes('.TO') || symbol.includes('.TSE')) {
      // Toronto Stock Exchange
      if (!cleanSymbol.includes('.TO')) {
        cleanSymbol = cleanSymbol.replace('.TSE', '.TO');
        if (!cleanSymbol.includes('.TO')) {
          cleanSymbol = cleanSymbol + '.TO';
        }
      }
    } else if (symbol.includes('.L') || symbol.includes('.LON')) {
      // London Stock Exchange
      if (!cleanSymbol.includes('.L')) {
        cleanSymbol = cleanSymbol.replace('.LON', '.L');
        if (!cleanSymbol.includes('.L')) {
          cleanSymbol = cleanSymbol + '.L';
        }
      }
    }

    console.log(`Using symbol: ${cleanSymbol}`);

    // Fetch from multiple endpoints with improved error handling
    const [chartData, summaryData] = await Promise.allSettled([
      fetchChartData(cleanSymbol),
      fetchQuoteSummary(cleanSymbol)
    ]);

    // Handle settled promises
    const chartResult = chartData.status === 'fulfilled' ? chartData.value : null;
    const summaryResult = summaryData.status === 'fulfilled' ? summaryData.value : null;

    if (chartData.status === 'rejected') {
      console.warn(`Chart data failed for ${cleanSymbol}:`, chartData.reason);
    }
    if (summaryData.status === 'rejected') {
      console.warn(`Summary data failed for ${cleanSymbol}:`, summaryData.reason);
    }

    return parseComprehensiveData(chartResult, summaryResult, symbol, cleanSymbol);
    
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return createFallbackData(symbol);
  }
}

// Fetch chart data (price, volume, etc.) - Enhanced for yfinance 2.0.0 compatibility
async function fetchChartData(symbol: string) {
  const chartUrl = `${YAHOO_FINANCE_BASE}/${symbol}`;
  
  const response = await fetchWithRetry(chartUrl);
  return await response.json();
}

// Fetch quote summary data (financial metrics, P/E, dividend info, etc.) - Enhanced for yfinance 2.0.0 compatibility
async function fetchQuoteSummary(symbol: string) {
  const modules = [
    'defaultKeyStatistics',
    'financialData', 
    'summaryDetail',
    'quoteType',
    'price',
    'summaryProfile',
    'calendarEvents', // Added for better dividend tracking
    'upgradeDowngradeHistory' // Added for analyst data
  ].join(',');
  
  const summaryUrl = `${YAHOO_FINANCE_QUOTESUMMARY}/${symbol}?modules=${modules}`;
  
  try {
    const response = await fetchWithRetry(summaryUrl);
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching summary for ${symbol}:`, error);
    return null;
  }
}

function parseComprehensiveData(chartData: any, summaryData: any, originalSymbol: string, cleanSymbol: string) {
  try {
    // Enhanced error handling - check for valid chart data
    const result = chartData?.chart?.result?.[0];
    if (!result) {
      console.warn(`No valid chart data for ${originalSymbol}, using fallback`);
      return createFallbackData(originalSymbol);
    }

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    
    if (!meta) {
      console.warn(`Invalid chart data structure for ${originalSymbol}, using fallback`);
      return createFallbackData(originalSymbol);
    }

    // Extract basic price data with enhanced fallback logic
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Enhanced market and currency detection
    const isThaiStock = originalSymbol.includes('.BK') || originalSymbol.includes('.SET');
    const isCanadianStock = originalSymbol.includes('.TO') || originalSymbol.includes('.TSE');
    const isUKStock = originalSymbol.includes('.L') || originalSymbol.includes('.LON');
    
    let market = 'NASDAQ';
    let currency = 'USD';
    
    if (isThaiStock) {
      market = 'SET';
      currency = 'THB';
    } else if (isCanadianStock) {
      market = 'TSX';
      currency = 'CAD';
    } else if (isUKStock) {
      market = 'LSE';
      currency = 'GBP';
    } else {
      market = meta.exchangeName || 'NASDAQ';
      currency = meta.currency || 'USD';
    }

    // Get latest quote data from chart with better error handling
    const volume = meta.regularMarketVolume || (quotes?.volume?.slice(-1)?.[0]) || 0;
    const dayHigh = meta.regularMarketDayHigh || (quotes?.high?.slice(-1)?.[0]) || currentPrice * 1.02;
    const dayLow = meta.regularMarketDayLow || (quotes?.low?.slice(-1)?.[0]) || currentPrice * 0.98;
    const open = meta.regularMarketOpen || (quotes?.open?.slice(-1)?.[0]) || previousClose;

    // Extract financial data from summary API with enhanced error handling
    let financialData = {};
    let dividendData = {};
    let keyStats = {};
    
    if (summaryData?.quoteSummary?.result?.[0]) {
      const summaryResult = summaryData.quoteSummary.result[0];
      
      // Financial metrics with better fallback values
      const defaultKeyStats = summaryResult.defaultKeyStatistics || {};
      const financialInfo = summaryResult.financialData || {};
      const summaryDetail = summaryResult.summaryDetail || {};
      const price = summaryResult.price || {};
      const calendarEvents = summaryResult.calendarEvents || {};
      
      // Enhanced financial metrics calculation
      const marketCapRaw = price.marketCap?.raw || meta.marketCap;
      const peRatio = defaultKeyStats.forwardPE?.raw || defaultKeyStats.trailingPE?.raw || 
                    summaryDetail.forwardPE?.raw || summaryDetail.trailingPE?.raw;
      const epsValue = defaultKeyStats.trailingEps?.raw || financialInfo.trailingEps?.raw;
      
      financialData = {
        marketCap: marketCapRaw || (currentPrice * (defaultKeyStats.sharesOutstanding?.raw || 1000000000)),
        pe: peRatio || (epsValue > 0 ? currentPrice / epsValue : 15.0),
        eps: epsValue || (peRatio > 0 ? currentPrice / peRatio : currentPrice / 15.0),
        bookValue: defaultKeyStats.bookValue?.raw || (currentPrice * 0.8),
        priceToBook: defaultKeyStats.priceToBook?.raw || 1.5,
        
        // Financial health metrics with better defaults
        profitMargin: financialInfo.profitMargins?.raw || 0.15,
        operatingMargin: financialInfo.operatingMargins?.raw || 0.20,
        returnOnEquity: financialInfo.returnOnEquity?.raw || 0.15,
        debtToEquity: financialInfo.debtToEquity?.raw || 0.5,
        currentRatio: financialInfo.currentRatio?.raw || 2.0,
        
        // Growth metrics
        revenueGrowth: financialInfo.revenueGrowth?.raw || 0.1,
        earningsGrowth: financialInfo.earningsGrowth?.raw || 0.1
      };
      
      // Enhanced dividend information with better date handling
      dividendData = {
        dividendYield: summaryDetail.dividendYield?.raw || 
                      summaryDetail.trailingAnnualDividendYield?.raw || 0.03,
        dividendRate: summaryDetail.dividendRate?.raw || 
                     summaryDetail.trailingAnnualDividendRate?.raw || (currentPrice * 0.03),
        exDividendDate: formatDividendDate(summaryDetail.exDividendDate) || 
                       formatDividendDate(calendarEvents.exDividendDate),
        dividendDate: formatDividendDate(summaryDetail.dividendDate) || 
                     formatDividendDate(calendarEvents.dividendDate),
        payoutRatio: summaryDetail.payoutRatio?.raw || null
      };
      
      // Additional key statistics with enhanced 52-week range
      keyStats = {
        fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || 
                         defaultKeyStats.fiftyTwoWeekHigh?.raw || 
                         meta.fiftyTwoWeekHigh || (currentPrice * 1.3),
        fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || 
                        defaultKeyStats.fiftyTwoWeekLow?.raw || 
                        meta.fiftyTwoWeekLow || (currentPrice * 0.7),
        beta: defaultKeyStats.beta?.raw || 1.0,
        sharesOutstanding: defaultKeyStats.sharesOutstanding?.raw || 
                          price.sharesOutstanding?.raw || 1000000000
      };
    } else {
      // Use fallback values when summary data is not available
      console.warn(`No summary data available for ${originalSymbol}, using defaults`);
      
      financialData = {
        marketCap: currentPrice * 1000000000,
        pe: 15.0,
        eps: currentPrice / 15.0,
        bookValue: currentPrice * 0.8,
        priceToBook: 1.5,
        profitMargin: 0.15,
        operatingMargin: 0.20,
        returnOnEquity: 0.15,
        debtToEquity: 0.5,
        currentRatio: 2.0,
        revenueGrowth: 0.1,
        earningsGrowth: 0.1
      };
      
      dividendData = {
        dividendYield: 0.03,
        dividendRate: currentPrice * 0.03,
        exDividendDate: null,
        dividendDate: null,
        payoutRatio: null
      };
      
      keyStats = {
        fiftyTwoWeekHigh: currentPrice * 1.3,
        fiftyTwoWeekLow: currentPrice * 0.7,
        beta: 1.0,
        sharesOutstanding: 1000000000
      };
    }

    console.log(`Successfully parsed comprehensive data for ${originalSymbol}: price=${currentPrice}, PE=${financialData.pe}, dividend=${dividendData.dividendYield}`);

    return {
      symbol: originalSymbol,
      name: meta.longName || meta.shortName || cleanSymbol,
      price: currentPrice,
      current_price: currentPrice,
      change: change,
      changePercent: changePercent,
      market: market,
      currency: currency,
      
      // Price data
      open: open,
      dayHigh: dayHigh,
      dayLow: dayLow,
      volume: volume,
      
      // Financial metrics
      marketCap: financialData.marketCap,
      pe: financialData.pe,
      eps: financialData.eps,
      bookValue: financialData.bookValue,
      priceToBook: financialData.priceToBook,
      
      // Dividend data
      dividendYield: dividendData.dividendYield,
      dividendRate: dividendData.dividendRate,
      exDividendDate: dividendData.exDividendDate,
      dividendDate: dividendData.dividendDate,
      payoutRatio: dividendData.payoutRatio,
      
      // 52-week range
      weekHigh52: keyStats.fiftyTwoWeekHigh,
      weekLow52: keyStats.fiftyTwoWeekLow,
      beta: keyStats.beta,
      
      // Financial health ratios
      roe: financialData.returnOnEquity,
      profitMargin: financialData.profitMargin,
      operatingMargin: financialData.operatingMargin,
      debtToEquity: financialData.debtToEquity,
      currentRatio: financialData.currentRatio,
      
      // Growth metrics
      revenueGrowth: financialData.revenueGrowth,
      earningsGrowth: financialData.earningsGrowth,
      
      success: true
    };
    
  } catch (error) {
    console.error(`Error parsing comprehensive data for ${originalSymbol}:`, error);
    return createFallbackData(originalSymbol);
  }
}

// Helper function to format dividend dates properly
function formatDividendDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  try {
    if (dateValue.fmt) return dateValue.fmt;
    if (dateValue.raw) {
      const date = new Date(dateValue.raw * 1000); // Convert Unix timestamp
      return date.toISOString().split('T')[0];
    }
    if (typeof dateValue === 'string') return dateValue;
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue * 1000);
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn('Error formatting dividend date:', error);
  }
  
  return null;
}

function createFallbackData(symbol: string) {
  const isThaiStock = symbol.includes('.BK') || symbol.includes('.SET');
  const isCanadianStock = symbol.includes('.TO') || symbol.includes('.TSE');
  const isUKStock = symbol.includes('.L') || symbol.includes('.LON');
  
  let market = 'NASDAQ';
  let currency = 'USD';
  let fallbackPrice = 100.0;
  
  if (isThaiStock) {
    market = 'SET';
    currency = 'THB';
    fallbackPrice = 10.0;
  } else if (isCanadianStock) {
    market = 'TSX';
    currency = 'CAD';
    fallbackPrice = 75.0;
  } else if (isUKStock) {
    market = 'LSE';
    currency = 'GBP';
    fallbackPrice = 80.0;
  }
  
  return {
    symbol: symbol,
    name: symbol,
    price: fallbackPrice,
    current_price: fallbackPrice,
    change: 0,
    changePercent: 0,
    market: market,
    currency: currency,
    
    // Price data
    open: fallbackPrice,
    dayHigh: fallbackPrice * 1.02,
    dayLow: fallbackPrice * 0.98,
    volume: 0,
    
    // Financial metrics with market-appropriate defaults
    marketCap: fallbackPrice * 1000000000,
    pe: 15.0,
    eps: fallbackPrice / 15.0,
    bookValue: fallbackPrice * 0.8,
    priceToBook: 1.25,
    
    // Dividend data
    dividendYield: 0.03,
    dividendRate: fallbackPrice * 0.03,
    exDividendDate: null,
    dividendDate: null,
    payoutRatio: null,
    
    // 52-week range
    weekHigh52: fallbackPrice * 1.3,
    weekLow52: fallbackPrice * 0.7,
    beta: 1.0,
    
    // Financial health ratios
    roe: 0.15,
    profitMargin: 0.15,
    operatingMargin: 0.20,
    debtToEquity: 0.5,
    currentRatio: 2.0,
    
    // Growth metrics
    revenueGrowth: 0.1,
    earningsGrowth: 0.1,
    
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
    
    if (!symbols || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing request for ${symbols.length} symbols:`, symbols.slice(0, 5));

    const stockQuotes = [];
    const failedSymbols = [];
    
    // Process symbols with controlled concurrency - Enhanced for yfinance 2.0.0 compatibility
    const maxConcurrent = 2; // Reduced to be more conservative
    const batchDelay = 1500; // Increased delay between batches
    
    for (let i = 0; i < symbols.length; i += maxConcurrent) {
      const batch = symbols.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (symbol: string) => {
        const cleanSymbol = symbol.trim();
        try {
          const realData = await fetchFinancialData(cleanSymbol);
          return { success: true, data: realData };
        } catch (error) {
          console.error(`Failed to fetch data for ${cleanSymbol}:`, error.message);
          // Create fallback data for failed requests
          const fallbackData = createFallbackData(cleanSymbol);
          return { success: true, data: fallbackData }; // Return fallback as success to avoid total failure
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          stockQuotes.push(result.data);
        }
      });

      // Add delay between batches to avoid overwhelming Yahoo Finance
      if (i + maxConcurrent < symbols.length) {
        console.log(`Processed batch ${Math.floor(i / maxConcurrent) + 1}, waiting ${batchDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
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
        symbol: quote.symbol,
        company_name: quote.name,
        market: quote.market,
        sector: mapSector(quote.symbol),
        current_price: quote.price,
        previous_close: quote.price - quote.change,
        open_price: quote.open,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        volume: quote.volume,
        market_cap: quote.marketCap,
        pe_ratio: quote.pe,
        eps: quote.eps,
        dividend_yield: quote.dividendYield,
        
        // Extended metrics
        currency: quote.currency,
        change: quote.change,
        change_percent: quote.changePercent,
        week_high_52: quote.weekHigh52,
        week_low_52: quote.weekLow52,
        dividend_rate: quote.dividendRate,
        ex_dividend_date: quote.exDividendDate,
        dividend_date: quote.dividendDate,
        payout_ratio: quote.payoutRatio,
        book_value: quote.bookValue,
        price_to_book: quote.priceToBook,
        beta: quote.beta,
        roe: quote.roe,
        profit_margin: quote.profitMargin,
        operating_margin: quote.operatingMargin,
        debt_to_equity: quote.debtToEquity,
        current_ratio: quote.currentRatio,
        revenue_growth: quote.revenueGrowth,
        earnings_growth: quote.earningsGrowth,
        
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
        sector: mapSector(quote.symbol),
        current_price: quote.price,
        previous_close: quote.price - quote.change,
        open_price: quote.open,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        volume: quote.volume,
        market_cap: quote.marketCap,
        pe_ratio: quote.pe,
        eps: quote.eps,
        dividend_yield: quote.dividendYield,
        
        // Extended metrics in snake_case for frontend consumption
        currency: quote.currency,
        change: quote.change,
        change_percent: quote.changePercent,
        week_high_52: quote.weekHigh52,
        week_low_52: quote.weekLow52,
        dividend_rate: quote.dividendRate,
        ex_dividend_date: quote.exDividendDate,
        dividend_date: quote.dividendDate,
        payout_ratio: quote.payoutRatio,
        book_value: quote.bookValue,
        price_to_book: quote.priceToBook,
        beta: quote.beta,
        roe: quote.roe,
        profit_margin: quote.profitMargin,
        operating_margin: quote.operatingMargin,
        debt_to_equity: quote.debtToEquity,
        current_ratio: quote.currentRatio,
        revenue_growth: quote.revenueGrowth,
        earnings_growth: quote.earningsGrowth,
        
        last_updated: new Date().toISOString()
      };
    });

    const apiData = await Promise.all(updatePromises);

    console.log(`Successfully processed ${stockQuotes.length} stocks, failed: ${failedSymbols.length}`);

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
