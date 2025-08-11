
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

// Normalize symbol for different markets
function normalizeSymbol(symbol: string): string {
  // Trim and uppercase
  let normalized = symbol.trim().toUpperCase();
  
  // Convert .SET suffix to .BK for Thai market
  if (normalized.endsWith('.SET')) {
    normalized = normalized.replace('.SET', '.BK');
  }
  
  // Future enhancement: auto-append .BK for Thai symbols based on market parameter
  // For now, keep logic simple to avoid false positives unless suffix provided
  
  return normalized;
}

// Fetch comprehensive financial data from multiple Yahoo Finance endpoints
async function fetchFinancialData(symbol: string) {
  try {
    console.log(`Fetching data for ${symbol} from Yahoo Finance`);
    
    // Normalize symbol for different markets
    const cleanSymbol = normalizeSymbol(symbol);
    
    // Legacy logic for Thai stocks - maintain compatibility
    let finalSymbol = cleanSymbol;
    if (symbol.includes('.BK') || symbol.includes('.SET')) {
      if (!finalSymbol.includes('.BK')) {
        finalSymbol = finalSymbol.replace('.SET', '.BK');
        if (!finalSymbol.includes('.BK')) {
          finalSymbol = finalSymbol + '.BK';
        }
      }
    }

    console.log(`Using symbol: ${finalSymbol}`);

    // Fetch from multiple endpoints in parallel
    const [chartData, summaryData] = await Promise.all([
      fetchChartData(finalSymbol),
      fetchQuoteSummary(finalSymbol)
    ]);

    return parseComprehensiveData(chartData, summaryData, symbol, finalSymbol);
    
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    // Throw error instead of using createFallbackData to mark symbol as failed
    throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
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
    const response = await fetch(summaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Summary API failed for ${symbol}, status: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching summary for ${symbol}:`, error);
    return null;
  }
}

function parseComprehensiveData(chartData: unknown, summaryData: unknown, originalSymbol: string, cleanSymbol: string) {
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

    // Extract basic price data - only use real values, null if missing
    const currentPrice = meta.regularMarketPrice || null;
    const previousClose = meta.previousClose || null;
    
    // If both current price and previous close are missing, mark as failed
    if (currentPrice === null && previousClose === null) {
      throw new Error('No valid current price or previous close data available');
    }
    
    // Only compute change and changePercent when both values are present; otherwise null
    let change = null;
    let changePercent = null;
    if (currentPrice !== null && previousClose !== null) {
      change = currentPrice - previousClose;
      changePercent = previousClose > 0 ? (change / previousClose) * 100 : null;
    }

    // Determine market and currency
    const isThaiStock = originalSymbol.includes('.BK') || originalSymbol.includes('.SET');
    const market = isThaiStock ? 'SET' : (meta.exchangeName || 'NASDAQ');
    const currency = isThaiStock ? 'THB' : (meta.currency || 'USD');

    // Get latest quote data from chart - only real values, null if not available
    const volume = meta.regularMarketVolume || quotes?.volume?.slice(-1)?.[0] || null;
    const dayHigh = meta.regularMarketDayHigh || quotes?.high?.slice(-1)?.[0] || null;
    const dayLow = meta.regularMarketDayLow || quotes?.low?.slice(-1)?.[0] || null;
    const open = meta.regularMarketOpen || quotes?.open?.slice(-1)?.[0] || null;

    // Extract financial data from summary API - all null if not provided by Yahoo
    let financialData = {
      marketCap: null,
      pe: null,
      eps: null,
      bookValue: null,
      priceToBook: null,
      profitMargin: null,
      operatingMargin: null,
      returnOnEquity: null,
      debtToEquity: null,
      currentRatio: null,
      revenueGrowth: null,
      earningsGrowth: null
    };
    
    let dividendData = {
      dividendYield: null,
      dividendRate: null,
      exDividendDate: null,
      dividendDate: null,
      payoutRatio: null
    };
    
    let keyStats = {
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      beta: null,
      sharesOutstanding: null
    };
    
    if (summaryData?.quoteSummary?.result?.[0]) {
      const summaryResult = summaryData.quoteSummary.result[0];
      
      // Financial metrics - only use real values from Yahoo, null if not provided
      const defaultKeyStats = summaryResult.defaultKeyStatistics || {};
      const financialInfo = summaryResult.financialData || {};
      const summaryDetail = summaryResult.summaryDetail || {};
      const price = summaryResult.price || {};
      
      financialData = {
        // marketCap: null if not provided by Yahoo Finance
        marketCap: price.marketCap?.raw || meta.marketCap || null,
        // pe: null if not provided by Yahoo Finance  
        pe: defaultKeyStats.forwardPE?.raw || defaultKeyStats.trailingPE?.raw || 
            summaryDetail.forwardPE?.raw || summaryDetail.trailingPE?.raw || null,
        // eps: null if not provided by Yahoo Finance
        eps: defaultKeyStats.trailingEps?.raw || financialInfo.trailingEps?.raw || null,
        // bookValue: null if not provided by Yahoo Finance
        bookValue: defaultKeyStats.bookValue?.raw || null,
        // priceToBook: null if not provided by Yahoo Finance
        priceToBook: defaultKeyStats.priceToBook?.raw || null,
        
        // Financial health metrics - null if not provided by Yahoo Finance
        profitMargin: financialInfo.profitMargins?.raw || null,
        operatingMargin: financialInfo.operatingMargins?.raw || null,
        returnOnEquity: financialInfo.returnOnEquity?.raw || null,
        debtToEquity: financialInfo.debtToEquity?.raw || null,
        currentRatio: financialInfo.currentRatio?.raw || null,
        
        // Growth metrics - null if not provided by Yahoo Finance
        revenueGrowth: financialInfo.revenueGrowth?.raw || null,
        earningsGrowth: financialInfo.earningsGrowth?.raw || null
      };
      
      // Dividend information - null if not provided by Yahoo Finance
      dividendData = {
        dividendYield: summaryDetail.dividendYield?.raw || 
                      summaryDetail.trailingAnnualDividendYield?.raw || null,
        dividendRate: summaryDetail.dividendRate?.raw || 
                     summaryDetail.trailingAnnualDividendRate?.raw || null,
        exDividendDate: summaryDetail.exDividendDate?.fmt || null,
        dividendDate: summaryDetail.dividendDate?.fmt || null,
        payoutRatio: summaryDetail.payoutRatio?.raw || null
      };
      
      // Additional key statistics - null if not provided by Yahoo Finance
      keyStats = {
        fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || 
                         defaultKeyStats.fiftyTwoWeekHigh?.raw || 
                         meta.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || 
                        defaultKeyStats.fiftyTwoWeekLow?.raw || 
                        meta.fiftyTwoWeekLow || null,
        beta: defaultKeyStats.beta?.raw || null,
        sharesOutstanding: defaultKeyStats.sharesOutstanding?.raw || 
                          price.sharesOutstanding?.raw || null
      };
    }

    console.log(`Successfully parsed comprehensive data for ${originalSymbol}: price=${currentPrice}, PE=${financialData.pe}, dividend=${dividendData.dividendYield}`);

    return {
      symbol: originalSymbol,
      name: meta.longName || meta.shortName || cleanSymbol,
      price: currentPrice,
      current_price: currentPrice,
      previous_close: previousClose, // Use real previousClose from meta, not computed
      change: change,
      changePercent: changePercent,
      market: market,
      currency: currency,
      
      // Price data - null means data not provided by Yahoo
      open: open,
      dayHigh: dayHigh,
      dayLow: dayLow,
      volume: volume,
      
      // Financial metrics - null means data not provided by Yahoo
      marketCap: financialData.marketCap,
      pe: financialData.pe,
      eps: financialData.eps,
      bookValue: financialData.bookValue,
      priceToBook: financialData.priceToBook,
      
      // Dividend data - null means data not provided by Yahoo
      dividendYield: dividendData.dividendYield,
      dividendRate: dividendData.dividendRate,
      exDividendDate: dividendData.exDividendDate,
      dividendDate: dividendData.dividendDate,
      payoutRatio: dividendData.payoutRatio,
      
      // 52-week range - null means data not provided by Yahoo
      weekHigh52: keyStats.fiftyTwoWeekHigh,
      weekLow52: keyStats.fiftyTwoWeekLow,
      beta: keyStats.beta,
      
      // Financial health ratios - null means data not provided by Yahoo
      roe: financialData.returnOnEquity,
      profitMargin: financialData.profitMargin,
      operatingMargin: financialData.operatingMargin,
      debtToEquity: financialData.debtToEquity,
      currentRatio: financialData.currentRatio,
      
      // Growth metrics - null means data not provided by Yahoo
      revenueGrowth: financialData.revenueGrowth,
      earningsGrowth: financialData.earningsGrowth,
      
      success: true
    };
    
  } catch (error) {
    console.error(`Error parsing comprehensive data for ${originalSymbol}:`, error);
    // Throw error instead of using createFallbackData to mark symbol as failed
    throw new Error(`Failed to parse data for ${originalSymbol}: ${error.message}`);
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

    // Update stock_markets table with real data only
    const updatePromises = stockQuotes.map(async (quote) => {
      const stockData = {
        symbol: quote.symbol,
        company_name: quote.name,
        market: quote.market,
        sector: mapSector(quote.symbol),
        current_price: quote.price,
        previous_close: quote.previous_close, // Use real previous_close from Yahoo meta
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
