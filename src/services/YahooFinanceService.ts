
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
          price: stockData.current_price || 0,
          change: stockData.current_price ? stockData.current_price - (stockData.previous_close || 0) : 0,
          changePercent: stockData.previous_close ? 
            ((stockData.current_price - stockData.previous_close) / stockData.previous_close) * 100 : 0,
          marketCap: stockData.market_cap || 0,
          pe: stockData.pe_ratio || 0,
          eps: stockData.eps || 0,
          dividendYield: stockData.dividend_yield || 0,
          weekHigh52: 0,
          weekLow52: 0,
          volume: stockData.volume || 0,
          roe: 0,
          debtToEquity: 0,
          profitMargin: 0
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
          price: stockData.current_price || 0,
          change: stockData.current_price ? stockData.current_price - (stockData.previous_close || 0) : 0,
          changePercent: stockData.previous_close ? 
            ((stockData.current_price - stockData.previous_close) / stockData.previous_close) * 100 : 0,
          marketCap: stockData.market_cap || 0,
          pe: stockData.pe_ratio || 0,
          eps: stockData.eps || 0,
          dividendYield: stockData.dividend_yield || 0,
          weekHigh52: 0,
          weekLow52: 0,
          volume: stockData.volume || 0,
          roe: 0,
          debtToEquity: 0,
          profitMargin: 0
        }));
      } else {
        throw new Error('ไม่พบข้อมูลหุ้น');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
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
  static formatCurrency(value: number, currency?: string): string {
    if (value === null || value === undefined || isNaN(value)) {
      return currency === 'THB' ? '฿0.00' : '$0.00';
    }
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
}
