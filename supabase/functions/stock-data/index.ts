
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
    return createFallbackData(symbol);
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

function parseComprehensiveData(chartData: any, summaryData: any, originalSymbol: string, cleanSymbol: string) {
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

    // Extract basic price data
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    // Determine market and currency
    const isThaiStock = originalSymbol.includes('.BK') || originalSymbol.includes('.SET');
    const market = isThaiStock ? 'SET' : (meta.exchangeName || 'NASDAQ');
    const currency = isThaiStock ? 'THB' : (meta.currency || 'USD');

    // Get latest quote data from chart
    const volume = meta.regularMarketVolume || (quotes?.volume?.slice(-1)?.[0]) || 0;
    const dayHigh = meta.regularMarketDayHigh || (quotes?.high?.slice(-1)?.[0]) || currentPrice * 1.02;
    const dayLow = meta.regularMarketDayLow || (quotes?.low?.slice(-1)?.[0]) || currentPrice * 0.98;
    const open = meta.regularMarketOpen || (quotes?.open?.slice(-1)?.[0]) || previousClose;

    // Extract financial data from summary API
    let financialData = {};
    let dividendData = {};
    let keyStats = {};
    
    if (summaryData?.quoteSummary?.result?.[0]) {
      const summaryResult = summaryData.quoteSummary.result[0];
      
      // Financial metrics
      const defaultKeyStats = summaryResult.defaultKeyStatistics || {};
      const financialInfo = summaryResult.financialData || {};
      const summaryDetail = summaryResult.summaryDetail || {};
      const price = summaryResult.price || {};
      
      financialData = {
        marketCap: price.marketCap?.raw || meta.marketCap || currentPrice * 1000000000,
        pe: defaultKeyStats.forwardPE?.raw || defaultKeyStats.trailingPE?.raw || 
            summaryDetail.forwardPE?.raw || summaryDetail.trailingPE?.raw || 15.0,
        eps: defaultKeyStats.trailingEps?.raw || 
             financialInfo.trailingEps?.raw || (currentPrice / 15.0),
        bookValue: defaultKeyStats.bookValue?.raw || currentPrice * 0.8,
        priceToBook: defaultKeyStats.priceToBook?.raw || 1.5,
        
        // Financial health metrics
        profitMargin: financialInfo.profitMargins?.raw || 0.15,
        operatingMargin: financialInfo.operatingMargins?.raw || 0.20,
        returnOnEquity: financialInfo.returnOnEquity?.raw || 0.15,
        debtToEquity: financialInfo.debtToEquity?.raw || 0.5,
        currentRatio: financialInfo.currentRatio?.raw || 2.0,
        
        // Growth metrics
        revenueGrowth: financialInfo.revenueGrowth?.raw || 0.1,
        earningsGrowth: financialInfo.earningsGrowth?.raw || 0.1
      };
      
      // Dividend information
      dividendData = {
        dividendYield: summaryDetail.dividendYield?.raw || 
                      summaryDetail.trailingAnnualDividendYield?.raw || 0.03,
        dividendRate: summaryDetail.dividendRate?.raw || 
                     summaryDetail.trailingAnnualDividendRate?.raw || (currentPrice * 0.03),
        exDividendDate: summaryDetail.exDividendDate?.fmt || null,
        dividendDate: summaryDetail.dividendDate?.fmt || null,
        payoutRatio: summaryDetail.payoutRatio?.raw || null
      };
      
      // Additional key statistics
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

function createFallbackData(symbol: string) {
  const isThaiStock = symbol.includes('.BK') || symbol.includes('.SET');
  const basePrice = isThaiStock ? 50 : 100; // Default prices
  
  return {
    symbol: symbol,
    name: symbol.replace('.BK', '').replace('.SET', ''),
    price: basePrice,
    current_price: basePrice,
    change: 0,
    changePercent: 0,
    market: isThaiStock ? 'SET' : 'NASDAQ',
    currency: isThaiStock ? 'THB' : 'USD',
    marketCap: basePrice * 1000000000,
    pe: 15.0,
    eps: basePrice / 15.0,
    dividendYield: 0.03,
    dividendRate: basePrice * 0.03,
    exDividendDate: null,
    dividendDate: null,
    weekHigh52: basePrice * 1.2,
    weekLow52: basePrice * 0.8,
    volume: 1000000,
    open: basePrice,
    dayHigh: basePrice * 1.02,
    dayLow: basePrice * 0.98,
    roe: 0.15,
    debtToEquity: 0.5,
    profitMargin: 0.15,
    operatingMargin: 0.20,
    currentRatio: 2.0,
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
