import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Yahoo Finance API function with proper error handling
async function fetchYahooFinanceData(symbol: string) {
  try {
    // Use the chart API endpoint for real-time data
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid response format from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // Extract the latest data point
    const latestIndex = quote?.close?.length - 1 || 0;
    const currentPrice = meta.regularMarketPrice || quote?.close?.[latestIndex] || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      symbol: meta.symbol,
      shortName: meta.shortName || symbol,
      longName: meta.longName || meta.shortName || symbol,
      regularMarketPrice: currentPrice,
      regularMarketPreviousClose: previousClose,
      regularMarketOpen: meta.regularMarketOpen || currentPrice,
      regularMarketDayHigh: meta.regularMarketDayHigh || currentPrice,
      regularMarketDayLow: meta.regularMarketDayLow || currentPrice,
      regularMarketVolume: quote?.volume?.[latestIndex] || meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || 0,
      trailingPE: meta.trailingPE || 0,
      trailingEps: meta.epsTrailingTwelveMonths || 0,
      dividendYield: meta.dividendYield || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || meta.market || 'UNKNOWN',
      success: true
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error);
    throw error;
  }
}

// Enhanced sample data with Warren Buffett analysis metrics
function generateErrorResponse(symbols: string[], errorMsg: string) {
  return symbols.map(symbol => ({
    symbol,
    error: errorMsg,
    success: false,
    isSampleData: false,
    company_name: `Error fetching ${symbol}`,
    market: 'UNKNOWN',
    current_price: 0,
    change: 0,
    changePercent: 0,
    currency: 'USD'
  }));
}

function determineMarket(symbol: string, exchange?: string): string {
  if (symbol.includes('.BK') || exchange === 'SET') {
    return 'SET';
  }
  
  if (exchange === 'NMS' || exchange === 'NGM' || exchange === 'NASDAQ') {
    return 'NASDAQ';
  }
  
  if (exchange === 'NYQ' || exchange === 'NYSE') {
    return 'NYSE';
  }

  return symbol.includes('.BK') ? 'SET' : 'NASDAQ';
}

function mapSector(exchange?: string, symbol?: string): string {
  if (exchange === 'SET' || symbol?.includes('.BK')) {
    const thaiSymbol = symbol?.replace('.BK', '') || '';
    if (['BBL', 'KBANK', 'KTB', 'SCB', 'TTB'].includes(thaiSymbol)) {
      return 'Banking';
    }
    if (['ADVANC', 'INTUCH', 'TRUE'].includes(thaiSymbol)) {
      return 'Technology';
    }
    if (['CPALL', 'MAKRO', 'BJC'].includes(thaiSymbol)) {
      return 'Commerce';
    }
    if (['PTTEP', 'PTT', 'TOP', 'BANPU'].includes(thaiSymbol)) {
      return 'Energy & Utilities';
    }
    if (['AOT', 'MINT', 'ERAWAN'].includes(thaiSymbol)) {
      return 'Tourism & Leisure';
    }
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

    console.log('Fetching data for symbols:', symbols);

    const stockQuotes = [];
    let failedSymbols = [];
    
    for (const symbol of symbols) {
      const cleanSymbol = symbol.trim();
      
      try {
        console.log(`Attempting to fetch real data for ${cleanSymbol}`);
        const realData = await fetchYahooFinanceData(cleanSymbol);
        stockQuotes.push(realData);
        console.log(`Successfully fetched real data for ${cleanSymbol}`);
      } catch (error) {
        console.error(`Error fetching Yahoo Finance data for ${cleanSymbol}:`, error);
        failedSymbols.push(cleanSymbol);
      }
    }
    
    if (stockQuotes.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Yahoo Finance API unavailable',
          message: `ไม่สามารถดึงข้อมูลจาก Yahoo Finance ได้สำหรับ: ${failedSymbols.join(', ')}`,
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

    // เชื่อมต่อ Supabase และอัพเดทข้อมูล
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updatePromises = stockQuotes.map(async (quote) => {
      const stockData = {
        symbol: quote.symbol,
        company_name: quote.longName || quote.shortName || quote.symbol,
        market: determineMarket(quote.symbol, quote.exchange),
        sector: mapSector(quote.exchange, quote.symbol),
        current_price: quote.regularMarketPrice,
        previous_close: quote.regularMarketPreviousClose,
        open_price: quote.regularMarketOpen,
        day_high: quote.regularMarketDayHigh,
        day_low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        market_cap: quote.marketCap,
        pe_ratio: quote.trailingPE,
        eps: quote.trailingEps,
        dividend_yield: quote.dividendYield ? quote.dividendYield * 100 : null,
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

      return {
        ...stockData,
        change: quote.regularMarketPrice - quote.regularMarketPreviousClose,
        changePercent: quote.regularMarketPreviousClose ? 
          ((quote.regularMarketPrice - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose) * 100 : 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        currency: quote.currency,
        success: quote.success || false,
        isSampleData: quote.isSampleData || false
      };
    });

    const updatedData = await Promise.all(updatePromises);

    console.log(`Successfully processed ${updatedData.length} stocks`);

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedData,
        failedSymbols,
        yahooApiStatus: 'connected',
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
        error: 'Yahoo Finance API Error',
        message: 'ไม่สามารถเชื่อมต่อกับ Yahoo Finance API ได้',
        details: error.message,
        success: false,
        yahooApiStatus: 'disconnected'
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});