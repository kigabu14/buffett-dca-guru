
import { supabase } from '@/integrations/supabase/client';

// Interface definitions
export interface StockData {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  exDividendDate: string | null;
  dividendDate: string | null;
  earningsDate: string | null;
  forwardDividendYield: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  weekHigh52: number | null;
  weekLow52: number | null;
  volume: number | null;
  
  // Warren Buffett Analysis Metrics
  roe: number | null;
  debtToEquity: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  currentRatio: number | null;
  
  // Sample data flag
  isSampleData?: boolean;
}

interface StockResponse {
  data: StockData[];
  source: string;
  timestamp: string;
}

interface HistoricalDataPoint {
  date: string;
  price: number;
  volume: number;
}

export class YahooFinanceService {
  // Fetch stock data from Yahoo Finance API via Supabase edge function
  static async getStock(symbol: string): Promise<StockData> {
    try {
      console.log(`Fetching stock data for: ${symbol}`);
      
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: [symbol] }
      });

      if (error) {
        console.error('Error from stock-data function:', error);
        throw new Error(`ไม่สามารถดึงข้อมูลหุ้น ${symbol} ได้: ${error.message}`);
      }

      if (data?.data && data.data.length > 0) {
        const stockData = data.data[0];
        return {
          symbol: stockData.symbol,
          name: stockData.company_name || stockData.name || symbol,
          market: stockData.market,
          currency: symbol.includes('.BK') ? 'THB' : 'USD',
          price: stockData.current_price ?? null,
          change: (stockData.current_price && stockData.previous_close) ? 
            stockData.current_price - stockData.previous_close : null,
          changePercent: (stockData.current_price && stockData.previous_close) ? 
            ((stockData.current_price - stockData.previous_close) / stockData.previous_close) * 100 : null,
          marketCap: stockData.market_cap ?? null,
          pe: stockData.pe_ratio ?? null,
          eps: stockData.eps ?? null,
          dividendYield: stockData.dividend_yield ?? null,
          dividendRate: stockData.dividend_rate ?? null,
          exDividendDate: stockData.ex_dividend_date || null,
          dividendDate: stockData.dividend_date || null,
          earningsDate: stockData.earnings_date || null,
          forwardDividendYield: stockData.forward_dividend_yield ?? stockData.dividend_yield ?? null,
          dayHigh: stockData.day_high ?? null,
          dayLow: stockData.day_low ?? null,
          weekHigh52: stockData.week_high_52 ?? null,
          weekLow52: stockData.week_low_52 ?? null,
          volume: stockData.volume ?? null,
          roe: stockData.roe ?? null,
          debtToEquity: stockData.debt_to_equity ?? null,
          profitMargin: stockData.profit_margin ?? null,
          operatingMargin: stockData.operating_margin ?? null,
          currentRatio: stockData.current_ratio ?? null,
          isSampleData: false
        };
      } else {
        throw new Error(`ไม่พบข้อมูลหุ้น ${symbol}`);
      }
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error);
      throw error;
    }
  }

  // Fetch multiple stocks at once
  static async getStocks(symbols: string[]): Promise<StockData[]> {
    try {
      console.log(`Fetching data for ${symbols.length} stocks`);
      
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols }
      });

      if (error) {
        console.error('Error from stock-data function:', error);
        throw new Error(`ไม่สามารถดึงข้อมูลหุ้นได้: ${error.message}`);
      }

      if (data?.data && data.data.length > 0) {
        return data.data.map((stockData: any) => ({
          symbol: stockData.symbol,
          name: stockData.company_name || stockData.name || stockData.symbol,
          market: stockData.market,
          currency: stockData.symbol.includes('.BK') ? 'THB' : 'USD',
          price: stockData.current_price ?? null,
          change: (stockData.current_price && stockData.previous_close) ? 
            stockData.current_price - stockData.previous_close : null,
          changePercent: (stockData.current_price && stockData.previous_close) ? 
            ((stockData.current_price - stockData.previous_close) / stockData.previous_close) * 100 : null,
          marketCap: stockData.market_cap ?? null,
          pe: stockData.pe_ratio ?? null,
          eps: stockData.eps ?? null,
          dividendYield: stockData.dividend_yield ?? null,
          dividendRate: stockData.dividend_rate ?? null,
          exDividendDate: stockData.ex_dividend_date || null,
          dividendDate: stockData.dividend_date || null,
          earningsDate: stockData.earnings_date || null,
          forwardDividendYield: stockData.forward_dividend_yield ?? stockData.dividend_yield ?? null,
          dayHigh: stockData.day_high ?? null,
          dayLow: stockData.day_low ?? null,
          weekHigh52: stockData.week_high_52 ?? null,
          weekLow52: stockData.week_low_52 ?? null,
          volume: stockData.volume ?? null,
          roe: stockData.roe ?? null,
          debtToEquity: stockData.debt_to_equity ?? null,
          profitMargin: stockData.profit_margin ?? null,
          operatingMargin: stockData.operating_margin ?? null,
          currentRatio: stockData.current_ratio ?? null,
          isSampleData: false
        }));
      } else {
        throw new Error('ไม่พบข้อมูลหุ้น');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  // Get historical data for charts
  static async getHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d'): Promise<HistoricalDataPoint[]> {
    try {
      console.log(`Fetching historical data for: ${symbol}, period: ${period}, interval: ${interval}`);
      
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { 
          symbols: [symbol], 
          period,
          interval,
          historical: true 
        }
      });

      if (error) {
        console.error('Error fetching historical data:', error);
        throw new Error(`ไม่สามารถดึงข้อมูลประวัติศาสตร์หุ้น ${symbol} ได้: ${error.message}`);
      }

      if (data?.historical && data.historical.length > 0) {
        return data.historical.map((point: any) => ({
          date: point.date,
          price: point.close || point.price,
          volume: point.volume || 0
        }));
      } else {
        throw new Error(`ไม่พบข้อมูลประวัติศาสตร์หุ้น ${symbol}`);
      }
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  // Calculate DCA Score based on Warren Buffett principles
  static calculateDCAScore(stock: StockData): number {
    let score = 0;
    
    // 1. P/E Ratio (lower is better, < 15 is good)
    if (stock.pe !== null && stock.pe > 0 && stock.pe < 15) score += 1;
    else if (stock.pe !== null && stock.pe > 0 && stock.pe < 25) score += 0.5;
    
    // 2. Market Cap (prefer large companies for stability)
    if (stock.marketCap !== null && stock.marketCap > 10000000000) score += 1; // > 10B
    else if (stock.marketCap !== null && stock.marketCap > 1000000000) score += 0.5; // > 1B
    
    // 3. Dividend Yield (consistent dividend payers)
    if (stock.dividendYield !== null && stock.dividendYield > 0.02) score += 1; // > 2%
    else if (stock.dividendYield !== null && stock.dividendYield > 0) score += 0.5;
    
    // 4. EPS (positive earnings)
    if (stock.eps !== null && stock.eps > 0) score += 1;
    
    // 5. Price consistency (not too volatile)
    if (stock.changePercent !== null && Math.abs(stock.changePercent) <= 5) score += 1;
    
    // 6. ROE (Return on Equity - higher is better)
    if (stock.roe !== null && stock.roe > 0.15) score += 1; // > 15%
    else if (stock.roe !== null && stock.roe > 0.1) score += 0.5; // > 10%
    
    // 7. Debt to Equity (lower is better)
    if (stock.debtToEquity !== null && stock.debtToEquity > 0 && stock.debtToEquity < 0.3) score += 1; // < 30%
    else if (stock.debtToEquity !== null && stock.debtToEquity > 0 && stock.debtToEquity < 0.5) score += 0.5; // < 50%
    
    // 8. Profit Margin (higher is better)
    if (stock.profitMargin !== null && stock.profitMargin > 0.2) score += 1; // > 20%
    else if (stock.profitMargin !== null && stock.profitMargin > 0.1) score += 0.5; // > 10%
    
    return Math.round(score);
  }

  // Calculate Buffett Score with 11 criteria
  static calculateBuffettScore(stock: StockData): { score: number; recommendation: string } {
    let score = 0;
    
    // 1. ROE > 15%
    if (stock.roe !== null && stock.roe > 0.15) score += 2;
    else if (stock.roe !== null && stock.roe > 0.10) score += 1;
    
    // 2. Debt to Equity < 0.5
    if (stock.debtToEquity !== null && stock.debtToEquity > 0 && stock.debtToEquity < 0.3) score += 2;
    else if (stock.debtToEquity !== null && stock.debtToEquity > 0 && stock.debtToEquity < 0.5) score += 1;
    
    // 3. Profit Margin > 15%
    if (stock.profitMargin !== null && stock.profitMargin > 0.15) score += 2;
    else if (stock.profitMargin !== null && stock.profitMargin > 0.10) score += 1;
    
    // 4. Operating Margin > 15%
    if (stock.operatingMargin !== null && stock.operatingMargin > 0.15) score += 2;
    else if (stock.operatingMargin !== null && stock.operatingMargin > 0.10) score += 1;
    
    // 5. Current Ratio > 1.5
    if (stock.currentRatio !== null && stock.currentRatio > 1.5) score += 2;
    else if (stock.currentRatio !== null && stock.currentRatio > 1.0) score += 1;
    
    // 6. P/E Ratio reasonable
    if (stock.pe !== null && stock.pe > 0 && stock.pe < 15) score += 2;
    else if (stock.pe !== null && stock.pe > 0 && stock.pe < 25) score += 1;
    
    // 7. Consistent dividend payments
    if (stock.dividendYield !== null && stock.dividendYield > 0.02) score += 2;
    else if (stock.dividendYield !== null && stock.dividendYield > 0) score += 1;
    
    // 8. EPS Growth (positive EPS)
    if (stock.eps !== null && stock.eps > 0) score += 1;
    
    let recommendation = 'AVOID';
    if (score >= 12) recommendation = 'STRONG_BUY';
    else if (score >= 8) recommendation = 'BUY';
    else if (score >= 5) recommendation = 'HOLD';
    
    return { score, recommendation };
  }

  // Get DCA recommendation based on score
  static getDCARecommendation(score: number): { message: string; color: string } {
    if (score >= 7) {
      return {
        message: "แนะนำสูง - เหมาะสำหรับ DCA ระยะยาว",
        color: "text-green-600"
      };
    } else if (score >= 5) {
      return {
        message: "แนะนำปานกลาง - พิจารณาการลงทุน",
        color: "text-blue-600"
      };
    } else if (score >= 3) {
      return {
        message: "ระมัดระวัง - ศึกษาเพิ่มเติมก่อนลงทุน",
        color: "text-yellow-600"
      };
    } else {
      return {
        message: "ไม่แนะนำ - มีความเสี่ยงสูง",
        color: "text-red-600"
      };
    }
  }

  // Check Yahoo Finance API status
  static async checkApiStatus(): Promise<{ status: 'connected' | 'disconnected', message: string }> {
    try {
      console.log('Checking Yahoo Finance API status...');
      
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: ['AAPL'] } // Test with a simple US stock
      });

      if (error) {
        return { 
          status: 'disconnected', 
          message: `ไม่สามารถเชื่อมต่อ Yahoo Finance API: ${error.message}` 
        };
      }

      if (data?.success) {
        return { 
          status: 'connected', 
          message: 'เชื่อมต่อ Yahoo Finance API สำเร็จ' 
        };
      } else {
        return { 
          status: 'disconnected', 
          message: 'Yahoo Finance API ไม่พร้อมใช้งาน' 
        };
      }
    } catch (error) {
      return { 
        status: 'disconnected', 
        message: `เกิดข้อผิดพลาด: ${error.message}` 
      };
    }
  }

  // Get comprehensive list of stock symbols
  static getSET100Symbols(): string[] {
    return [
      'ADVANC.BK', 'AEONTS.BK', 'AMATA.BK', 'ANAN.BK', 'AOT.BK', 'AP.BK', 'AWC.BK', 'BANPU.BK', 'BBL.BK', 'BCPG.BK',
      'BDMS.BK', 'BEAUTY.BK', 'BEC.BK', 'BGRIM.BK', 'BH.BK', 'BJC.BK', 'BLA.BK', 'BPP.BK', 'BTS.BK', 'BYD.BK',
      'CBG.BK', 'CENTEL.BK', 'CHG.BK', 'CK.BK', 'CKP.BK', 'COM7.BK', 'CPALL.BK', 'CPF.BK', 'CPN.BK', 'CRC.BK',
      'DELTA.BK', 'DOHOME.BK', 'EA.BK', 'EGCO.BK', 'EPG.BK', 'ERW.BK', 'GFPT.BK', 'GLOBAL.BK',
      'GPSC.BK', 'GULF.BK', 'GUNKUL.BK', 'HANA.BK', 'HMPRO.BK', 'HUMAN.BK', 'ICHI.BK', 'IVL.BK', 'JAS.BK', 'JMART.BK',
      'JMT.BK', 'KBANK.BK', 'KCE.BK', 'KKP.BK', 'KTC.BK', 'KTB.BK', 'LH.BK', 'MAJOR.BK', 'MAKRO.BK', 'MALEE.BK',
      'MEGA.BK', 'MINT.BK', 'MTC.BK', 'NRF.BK', 'OR.BK', 'OSP.BK', 'PLANB.BK', 'PRM.BK', 'PSH.BK', 'PSL.BK',
      'PTG.BK', 'PTT.BK', 'PTTEP.BK', 'PTTGC.BK', 'QH.BK', 'RATCH.BK', 'RBF.BK', 'RS.BK', 'SAWAD.BK', 'SCC.BK',
      'SCB.BK', 'SCGP.BK', 'SINGER.BK', 'SPALI.BK', 'STA.BK', 'STEC.BK', 'SUPER.BK', 'TASCO.BK', 'TCAP.BK', 'THANI.BK',
      'TISCO.BK', 'TKN.BK', 'TMB.BK', 'TOP.BK', 'TQM.BK', 'TRUE.BK', 'TTB.BK', 'TU.BK', 'TVO.BK', 'WHA.BK'
    ];
  }

  static getUSStockSymbols(): string[] {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK-A', 'BRK-B',
      'UNH', 'JNJ', 'JPM', 'V', 'PG', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'CRM', 'NFLX',
      'CMCSA', 'PEP', 'NKE', 'TMO', 'ABT', 'COST', 'AVGO', 'TXN', 'LLY', 'WMT', 'ORCL',
      'ACN', 'MDT', 'NEE', 'DHR', 'VZ', 'MRK', 'KO', 'PFE', 'INTC', 'T', 'IBM', 'CSCO',
      'XOM', 'WFC', 'CVX', 'BAC', 'ABBV', 'MCD', 'HON', 'BMY', 'LIN', 'PM', 'QCOM',
      'RTX', 'NOW', 'SBUX', 'LOW', 'CAT', 'GS', 'SPGI', 'BLK', 'AXP', 'GILD', 'MMM'
    ];
  }

  static getAllPopularSymbols(): string[] {
    return [...this.getSET100Symbols(), ...this.getUSStockSymbols()];
  }

  static searchStocks(query: string): string[] {
    const allSymbols = this.getAllPopularSymbols();
    return allSymbols.filter(symbol => 
      symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20);
  }

  // Utility methods for formatting
  static formatCurrency(value: number | null, currency?: string): string {
    if (value === null || value === undefined || isNaN(value)) {
      return currency === 'THB' ? '฿0.00' : '$0.00';
    }
    const symbol = currency === 'THB' ? '฿' : '$';
    return `${symbol}${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  // New formatting helpers for null-safe display
  static formatDisplayPrice(value: number | null, currency?: string, options?: { placeholder?: string; decimals?: number }): string {
    const placeholder = options?.placeholder || 'N/A';
    const decimals = options?.decimals ?? 2;
    
    if (value === null || value === undefined || isNaN(value)) {
      return placeholder;
    }
    
    const symbol = currency === 'THB' ? '฿' : (currency === 'USD' ? '$' : '');
    return `${symbol}${value.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  }

  static formatPercent(value: number | null, options?: { placeholder?: string; decimals?: number; sign?: boolean }): string {
    const placeholder = options?.placeholder || 'N/A';
    const decimals = options?.decimals ?? 2;
    const showSign = options?.sign ?? true;
    
    if (value === null || value === undefined || isNaN(value)) {
      return placeholder;
    }
    
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
  }

  static formatLargeNumber(value: number | null): string {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
      return 'N/A';
    }
    
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  static formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  static formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  }

  // Default symbols for watchlist
  static getDefaultSymbols(): string[] {
    return [
      'BBL.BK', 'CPALL.BK', 'PTT.BK', 'KBANK.BK', 'AOT.BK',
      'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA'
    ];
  }

  // Watchlist persistence functions
  static async loadUserWatchlist(userId?: string): Promise<string[]> {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_watchlist')
          .select('symbol, order_index')
          .eq('user_id', userId)
          .order('order_index');

        if (error) {
          console.error('Error loading user watchlist:', error);
          return this.getDefaultSymbols();
        }

        return data && data.length > 0 ? data.map(item => item.symbol) : this.getDefaultSymbols();
      } catch (error) {
        console.error('Error loading user watchlist:', error);
        return this.getDefaultSymbols();
      }
    } else {
      // Load from localStorage for unauthenticated users
      try {
        const stored = localStorage.getItem('watchlist_symbols');
        return stored ? JSON.parse(stored) : this.getDefaultSymbols();
      } catch (error) {
        console.error('Error loading watchlist from localStorage:', error);
        return this.getDefaultSymbols();
      }
    }
  }

  static async persistWatchlist(symbols: string[], userId?: string): Promise<void> {
    if (userId) {
      try {
        // Delete existing watchlist items for this user
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', userId);

        // Insert new watchlist items
        if (symbols.length > 0) {
          const watchlistItems = symbols.map((symbol, index) => ({
            user_id: userId,
            symbol,
            order_index: index
          }));

          const { error } = await supabase
            .from('user_watchlist')
            .insert(watchlistItems);

          if (error) {
            console.error('Error persisting user watchlist:', error);
            throw error;
          }
        }
      } catch (error) {
        console.error('Error persisting user watchlist:', error);
        throw error;
      }
    } else {
      // Save to localStorage for unauthenticated users
      try {
        localStorage.setItem('watchlist_symbols', JSON.stringify(symbols));
      } catch (error) {
        console.error('Error saving watchlist to localStorage:', error);
        throw error;
      }
    }
  }
}
