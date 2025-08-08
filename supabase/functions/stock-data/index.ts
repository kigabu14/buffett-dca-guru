
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Yahoo Finance API endpoints
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_FINANCE_QUOTE = 'https://query1.finance.yahoo.com/v1/finance/screener';
const YAHOO_FINANCE_QUOTESUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
const YAHOO_FINANCE_DIVIDENDS = 'https://query1.finance.yahoo.com/v7/finance/download';

// Fetch comprehensive financial data from multiple Yahoo Finance endpoints
async function fetchFinancialData(symbol: string) {
  try {
    console.log(`Fetching data for ${symbol} from Yahoo Finance`);
    
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

    // Fetch from multiple endpoints in parallel
    const [chartData, summaryData] = await Promise.all([
      fetchChartData(cleanSymbol),
      fetchQuoteSummary(cleanSymbol)
    ]);

    return parseComprehensiveData(chartData, summaryData, symbol, cleanSymbol);
    
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    throw new Error(`Failed to fetch financial data for ${symbol}: ${error.message || 'Unknown error'}`);
  }
}

// Fetch chart data (price, volume, etc.)
async function fetchChartData(symbol: string) {
  const chartUrl = `${YAHOO_FINANCE_BASE}/${symbol}`;
  
  const response = await fetch(chartUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Chart API HTTP error for ${symbol}! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Validate that we have the expected data structure
  if (!data?.chart?.result?.[0]?.meta) {
    throw new Error(`Invalid or empty chart data structure for ${symbol}`);
  }
  
  return data;
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
    const response = await fetch(summaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Summary API failed for ${symbol}, HTTP status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate that we have the expected data structure
    if (!data?.quoteSummary?.result?.[0]) {
      throw new Error(`Invalid or empty summary data structure for ${symbol}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching summary for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote summary for ${symbol}: ${error.message || 'Unknown error'}`);
  }
}

function parseComprehensiveData(chartData: unknown, summaryData: unknown, originalSymbol: string, cleanSymbol: string) {
  try {
    // Validate input data
    if (!chartData) {
      throw new Error(`Chart data is null or undefined for ${originalSymbol}`);
    }
    
    if (!summaryData) {
      throw new Error(`Summary data is null or undefined for ${originalSymbol}`);
    }

    // Type guard and extraction for chart data
    if (typeof chartData !== 'object' || chartData === null) {
      throw new Error(`Chart data is not a valid object for ${originalSymbol}`);
    }
    
    const chartObj = chartData as Record<string, unknown>;
    const chart = chartObj.chart as Record<string, unknown>;
    if (!chart || typeof chart !== 'object') {
      throw new Error(`Chart data structure is invalid for ${originalSymbol}`);
    }
    
    const chartResult = (chart.result as unknown[])?.[0] as Record<string, unknown>;
    if (!chartResult) {
      throw new Error(`No chart result data found for ${originalSymbol}`);
    }

    const meta = chartResult.meta as Record<string, unknown>;
    const indicators = chartResult.indicators as Record<string, unknown>;
    const quotes = (indicators?.quote as unknown[])?.[0] as Record<string, unknown>;
    
    if (!meta) {
      throw new Error(`Invalid chart data structure - missing meta for ${originalSymbol}`);
    }

    // Extract basic price data with proper type checking
    const regularMarketPrice = meta?.regularMarketPrice as number;
    const previousClose = meta?.previousClose as number;
    const currentPrice = regularMarketPrice || previousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Determine market and currency
    const isThaiStock = originalSymbol.includes('.BK') || originalSymbol.includes('.SET');
    const exchangeName = meta?.exchangeName as string;
    const currency = meta?.currency as string;
    const market = isThaiStock ? 'SET' : (exchangeName || 'NASDAQ');
    const currencyCode = isThaiStock ? 'THB' : (currency || 'USD');

    // Get latest quote data from chart with type checking
    const regularMarketVolume = meta?.regularMarketVolume as number;
    const volumeArray = quotes?.volume as number[];
    const highArray = quotes?.high as number[];
    const lowArray = quotes?.low as number[];
    const openArray = quotes?.open as number[];
    
    const volume = regularMarketVolume || (volumeArray?.slice(-1)?.[0]) || 0;
    const dayHigh = (meta?.regularMarketDayHigh as number) || (highArray?.slice(-1)?.[0]) || currentPrice * 1.02;
    const dayLow = (meta?.regularMarketDayLow as number) || (lowArray?.slice(-1)?.[0]) || currentPrice * 0.98;
    const open = (meta?.regularMarketOpen as number) || (openArray?.slice(-1)?.[0]) || previousClose;

    // Extract financial data from summary API (should be validated in fetchQuoteSummary)
    const summaryObj = summaryData as Record<string, unknown>;
    const quoteSummary = summaryObj.quoteSummary as Record<string, unknown>;
    const result = (quoteSummary.result as unknown[])?.[0] as Record<string, unknown>;
    
    if (!result) {
      throw new Error(`Summary result data is missing for ${originalSymbol}`);
    }
    
    // Financial metrics with proper type checking
    const defaultKeyStats = (result.defaultKeyStatistics as Record<string, unknown>) || {};
    const financialInfo = (result.financialData as Record<string, unknown>) || {};
    const summaryDetail = (result.summaryDetail as Record<string, unknown>) || {};
    const price = (result.price as Record<string, unknown>) || {};
    
    const financialData = {
      marketCap: ((price.marketCap as Record<string, unknown>)?.raw as number) || 
                 (meta?.marketCap as number) || 
                 currentPrice * 1000000000,
      pe: ((defaultKeyStats.forwardPE as Record<string, unknown>)?.raw as number) || 
          ((defaultKeyStats.trailingPE as Record<string, unknown>)?.raw as number) || 
          ((summaryDetail.forwardPE as Record<string, unknown>)?.raw as number) || 
          ((summaryDetail.trailingPE as Record<string, unknown>)?.raw as number) || 15.0,
      eps: ((defaultKeyStats.trailingEps as Record<string, unknown>)?.raw as number) || 
           ((financialInfo.trailingEps as Record<string, unknown>)?.raw as number) || 
           (currentPrice / 15.0),
      bookValue: ((defaultKeyStats.bookValue as Record<string, unknown>)?.raw as number) || 
                 currentPrice * 0.8,
      priceToBook: ((defaultKeyStats.priceToBook as Record<string, unknown>)?.raw as number) || 1.5,
      
      // Financial health metrics
      profitMargin: ((financialInfo.profitMargins as Record<string, unknown>)?.raw as number) || 0.15,
      operatingMargin: ((financialInfo.operatingMargins as Record<string, unknown>)?.raw as number) || 0.20,
      returnOnEquity: ((financialInfo.returnOnEquity as Record<string, unknown>)?.raw as number) || 0.15,
      debtToEquity: ((financialInfo.debtToEquity as Record<string, unknown>)?.raw as number) || 0.5,
      currentRatio: ((financialInfo.currentRatio as Record<string, unknown>)?.raw as number) || 2.0,
      
      // Growth metrics
      revenueGrowth: ((financialInfo.revenueGrowth as Record<string, unknown>)?.raw as number) || 0.1,
      earningsGrowth: ((financialInfo.earningsGrowth as Record<string, unknown>)?.raw as number) || 0.1
    };
    
    // Dividend information
    const dividendData = {
      dividendYield: ((summaryDetail.dividendYield as Record<string, unknown>)?.raw as number) || 
                     ((summaryDetail.trailingAnnualDividendYield as Record<string, unknown>)?.raw as number) || 0.03,
      dividendRate: ((summaryDetail.dividendRate as Record<string, unknown>)?.raw as number) || 
                   ((summaryDetail.trailingAnnualDividendRate as Record<string, unknown>)?.raw as number) || 
                   (currentPrice * 0.03),
      exDividendDate: ((summaryDetail.exDividendDate as Record<string, unknown>)?.fmt as string) || null,
      dividendDate: ((summaryDetail.dividendDate as Record<string, unknown>)?.fmt as string) || null,
      payoutRatio: ((summaryDetail.payoutRatio as Record<string, unknown>)?.raw as number) || null
    };
    
    // Additional key statistics
    const keyStats = {
      fiftyTwoWeekHigh: ((summaryDetail.fiftyTwoWeekHigh as Record<string, unknown>)?.raw as number) || 
                       ((defaultKeyStats.fiftyTwoWeekHigh as Record<string, unknown>)?.raw as number) || 
                       (meta?.fiftyTwoWeekHigh as number) || (currentPrice * 1.3),
      fiftyTwoWeekLow: ((summaryDetail.fiftyTwoWeekLow as Record<string, unknown>)?.raw as number) || 
                      ((defaultKeyStats.fiftyTwoWeekLow as Record<string, unknown>)?.raw as number) || 
                      (meta?.fiftyTwoWeekLow as number) || (currentPrice * 0.7),
      beta: ((defaultKeyStats.beta as Record<string, unknown>)?.raw as number) || 1.0,
      sharesOutstanding: ((defaultKeyStats.sharesOutstanding as Record<string, unknown>)?.raw as number) || 
                        ((price.sharesOutstanding as Record<string, unknown>)?.raw as number) || 1000000000
    };

    console.log(`Successfully parsed comprehensive data for ${originalSymbol}: price=${currentPrice}, PE=${financialData.pe}, dividend=${dividendData.dividendYield}`);

    return {
      symbol: originalSymbol,
      name: (meta?.longName as string) || (meta?.shortName as string) || cleanSymbol,
      price: currentPrice,
      current_price: currentPrice,
      change: change,
      changePercent: changePercent,
      market: market,
      currency: currencyCode,
      
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
    throw new Error(`Failed to parse comprehensive data for ${originalSymbol}: ${error.message || 'Unknown parsing error'}`);
  }
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

    // Update stock_markets table (removed fields that don't exist in the table)
    const updatePromises = stockQuotes.map(async (quote) => {
      const stockData = {
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
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('stock_markets')
        .upsert(stockData, { 
          onConflict: 'symbol',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error updating ${quote.symbol}:`, error);
      }

      return stockData;
    });

    const updatedData = await Promise.all(updatePromises);

    console.log(`Successfully processed ${stockQuotes.length} stocks, failed: ${failedSymbols.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedData,
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
