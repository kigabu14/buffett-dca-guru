import { supabase } from "@/integrations/supabase/client";

export interface StockData {
  symbol: string;
  name: string;
  market: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dividendYield: number;
  pe: number;
  eps: number;
  weekHigh52: number;
  weekLow52: number;
  dayHigh: number;
  dayLow: number;
  currency: string;
  lastUpdate: string;
  success: boolean;
  isSampleData?: boolean;
  // Warren Buffett analysis metrics
  roe?: number;
  debtToEquity?: number;
  profitMargin?: number;
  currentRatio?: number;
  operatingMargin?: number;
}

export interface StockResponse {
  success: boolean;
  data: StockData[];
  timestamp: string;
  error?: string;
}

export class YahooFinanceService {
  /**
   * Fetch single stock data
   * @param symbol Stock symbol (e.g., 'AAPL', 'BBL.BK')
   * @returns Promise<StockData>
   */
  static async getStock(symbol: string): Promise<StockData> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbol }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error('No data returned from API');
      }

      return data.data[0];
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch multiple stocks data
   * @param symbols Array of stock symbols
   * @returns Promise<StockData[]>
   */
  static async getStocks(symbols: string[]): Promise<StockData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: symbols.join(',') }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data.success || !data.data) {
        throw new Error('No data returned from API');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching stocks data:', error);
      throw error;
    }
  }

  /**
   * Get SET100 popular stocks
   * @returns Array of Thai stock symbols
   */
  static getSET100Symbols(): string[] {
    return [
      'BBL.BK', 'CPALL.BK', 'PTT.BK', 'KBANK.BK', 'SCB.BK',
      'AOT.BK', 'PTTEP.BK', 'ADVANC.BK', 'SCC.BK', 'TOP.BK',
      'BANPU.BK', 'BDMS.BK', 'BEM.BK', 'BH.BK', 'BTS.BK'
    ];
  }

  /**
   * Get popular US stocks
   * @returns Array of US stock symbols
   */
  static getUSStockSymbols(): string[] {
    return [
      'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN',
      'META', 'NVDA', 'NFLX', 'AMD', 'CRM'
    ];
  }

  /**
   * Get all popular stocks (SET100 + US)
   * @returns Array of all stock symbols
   */
  static getAllPopularSymbols(): string[] {
    return [...this.getSET100Symbols(), ...this.getUSStockSymbols()];
  }

  /**
   * Search stocks by symbol or name
   * @param query Search query
   * @returns Array of matching symbols
   */
  static searchStocks(query: string): string[] {
    const allSymbols = this.getAllPopularSymbols();
    const lowerQuery = query.toLowerCase();
    
    return allSymbols.filter(symbol => 
      symbol.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Calculate DCA score based on Warren Buffett principles
   * @param stock StockData object
   * @returns DCA score (0-8)
   */
  static calculateDCAScore(stock: StockData): number {
    let score = 0;
    
    // ROE > 15%
    if (stock.roe && stock.roe > 0.15) score += 1;
    
    // Debt to Equity < 1
    if (stock.debtToEquity && stock.debtToEquity < 1) score += 1;
    
    // Profit Margin > 10%
    if (stock.profitMargin && stock.profitMargin > 0.1) score += 1;
    
    // P/E Ratio < 20
    if (stock.pe && stock.pe < 20) score += 1;
    
    // Current Ratio > 1
    if (stock.currentRatio && stock.currentRatio > 1) score += 1;
    
    // Operating Margin > 10%
    if (stock.operatingMargin && stock.operatingMargin > 0.1) score += 1;
    
    // Dividend Yield > 2%
    if (stock.dividendYield && stock.dividendYield > 0.02) score += 1;
    
    // Market Cap > 1B (large cap)
    if (stock.marketCap && stock.marketCap > 1000000000) score += 1;
    
    return score;
  }

  /**
   * Get DCA recommendation based on score
   * @param score DCA score (0-8)
   * @returns Recommendation object
   */
  static getDCARecommendation(score: number): {
    level: 'excellent' | 'good' | 'moderate' | 'poor';
    message: string;
    color: string;
  } {
    if (score >= 7) {
      return {
        level: 'excellent',
        message: 'ยอดเยี่ยม - เหมาะสำหรับ DCA',
        color: 'text-green-600'
      };
    } else if (score >= 5) {
      return {
        level: 'good',
        message: 'ดี - พิจารณา DCA ได้',
        color: 'text-blue-600'
      };
    } else if (score >= 3) {
      return {
        level: 'moderate',
        message: 'ปานกลาง - ควรพิจารณาอย่างระมัดระวัง',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'poor',
        message: 'ไม่แนะนำสำหรับ DCA',
        color: 'text-red-600'
      };
    }
  }

  /**
   * Format currency value
   * @param value Numeric value
   * @param currency Currency code
   * @returns Formatted currency string
   */
  static formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format large numbers (market cap, volume)
   * @param value Numeric value
   * @returns Formatted string with units
   */
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
    return value.toString();
  }

  /**
   * Format percentage
   * @param value Decimal percentage (e.g., 0.05 for 5%)
   * @returns Formatted percentage string
   */
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