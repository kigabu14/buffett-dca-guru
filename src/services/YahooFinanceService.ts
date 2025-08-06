import { supabase } from '@/integrations/supabase/client';

// Interface definitions
export interface StockData {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividendYield: number;
  weekHigh52: number;
  weekLow52: number;
  volume: number;
  
  // Warren Buffett Analysis Metrics
  roe: number;
  debtToEquity: number;
  profitMargin: number;
  
  isSampleData?: boolean;
}

interface StockResponse {
  data: StockData[];
  source: string;
  timestamp: string;
}

export class YahooFinanceService {
  // Fetch stock data from Yahoo Finance API via Supabase edge function
  static async getStock(symbol: string): Promise<StockData> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: [symbol] }
      });

      if (error) {
        console.error('Error from stock-data function:', error);
        throw error;
      }

      if (data?.data && data.data.length > 0) {
        return data.data[0];
      } else {
        return this.generateSampleStock(symbol);
      }
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error);
      return this.generateSampleStock(symbol);
    }
  }

  // Fetch multiple stocks at once
  static async getStocks(symbols: string[]): Promise<StockData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols }
      });

      if (error) {
        console.error('Error from stock-data function:', error);
        throw error;
      }

      if (data?.data && data.data.length > 0) {
        return data.data;
      } else {
        return symbols.map(symbol => this.generateSampleStock(symbol));
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      return symbols.map(symbol => this.generateSampleStock(symbol));
    }
  }

  // Generate sample stock data for fallback
  static generateSampleStock(symbol: string): StockData {
    const isThaiStock = symbol.includes('.BK');
    const basePrice = isThaiStock ? Math.random() * 100 + 20 : Math.random() * 300 + 50;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      name: isThaiStock ? symbol.replace('.BK', ' บริษัท') : `${symbol} Corporation`,
      market: isThaiStock ? 'SET' : 'NASDAQ',
      currency: isThaiStock ? 'THB' : 'USD',
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      marketCap: Math.random() * 1000000000000,
      pe: Math.random() * 30 + 5,
      eps: Math.random() * 20,
      dividendYield: Math.random() * 0.05,
      weekHigh52: basePrice * (1 + Math.random() * 0.3),
      weekLow52: basePrice * (1 - Math.random() * 0.3),
      volume: Math.floor(Math.random() * 10000000),
      roe: Math.random() * 0.25,
      debtToEquity: Math.random() * 2,
      profitMargin: Math.random() * 0.3,
      isSampleData: true
    };
  }

  // Get comprehensive list of stock symbols
  static getSET100Symbols(): string[] {
    return [
      'ADVANC', 'AEONTS', 'AMATA', 'ANAN', 'AOT', 'AP', 'AWC', 'BANPU', 'BBL', 'BCPG',
      'BDMS', 'BEAUTY', 'BEC', 'BGRIM', 'BH', 'BJC', 'BLA', 'BPP', 'BTS', 'BYD',
      'CBG', 'CENTEL', 'CHG', 'CK', 'CKP', 'COM7', 'CPALL', 'CPF', 'CPN', 'CRC',
      'DELTA', 'DOHOME', 'DTAC', 'EA', 'EGCO', 'EPG', 'ERW', 'ESSO', 'GFPT', 'GLOBAL',
      'GPSC', 'GULF', 'GUNKUL', 'HANA', 'HMPRO', 'HUMAN', 'ICHI', 'IVL', 'JAS', 'JMART',
      'JMT', 'KBANK', 'KCE', 'KKP', 'KTC', 'KTB', 'LH', 'MAJOR', 'MAKRO', 'MALEE',
      'MEGA', 'MINT', 'MTC', 'NRF', 'OR', 'OSP', 'PLANB', 'PRM', 'PSH', 'PSL',
      'PTG', 'PTT', 'PTTEP', 'PTTGC', 'QH', 'RATCH', 'RBF', 'RS', 'SAWAD', 'SCC',
      'SCB', 'SCGP', 'SINGER', 'SPALI', 'STA', 'STEC', 'SUPER', 'TASCO', 'TCAP', 'THANI',
      'TISCO', 'TKN', 'TMB', 'TOP', 'TQM', 'TRUE', 'TTB', 'TU', 'TVO', 'WHA'
    ].map(symbol => `${symbol}.BK`);
  }

  static getUSStockSymbols(): string[] {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.A', 'BRK.B',
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

  // Calculate DCA Score based on Warren Buffett principles
  static calculateDCAScore(stock: StockData): number {
    let score = 0;
    
    // 1. ROE > 15%
    if (stock.roe && stock.roe > 0.15) score += 1;
    
    // 2. Debt to Equity < 1
    if (stock.debtToEquity && stock.debtToEquity < 1) score += 1;
    
    // 3. Profit Margin > 10%
    if (stock.profitMargin && stock.profitMargin > 0.1) score += 1;
    
    // 4. P/E Ratio < 20 (reasonable valuation)
    if (stock.pe && stock.pe < 20 && stock.pe > 0) score += 1;
    
    // 5. Dividend Yield > 2%
    if (stock.dividendYield && stock.dividendYield > 0.02) score += 1;
    
    // 6. Market Cap > 1B (established company)
    if (stock.marketCap && stock.marketCap > 1000000000) score += 1;
    
    // 7. Positive earnings (EPS > 0)
    if (stock.eps && stock.eps > 0) score += 1;
    
    // 8. Stock price not at 52-week high (good entry point)
    if (stock.weekHigh52 && stock.price < stock.weekHigh52 * 0.9) score += 1;
    
    return score;
  }

  static getDCARecommendation(score: number): { 
    level: 'excellent' | 'good' | 'moderate' | 'poor'; 
    message: string; 
    color: string; 
  } {
    if (score >= 7) {
      return {
        level: 'excellent',
        message: 'แนะนำให้ DCA อย่างมาก - หุ้นมีคุณภาพสูง',
        color: 'text-green-600'
      };
    } else if (score >= 5) {
      return {
        level: 'good',
        message: 'เหมาะสำหรับ DCA - หุ้นมีคุณภาพดี',
        color: 'text-blue-600'
      };
    } else if (score >= 3) {
      return {
        level: 'moderate',
        message: 'พิจารณา DCA ด้วยความระมัดระวัง',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'poor',
        message: 'ไม่แนะนำให้ DCA - ควรศึกษาเพิ่มเติม',
        color: 'text-red-600'
      };
    }
  }

  // Utility methods for formatting
  static formatCurrency(value: number, currency?: string): string {
    const symbol = currency === 'THB' ? '฿' : '$';
    return `${symbol}${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  static formatLargeNumber(value: number): string {
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

  static async getHistoricalData(symbol: string, period: string = '1mo', interval: string = '1d'): Promise<any[]> {
    try {
      const response = await fetch('/api/stock-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, period, interval }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();
      return data.historical || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }
}