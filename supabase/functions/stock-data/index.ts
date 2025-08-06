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
function getSampleStockData(symbol: string) {
  const basePrice = Math.random() * 1000 + 50;
  const change = (Math.random() - 0.5) * 20;
  const changePercent = (change / basePrice) * 100;
  
  const sampleData = {
    // Thai stocks (SET100)
    'AOT.BK': { name: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', price: 65.50, market: 'SET' },
    'BBL.BK': { name: 'ธนาคารกรุงเทพ จำกัด (มหาชน)', price: 148.00, market: 'SET' },
    'KBANK.BK': { name: 'ธนาคารกสิกรไทย จำกัด (มหาชน)', price: 132.50, market: 'SET' },
    'PTT.BK': { name: 'บริษัท ปตท. จำกัด (มหาชน)', price: 36.25, market: 'SET' },
    'PTTEP.BK': { name: 'บริษัท ปตท. สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)', price: 107.00, market: 'SET' },
    'SCB.BK': { name: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', price: 98.75, market: 'SET' },
    'CPALL.BK': { name: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)', price: 52.50, market: 'SET' },
    'ADVANC.BK': { name: 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)', price: 168.50, market: 'SET' },
    'SCC.BK': { name: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)', price: 285.00, market: 'SET' },
    'TOP.BK': { name: 'บริษัท ไทยออยล์ จำกัด (มหาชน)', price: 45.75, market: 'SET' },
    // US stocks
    'AAPL': { name: 'Apple Inc.', price: 184.40, market: 'NASDAQ' },
    'TSLA': { name: 'Tesla Inc.', price: 248.87, market: 'NASDAQ' },
    'GOOGL': { name: 'Alphabet Inc.', price: 142.56, market: 'NASDAQ' },
    'MSFT': { name: 'Microsoft Corporation', price: 338.50, market: 'NASDAQ' },
    'AMZN': { name: 'Amazon.com Inc.', price: 155.20, market: 'NASDAQ' },
    'META': { name: 'Meta Platforms Inc.', price: 524.26, market: 'NASDAQ' },
    'NVDA': { name: 'NVIDIA Corporation', price: 875.28, market: 'NASDAQ' }
  };

  const stockInfo = sampleData[symbol as keyof typeof sampleData];
  const finalPrice = stockInfo?.price || basePrice;
  
  return {
    symbol,
    shortName: symbol.replace('.BK', ''),
    longName: stockInfo?.name || symbol,
    regularMarketPrice: Math.round(finalPrice * 100) / 100,
    regularMarketPreviousClose: Math.round((finalPrice - change) * 100) / 100,
    regularMarketOpen: Math.round((finalPrice - (change * 0.5)) * 100) / 100,
    regularMarketDayHigh: Math.round((finalPrice + Math.abs(change)) * 100) / 100,
    regularMarketDayLow: Math.round((finalPrice - Math.abs(change)) * 100) / 100,
    regularMarketVolume: Math.floor(Math.random() * 10000000),
    marketCap: Math.round(finalPrice * Math.floor(Math.random() * 1000000000)),
    trailingPE: Math.round((Math.random() * 30 + 5) * 100) / 100,
    trailingEps: Math.round(Math.random() * 10 * 100) / 100,
    dividendYield: Math.round(Math.random() * 0.05 * 10000) / 10000,
    fiftyTwoWeekHigh: Math.round(finalPrice * (1 + Math.random() * 0.3) * 100) / 100,
    fiftyTwoWeekLow: Math.round(finalPrice * (1 - Math.random() * 0.3) * 100) / 100,
    currency: symbol.includes('.BK') ? 'THB' : 'USD',
    exchange: stockInfo?.market || (symbol.includes('.BK') ? 'SET' : 'NASDAQ'),
    success: false,
    isSampleData: true
  };
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
    
    for (const symbol of symbols) {
      const cleanSymbol = symbol.trim();
      
      try {
        console.log(`Attempting to fetch real data for ${cleanSymbol}`);
        const realData = await fetchYahooFinanceData(cleanSymbol);
        stockQuotes.push(realData);
        console.log(`Successfully fetched real data for ${cleanSymbol}`);
      } catch (error) {
        console.error(`Error fetching Yahoo Finance data for ${cleanSymbol}:`, error);
        console.log(`Using sample data for ${cleanSymbol}`);
        stockQuotes.push(getSampleStockData(cleanSymbol));
      }
    }
    
    if (stockQuotes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data found for provided symbols' }),
        { 
          status: 404,
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
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stock data fetch error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch stock data',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});