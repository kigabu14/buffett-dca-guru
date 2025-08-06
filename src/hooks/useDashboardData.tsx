import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StockInvestment {
  id: string;
  symbol: string;
  company_name: string | null;
  quantity: number;
  buy_price: number;
  current_price: number | null;
  dividend_received: number;
  dividend_yield_at_purchase: number | null;
  purchase_date: string;
  market: string;
}

interface BuffettAnalysis {
  symbol: string;
  total_score: number | null;
  recommendation: string | null;
}

interface DividendData {
  symbol: string;
  totalDividend: number;
  annualYield: number;
}

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  totalDividendYield: number;
  totalStocks: number;
  topStocks: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    buffettScore: number;
    gainLoss: number;
    gainLossPercent: number;
  }>;
  averageBuffettScore: number;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchPortfolioData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's stock investments
      const { data: investments, error: investmentsError } = await supabase
        .from('stock_investments')
        .select('*')
        .eq('user_id', user.id);

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
        return;
      }

      if (!investments || investments.length === 0) {
        setPortfolioStats({
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          gainLossPercentage: 0,
          totalDividendYield: 0,
          totalStocks: 0,
          topStocks: [],
          averageBuffettScore: 0
        });
        setLoading(false);
        return;
      }

      // Get unique symbols for Buffett analysis
      const symbols = [...new Set(investments.map(inv => inv.symbol))];

      // Fetch Buffett analysis for all symbols
      const { data: buffettData, error: buffettError } = await supabase
        .from('buffett_analysis')
        .select('symbol, total_score, recommendation')
        .in('symbol', symbols);

      if (buffettError) {
        console.error('Error fetching Buffett analysis:', buffettError);
      }

      // Create a map of Buffett scores
      const buffettMap = new Map<string, BuffettAnalysis>();
      if (buffettData) {
        buffettData.forEach(item => {
          buffettMap.set(item.symbol, item);
        });
      }

      // Calculate portfolio statistics
      let totalValue = 0;
      let totalCost = 0;
      let totalDividendReceived = 0;
      const stockGroups = new Map<string, {
        symbol: string;
        company_name: string;
        totalQuantity: number;
        avgCost: number;
        currentPrice: number;
        totalCost: number;
        currentValue: number;
        dividendReceived: number;
        buffettScore: number;
      }>();

      // Group investments by symbol and calculate totals
      investments.forEach((investment: StockInvestment) => {
        const symbol = investment.symbol;
        const cost = investment.quantity * investment.buy_price;
        const currentPrice = investment.current_price || investment.buy_price;
        const currentValue = investment.quantity * currentPrice;
        
        totalCost += cost;
        totalValue += currentValue;
        totalDividendReceived += investment.dividend_received;

        if (stockGroups.has(symbol)) {
          const existing = stockGroups.get(symbol)!;
          const newTotalQuantity = existing.totalQuantity + investment.quantity;
          const newTotalCost = existing.totalCost + cost;
          
          stockGroups.set(symbol, {
            ...existing,
            totalQuantity: newTotalQuantity,
            avgCost: newTotalCost / newTotalQuantity,
            totalCost: newTotalCost,
            currentValue: existing.currentValue + currentValue,
            dividendReceived: existing.dividendReceived + investment.dividend_received,
          });
        } else {
          stockGroups.set(symbol, {
            symbol,
            company_name: investment.company_name || symbol,
            totalQuantity: investment.quantity,
            avgCost: investment.buy_price,
            currentPrice,
            totalCost: cost,
            currentValue,
            dividendReceived: investment.dividend_received,
            buffettScore: buffettMap.get(symbol)?.total_score || 0,
          });
        }
      });

      // Convert to array and sort by value
      const topStocks = Array.from(stockGroups.values())
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.company_name,
          value: stock.currentValue,
          percentage: totalValue > 0 ? (stock.currentValue / totalValue) * 100 : 0,
          buffettScore: stock.buffettScore,
          gainLoss: stock.currentValue - stock.totalCost,
          gainLossPercent: stock.totalCost > 0 ? ((stock.currentValue - stock.totalCost) / stock.totalCost) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Calculate averages
      const totalGainLoss = totalValue - totalCost;
      const gainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      const totalDividendYield = totalValue > 0 ? (totalDividendReceived / totalValue) * 100 : 0;
      const averageBuffettScore = topStocks.length > 0 
        ? topStocks.reduce((sum, stock) => sum + stock.buffettScore, 0) / topStocks.length
        : 0;

      setPortfolioStats({
        totalValue,
        totalCost,
        totalGainLoss,
        gainLossPercentage,
        totalDividendYield,
        totalStocks: stockGroups.size,
        topStocks,
        averageBuffettScore,
      });

      // Fetch recent activities (latest 5 investments)
      const { data: recentInvestments } = await supabase
        .from('stock_investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentInvestments) {
        const activities = recentInvestments.map(inv => ({
          type: 'purchase',
          symbol: inv.symbol,
          quantity: inv.quantity,
          price: inv.buy_price,
          date: inv.created_at,
          description: `ซื้อ ${inv.symbol}`,
          details: `${inv.quantity} หุ้น @ ฿${inv.buy_price.toFixed(2)}`
        }));

        setRecentActivities(activities);
      }

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [user]);

  return {
    portfolioStats,
    recentActivities,
    loading,
    refreshData: fetchPortfolioData
  };
};