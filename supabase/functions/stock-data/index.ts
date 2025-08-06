import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface YahooFinanceQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap?: number;
  trailingPE?: number;
  trailingEps?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency: string;
  exchange: string;
}

interface YahooFinanceResponse {
  quoteResponse: {
    result: YahooFinanceQuote[];
    error: any;
  };
}

async function fetchYahooFinanceData(symbols: string[]): Promise<YahooFinanceQuote[]> {
  try {
    const symbolsString = symbols.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}&fields=symbol,shortName,longName,regularMarketPrice,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,marketCap,trailingPE,trailingEps,dividendYield,fiftyTwoWeekHigh,fiftyTwoWeekLow,currency,exchange`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: YahooFinanceResponse = await response.json();
    
    if (data.quoteResponse.error) {
      throw new Error(data.quoteResponse.error);
    }

    return data.quoteResponse.result || [];
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    throw error;
  }
}

function determineMarket(symbol: string, exchange?: string): string {
  // หุ้นไทย
  if (symbol.includes('.BK') || exchange === 'BKK') {
    return 'SET';
  }
  
  // หุ้นสหรัฐ
  if (exchange === 'NMS' || exchange === 'NYQ' || exchange === 'NGM') {
    return 'NASDAQ';
  }
  
  if (exchange === 'NYQ') {
    return 'NYSE';
  }

  // Default based on symbol format
  if (symbol.includes('.BK')) return 'SET';
  return 'NASDAQ';
}

function mapSector(exchange?: string, symbol?: string): string {
  // สำหรับหุ้นไทย - mapping พื้นฐาน
  if (exchange === 'BKK' || symbol?.includes('.BK')) {
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
    if (['CPF', 'CBF', 'GFPT'].includes(thaiSymbol)) {
      return 'Agro & Food Industry';
    }
  }
  
  return 'Unknown';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching data for symbols:', symbols);

    // ดึงข้อมูลจาก Yahoo Finance
    const yahooData = await fetchYahooFinanceData(symbols);
    
    if (yahooData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data found for provided symbols' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // เชื่อมต่อ Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // อัพเดทข้อมูลในฐานข้อมูล
    const updatePromises = yahooData.map(async (quote) => {
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
        dividend_yield: quote.dividendYield ? quote.dividendYield * 100 : null, // Convert to percentage
        last_updated: new Date().toISOString()
      };

      // อัพเซิร์ทข้อมูล (insert หรือ update)
      const { error } = await supabase
        .from('stock_markets')
        .upsert(stockData, { 
          onConflict: 'symbol',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error updating ${quote.symbol}:`, error);
        throw error;
      }

      return stockData;
    });

    const updatedData = await Promise.all(updatePromises);

    console.log(`Successfully updated ${updatedData.length} stocks`);

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updatedData.length,
        data: updatedData
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