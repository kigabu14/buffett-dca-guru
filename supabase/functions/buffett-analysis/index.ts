import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buffett analysis based on Warren Buffett investment principles
function calculateBuffettAnalysis(stockData: any) {
  let score = 0;
  const criteria = [];
  
  // Extract financial metrics with defaults - use correct field names from stock-data
  const pe = stockData.pe_ratio || 15;
  const roe = stockData.roe || 0.15;
  const debtToEquity = stockData.debt_to_equity || 0.5;
  const profitMargin = stockData.profit_margin || 0.15;
  const operatingMargin = stockData.operating_margin || 0.20;
  const currentRatio = stockData.current_ratio || 2.0;
  const dividendYield = stockData.dividend_yield || 0.03;
  const eps = stockData.eps || (stockData.current_price || stockData.price || 100) / pe;
  const priceToBook = stockData.price_to_book || 1.5;
  const revenueGrowth = stockData.revenue_growth || 0.1;
  
  console.log(`Financial metrics for ${stockData.symbol}:`, {
    pe_ratio: pe,
    roe: roe,
    debt_to_equity: debtToEquity,
    profit_margin: profitMargin,
    operating_margin: operatingMargin,
    current_ratio: currentRatio,
    dividend_yield: dividendYield,
    eps: eps
  });
  
  // 1. Return on Equity (ROE) > 15%
  if (roe > 0.15) {
    score += 2;
    criteria.push({ name: 'ROE > 15%', status: 'pass', value: (roe * 100).toFixed(1) + '%', points: 2 });
  } else if (roe > 0.10) {
    score += 1;
    criteria.push({ name: 'ROE > 15%', status: 'partial', value: (roe * 100).toFixed(1) + '%', points: 1 });
  } else {
    criteria.push({ name: 'ROE > 15%', status: 'fail', value: (roe * 100).toFixed(1) + '%', points: 0 });
  }
  
  // 2. Debt to Equity < 0.5
  if (debtToEquity > 0 && debtToEquity < 0.3) {
    score += 2;
    criteria.push({ name: 'Low Debt/Equity', status: 'pass', value: debtToEquity.toFixed(2), points: 2 });
  } else if (debtToEquity > 0 && debtToEquity < 0.5) {
    score += 1;
    criteria.push({ name: 'Low Debt/Equity', status: 'partial', value: debtToEquity.toFixed(2), points: 1 });
  } else {
    criteria.push({ name: 'Low Debt/Equity', status: 'fail', value: debtToEquity.toFixed(2), points: 0 });
  }
  
  // 3. Profit Margin > 15%
  if (profitMargin > 0.15) {
    score += 2;
    criteria.push({ name: 'Profit Margin > 15%', status: 'pass', value: (profitMargin * 100).toFixed(1) + '%', points: 2 });
  } else if (profitMargin > 0.10) {
    score += 1;
    criteria.push({ name: 'Profit Margin > 15%', status: 'partial', value: (profitMargin * 100).toFixed(1) + '%', points: 1 });
  } else {
    criteria.push({ name: 'Profit Margin > 15%', status: 'fail', value: (profitMargin * 100).toFixed(1) + '%', points: 0 });
  }
  
  // 4. Operating Margin > 15%
  if (operatingMargin > 0.15) {
    score += 2;
    criteria.push({ name: 'Operating Margin > 15%', status: 'pass', value: (operatingMargin * 100).toFixed(1) + '%', points: 2 });
  } else if (operatingMargin > 0.10) {
    score += 1;
    criteria.push({ name: 'Operating Margin > 15%', status: 'partial', value: (operatingMargin * 100).toFixed(1) + '%', points: 1 });
  } else {
    criteria.push({ name: 'Operating Margin > 15%', status: 'fail', value: (operatingMargin * 100).toFixed(1) + '%', points: 0 });
  }
  
  // 5. Current Ratio > 1.5
  if (currentRatio > 1.5) {
    score += 2;
    criteria.push({ name: 'Current Ratio > 1.5', status: 'pass', value: currentRatio.toFixed(2), points: 2 });
  } else if (currentRatio > 1.0) {
    score += 1;
    criteria.push({ name: 'Current Ratio > 1.5', status: 'partial', value: currentRatio.toFixed(2), points: 1 });
  } else {
    criteria.push({ name: 'Current Ratio > 1.5', status: 'fail', value: currentRatio.toFixed(2), points: 0 });
  }
  
  // 6. P/E Ratio reasonable (< 20)
  if (pe > 0 && pe < 15) {
    score += 2;
    criteria.push({ name: 'Reasonable P/E', status: 'pass', value: pe.toFixed(1), points: 2 });
  } else if (pe > 0 && pe < 25) {
    score += 1;
    criteria.push({ name: 'Reasonable P/E', status: 'partial', value: pe.toFixed(1), points: 1 });
  } else {
    criteria.push({ name: 'Reasonable P/E', status: 'fail', value: pe.toFixed(1), points: 0 });
  }
  
  // 7. Dividend yield (consistent dividend payments)
  if (dividendYield > 0.02) {
    score += 2;
    criteria.push({ name: 'Dividend Yield > 2%', status: 'pass', value: (dividendYield * 100).toFixed(1) + '%', points: 2 });
  } else if (dividendYield > 0) {
    score += 1;
    criteria.push({ name: 'Dividend Yield > 2%', status: 'partial', value: (dividendYield * 100).toFixed(1) + '%', points: 1 });
  } else {
    criteria.push({ name: 'Dividend Yield > 2%', status: 'fail', value: '0%', points: 0 });
  }
  
  // 8. EPS positive
  if (eps > 0) {
    score += 1;
    criteria.push({ name: 'Positive EPS', status: 'pass', value: eps.toFixed(2), points: 1 });
  } else {
    criteria.push({ name: 'Positive EPS', status: 'fail', value: eps.toFixed(2), points: 0 });
  }
  
  // Determine recommendation
  let recommendation = 'AVOID';
  if (score >= 12) recommendation = 'STRONG_BUY';
  else if (score >= 8) recommendation = 'BUY';
  else if (score >= 5) recommendation = 'HOLD';
  
  return {
    symbol: stockData.symbol,
    total_score: score,
    max_score: 15,
    recommendation: recommendation,
    criteria: criteria,
    analysis_date: new Date().toISOString(),
    
    // Store individual metrics for reference - use consistent field names
    roe_percentage: roe * 100, // Convert to percentage
    debt_equity_ratio: debtToEquity,
    net_profit_margin: profitMargin * 100, // Convert to percentage
    operating_margin: operatingMargin * 100, // Convert to percentage
    current_ratio: currentRatio,
    pe_ratio: pe,
    dividend_yield: dividendYield * 100, // Convert to percentage
    eps: eps,
    price_to_book: priceToBook,
    revenue_growth: revenueGrowth,
    current_price: stockData.current_price || stockData.price
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { symbol } = body;
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ 
          error: 'Symbol is required',
          message: 'กรุณาส่งข้อมูล symbol'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing ${symbol} with Buffett criteria`);
    
    // First get real stock data from Yahoo Finance via stock-data function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Fetching fresh data for ${symbol} from Yahoo Finance...`);
    
    // Call stock-data function to get fresh data
    const { data: stockDataResponse, error: stockDataError } = await supabase.functions.invoke('stock-data', {
      body: { symbols: [symbol] }
    });
    
    if (stockDataError) {
      console.error(`Error fetching stock data for ${symbol}:`, stockDataError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch stock data',
          message: 'ไม่สามารถดึงข้อมูลหุ้นได้',
          details: stockDataError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const stockInfo = stockDataResponse?.data?.[0];
    if (!stockInfo) {
      return new Response(
        JSON.stringify({ 
          error: 'No stock data found',
          message: 'ไม่พบข้อมูลหุ้น'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Stock data for ${symbol}:`, JSON.stringify(stockInfo, null, 2));
    
    // Perform Buffett analysis with real data
    const analysis = calculateBuffettAnalysis(stockInfo);
    
    // Save analysis to database

    // Save to buffett_analysis table
    const { error } = await supabase
      .from('buffett_analysis')
      .upsert(analysis, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Error saving analysis for ${symbol}:`, error);
      // Continue anyway, return the analysis even if save fails
    }

    console.log(`Successfully analyzed ${symbol}: score=${analysis.total_score}, recommendation=${analysis.recommendation}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Buffett analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'เกิดข้อผิดพลาดในการวิเคราะห์',
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