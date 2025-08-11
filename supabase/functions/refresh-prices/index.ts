import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string
      regularMarketPrice?: number
      regularMarketPreviousClose?: number
      currency?: string
      trailingAnnualDividendYield?: number
    }>
  }
}

interface StockInvestment {
  id: string
  symbol: string
  market: string
  yahoo_symbol?: string
}

function generateYahooSymbol(symbol: string, market: string): string {
  switch (market) {
    case 'TH':
      return symbol + '.BK'
    case 'JP':
      return symbol + '.T'
    case 'US':
      return symbol
    default:
      return symbol
  }
}

async function fetchYahooQuotes(symbols: string[]): Promise<YahooQuoteResponse> {
  const symbolsParam = symbols.join(',')
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`
  
  console.log(`Fetching quotes for: ${symbolsParam}`)
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

async function updateStockPrices(
  supabase: any,
  investments: StockInvestment[],
  quotes: YahooQuoteResponse
) {
  const updates = []
  
  for (const investment of investments) {
    const yahooSymbol = investment.yahoo_symbol || generateYahooSymbol(investment.symbol, investment.market)
    const quote = quotes.quoteResponse.result.find(q => q.symbol === yahooSymbol)
    
    if (quote) {
      const updateData: any = {
        yahoo_symbol: yahooSymbol,
        price_last_fetched_at: new Date().toISOString()
      }
      
      if (quote.regularMarketPrice !== undefined) {
        updateData.current_price = quote.regularMarketPrice
      }
      
      if (quote.regularMarketPreviousClose !== undefined) {
        updateData.previous_close = quote.regularMarketPreviousClose
      }
      
      if (quote.currency) {
        updateData.currency = quote.currency
      }
      
      if (quote.trailingAnnualDividendYield !== undefined) {
        updateData.current_dividend_yield = quote.trailingAnnualDividendYield * 100 // Convert to percentage
      }
      
      updates.push({
        id: investment.id,
        ...updateData
      })
    } else {
      console.warn(`No quote found for ${yahooSymbol} (${investment.symbol}, ${investment.market})`)
    }
  }
  
  // Batch update investments
  if (updates.length > 0) {
    for (const update of updates) {
      const { error } = await supabase
        .from('stock_investments')
        .update(update)
        .eq('id', update.id)
      
      if (error) {
        console.error(`Error updating investment ${update.id}:`, error)
      }
    }
    
    console.log(`Successfully updated ${updates.length} investments`)
  }
  
  return updates.length
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase service role key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get optional user_id from query parameters
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')
    
    // Build query for stock investments
    let query = supabase
      .from('stock_investments')
      .select('id, symbol, market, yahoo_symbol')
      .limit(1000) // Limit to prevent overuse
    
    // Filter by user_id if provided
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data: investments, error: queryError } = await query
    
    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`)
    }
    
    if (!investments || investments.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No investments found',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Found ${investments.length} investments to update`)
    
    // Group by yahoo_symbol to avoid duplicate API calls
    const symbolMap = new Map<string, StockInvestment[]>()
    
    for (const investment of investments) {
      const yahooSymbol = investment.yahoo_symbol || generateYahooSymbol(investment.symbol, investment.market)
      
      if (!symbolMap.has(yahooSymbol)) {
        symbolMap.set(yahooSymbol, [])
      }
      symbolMap.get(yahooSymbol)!.push(investment)
    }
    
    const uniqueSymbols = Array.from(symbolMap.keys())
    let totalUpdated = 0
    
    // Process in batches of 50 symbols to avoid rate limits
    const batchSize = 50
    for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
      const batch = uniqueSymbols.slice(i, i + batchSize)
      
      try {
        // Fetch quotes for this batch
        const quotes = await fetchYahooQuotes(batch)
        
        // Get all investments for this batch
        const batchInvestments = batch.flatMap(symbol => symbolMap.get(symbol) || [])
        
        // Update prices for this batch
        const updated = await updateStockPrices(supabase, batchInvestments, quotes)
        totalUpdated += updated
        
        // Add small delay between batches to be respectful
        if (i + batchSize < uniqueSymbols.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
      } catch (error) {
        console.error(`Error processing batch ${i}-${i + batchSize}:`, error)
        // Continue with next batch
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Price refresh completed`,
        processed: investments.length,
        updated: totalUpdated,
        unique_symbols: uniqueSymbols.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in refresh-prices function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to refresh prices'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})