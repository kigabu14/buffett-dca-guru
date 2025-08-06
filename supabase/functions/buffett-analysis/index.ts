import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinancialData {
  symbol: string;
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  operatingIncome: number;
  freeCashFlow: number;
  eps: number;
  sharesOutstanding: number;
  currentAssets: number;
  currentLiabilities: number;
}

interface BuffettScore {
  roe_score: number;
  debt_equity_ratio_score: number;
  net_profit_margin_score: number;
  free_cash_flow_score: number;
  eps_growth_score: number;
  operating_margin_score: number;
  current_ratio_score: number;
  share_dilution_score: number;
  roa_score: number;
  moat_score: number;
  management_score: number;
  recommendation: 'DCA_MORE' | 'HOLD' | 'REDUCE_SELL';
}

// ดึงข้อมูลทางการเงินจาก Yahoo Finance
async function fetchFinancialData(symbol: string): Promise<FinancialData | null> {
  try {
    // สำหรับ demo - ในการใช้งานจริงต้องใช้ API ที่ให้ข้อมูลทางการเงินเชิงลึก
    // เช่น Alpha Vantage, Financial Modeling Prep, หรือ IEX Cloud
    
    const response = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData,balanceSheetHistory,incomeStatementHistory,cashflowStatementHistory`);
    
    if (!response.ok) {
      console.log(`Failed to fetch financial data for ${symbol}`);
      return null;
    }

    const data = await response.json();
    
    // Parse ข้อมูลจาก Yahoo Finance API
    const financialData = data.quoteSummary?.result?.[0];
    if (!financialData) return null;

    return {
      symbol,
      revenue: financialData.incomeStatementHistory?.incomeStatementHistory?.[0]?.totalRevenue?.raw || 0,
      netIncome: financialData.incomeStatementHistory?.incomeStatementHistory?.[0]?.netIncome?.raw || 0,
      totalAssets: financialData.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalAssets?.raw || 0,
      totalEquity: financialData.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalStockholderEquity?.raw || 0,
      totalDebt: financialData.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalDebt?.raw || 0,
      operatingIncome: financialData.incomeStatementHistory?.incomeStatementHistory?.[0]?.operatingIncome?.raw || 0,
      freeCashFlow: financialData.cashflowStatementHistory?.cashflowStatements?.[0]?.freeCashFlow?.raw || 0,
      eps: financialData.financialData?.trailingEps?.raw || 0,
      sharesOutstanding: financialData.financialData?.sharesOutstanding?.raw || 0,
      currentAssets: financialData.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalCurrentAssets?.raw || 0,
      currentLiabilities: financialData.balanceSheetHistory?.balanceSheetStatements?.[0]?.totalCurrentLiabilities?.raw || 0,
    };
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return null;
  }
}

// คำนวณคะแนน Buffett ตาม 11 เกณฑ์
function calculateBuffettScore(data: FinancialData): BuffettScore {
  // 1. ROE > 15% (คะแนน 1-5)
  const roe = data.totalEquity > 0 ? (data.netIncome / data.totalEquity) * 100 : 0;
  const roe_score = roe >= 20 ? 5 : roe >= 17.5 ? 4 : roe >= 15 ? 3 : roe >= 10 ? 2 : 1;

  // 2. D/E Ratio < 1 (คะแนน 1-5)
  const deRatio = data.totalEquity > 0 ? data.totalDebt / data.totalEquity : 0;
  const debt_equity_ratio_score = deRatio <= 0.3 ? 5 : deRatio <= 0.5 ? 4 : deRatio <= 1 ? 3 : deRatio <= 1.5 ? 2 : 1;

  // 3. Net Profit Margin > 15% (คะแนน 1-5)
  const netProfitMargin = data.revenue > 0 ? (data.netIncome / data.revenue) * 100 : 0;
  const net_profit_margin_score = netProfitMargin >= 20 ? 5 : netProfitMargin >= 17.5 ? 4 : netProfitMargin >= 15 ? 3 : netProfitMargin >= 10 ? 2 : 1;

  // 4. Free Cash Flow > 0 (คะแนน 1-5)
  const free_cash_flow_score = data.freeCashFlow > data.revenue * 0.1 ? 5 : 
                              data.freeCashFlow > data.revenue * 0.05 ? 4 :
                              data.freeCashFlow > 0 ? 3 : 
                              data.freeCashFlow > -data.revenue * 0.05 ? 2 : 1;

  // 5. EPS Growth (สำหรับ demo ใช้คะแนนกลาง)
  const eps_growth_score = 3;

  // 6. Operating Margin > 20% (คะแนน 1-5)
  const operatingMargin = data.revenue > 0 ? (data.operatingIncome / data.revenue) * 100 : 0;
  const operating_margin_score = operatingMargin >= 25 ? 5 : operatingMargin >= 22.5 ? 4 : operatingMargin >= 20 ? 3 : operatingMargin >= 15 ? 2 : 1;

  // 7. Current Ratio > 1.5 (คะแนน 1-5)
  const currentRatio = data.currentLiabilities > 0 ? data.currentAssets / data.currentLiabilities : 0;
  const current_ratio_score = currentRatio >= 2.5 ? 5 : currentRatio >= 2 ? 4 : currentRatio >= 1.5 ? 3 : currentRatio >= 1 ? 2 : 1;

  // 8. Share Dilution (สำหรับ demo ใช้คะแนนกลาง)
  const share_dilution_score = 3;

  // 9. ROA > 7% (คะแนน 1-5)
  const roa = data.totalAssets > 0 ? (data.netIncome / data.totalAssets) * 100 : 0;
  const roa_score = roa >= 12 ? 5 : roa >= 9 ? 4 : roa >= 7 ? 3 : roa >= 4 ? 2 : 1;

  // 10. Moat (สำหรับ demo ใช้คะแนนกลาง)
  const moat_score = 3;

  // 11. Management (สำหรับ demo ใช้คะแนนกลาง)
  const management_score = 3;

  // คำนวณคะแนนรวมและคำแนะนำ
  const totalScore = roe_score + debt_equity_ratio_score + net_profit_margin_score + 
                    free_cash_flow_score + eps_growth_score + operating_margin_score + 
                    current_ratio_score + share_dilution_score + roa_score + 
                    moat_score + management_score;

  let recommendation: 'DCA_MORE' | 'HOLD' | 'REDUCE_SELL';
  if (totalScore >= 40) {
    recommendation = 'DCA_MORE';
  } else if (totalScore >= 30) {
    recommendation = 'HOLD';
  } else {
    recommendation = 'REDUCE_SELL';
  }

  return {
    roe_score,
    debt_equity_ratio_score,
    net_profit_margin_score,
    free_cash_flow_score,
    eps_growth_score,
    operating_margin_score,
    current_ratio_score,
    share_dilution_score,
    roa_score,
    moat_score,
    management_score,
    recommendation
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing Buffett score for:', symbol);

    // ดึงข้อมูลทางการเงิน
    const financialData = await fetchFinancialData(symbol);
    
    if (!financialData) {
      return new Response(
        JSON.stringify({ error: 'Unable to fetch financial data for symbol' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // คำนวณคะแนน Buffett
    const buffettScore = calculateBuffettScore(financialData);

    // เชื่อมต่อ Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // บันทึกผลการวิเคราะห์
    const analysisData = {
      symbol,
      analysis_date: new Date().toISOString().split('T')[0],
      ...buffettScore,
      roe_percentage: financialData.totalEquity > 0 ? (financialData.netIncome / financialData.totalEquity) * 100 : null,
      debt_equity_ratio: financialData.totalEquity > 0 ? financialData.totalDebt / financialData.totalEquity : null,
      net_profit_margin: financialData.revenue > 0 ? (financialData.netIncome / financialData.revenue) * 100 : null,
      free_cash_flow: financialData.freeCashFlow,
      operating_margin: financialData.revenue > 0 ? (financialData.operatingIncome / financialData.revenue) * 100 : null,
      current_ratio: financialData.currentLiabilities > 0 ? financialData.currentAssets / financialData.currentLiabilities : null,
      roa_percentage: financialData.totalAssets > 0 ? (financialData.netIncome / financialData.totalAssets) * 100 : null,
    };

    const { error } = await supabase
      .from('buffett_analysis')
      .upsert(analysisData, { 
        onConflict: 'symbol,analysis_date',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }

    console.log(`Successfully analyzed ${symbol} with total score: ${buffettScore.roe_score + buffettScore.debt_equity_ratio_score + buffettScore.net_profit_margin_score + buffettScore.free_cash_flow_score + buffettScore.eps_growth_score + buffettScore.operating_margin_score + buffettScore.current_ratio_score + buffettScore.share_dilution_score + buffettScore.roa_score + buffettScore.moat_score + buffettScore.management_score}`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        analysis: analysisData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Buffett analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze stock',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});