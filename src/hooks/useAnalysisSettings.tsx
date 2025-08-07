import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalysisWeights {
  roe: number;
  debtEquity: number;
  netProfitMargin: number;
  freeCashFlow: number;
  epsGrowth: number;
  operatingMargin: number;
  currentRatio: number;
  shareDilution: number;
  roa: number;
  moat: number;
  management: number;
}

export interface AnalysisSettings {
  id?: string;
  user_id?: string;
  name: string;
  weights: AnalysisWeights;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

const defaultBuffettWeights: AnalysisWeights = {
  roe: 5,
  debtEquity: 5,
  netProfitMargin: 5,
  freeCashFlow: 5,
  epsGrowth: 5,
  operatingMargin: 5,
  currentRatio: 5,
  shareDilution: 5,
  roa: 5,
  moat: 5,
  management: 5,
};

const customPresets = {
  'Conservative': {
    roe: 8,
    debtEquity: 10,
    netProfitMargin: 7,
    freeCashFlow: 8,
    epsGrowth: 3,
    operatingMargin: 6,
    currentRatio: 10,
    shareDilution: 7,
    roa: 6,
    moat: 8,
    management: 7,
  },
  'Growth Focused': {
    roe: 10,
    debtEquity: 3,
    netProfitMargin: 8,
    freeCashFlow: 6,
    epsGrowth: 15,
    epsGrowth: 9,
    operatingMargin: 8,
    currentRatio: 3,
    shareDilution: 4,
    roa: 8,
    moat: 6,
    management: 8,
  },
  'Value Investing': {
    roe: 6,
    debtEquity: 8,
    netProfitMargin: 6,
    freeCashFlow: 10,
    epsGrowth: 4,
    operatingMargin: 5,
    currentRatio: 8,
    shareDilution: 6,
    roa: 7,
    moat: 10,
    management: 10,
  }
};

export const useAnalysisSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AnalysisSettings[]>([]);
  const [currentSettings, setCurrentSettings] = useState<AnalysisSettings>({
    name: 'Buffett Default',
    weights: defaultBuffettWeights,
    is_default: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysis_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setSettings(data || []);
      
      // Set current settings to default or first available
      const defaultSetting = data?.find(s => s.is_default);
      if (defaultSetting) {
        setCurrentSettings(defaultSetting);
      }
    } catch (error) {
      console.error('Error loading analysis settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Omit<AnalysisSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_settings')
        .insert({
          ...newSettings,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => [...prev, data]);
      setCurrentSettings(data);
      
      return data;
    } catch (error) {
      console.error('Error saving analysis settings:', error);
      throw error;
    }
  };

  const updateSettings = async (id: string, updates: Partial<AnalysisSettings>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_settings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => prev.map(s => s.id === id ? data : s));
      
      if (currentSettings.id === id) {
        setCurrentSettings(data);
      }

      return data;
    } catch (error) {
      console.error('Error updating analysis settings:', error);
      throw error;
    }
  };

  const deleteSettings = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('analysis_settings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev.filter(s => s.id !== id));
      
      // If deleted current settings, revert to default
      if (currentSettings.id === id) {
        setCurrentSettings({
          name: 'Buffett Default',
          weights: defaultBuffettWeights,
          is_default: true
        });
      }
    } catch (error) {
      console.error('Error deleting analysis settings:', error);
      throw error;
    }
  };

  const setAsDefault = async (id: string) => {
    if (!user) return;

    try {
      // First, unset all as default
      await supabase
        .from('analysis_settings')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the selected one as default
      const { data, error } = await supabase
        .from('analysis_settings')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
      setCurrentSettings(data);

      return data;
    } catch (error) {
      console.error('Error setting default analysis settings:', error);
      throw error;
    }
  };

  const calculateCustomScore = (financialData: any, weights: AnalysisWeights = currentSettings.weights) => {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    // Calculate individual scores (same logic as Buffett analysis but with custom weights)
    const roe = financialData.roe_percentage || 0;
    const roe_score = roe >= 20 ? 5 : roe >= 15 ? 4 : roe >= 10 ? 3 : roe >= 5 ? 2 : 1;
    
    const deRatio = financialData.debt_equity_ratio || 0;
    const debt_equity_score = deRatio <= 0.3 ? 5 : deRatio <= 0.5 ? 4 : deRatio <= 1 ? 3 : deRatio <= 1.5 ? 2 : 1;
    
    const netMargin = financialData.net_profit_margin || 0;
    const net_profit_margin_score = netMargin >= 20 ? 5 : netMargin >= 15 ? 4 : netMargin >= 10 ? 3 : netMargin >= 5 ? 2 : 1;
    
    const fcf = financialData.free_cash_flow || 0;
    const free_cash_flow_score = fcf > 1000000000 ? 5 : fcf > 500000000 ? 4 : fcf > 0 ? 3 : fcf > -100000000 ? 2 : 1;
    
    const epsGrowth = financialData.eps_growth || 0;
    const eps_growth_score = epsGrowth >= 15 ? 5 : epsGrowth >= 10 ? 4 : epsGrowth >= 5 ? 3 : epsGrowth >= 0 ? 2 : 1;
    
    const opMargin = financialData.operating_margin || 0;
    const operating_margin_score = opMargin >= 25 ? 5 : opMargin >= 20 ? 4 : opMargin >= 15 ? 3 : opMargin >= 10 ? 2 : 1;
    
    const currentRat = financialData.current_ratio || 0;
    const current_ratio_score = currentRat >= 2.5 ? 5 : currentRat >= 2 ? 4 : currentRat >= 1.5 ? 3 : currentRat >= 1 ? 2 : 1;
    
    const roa = financialData.roa_percentage || 0;
    const roa_score = roa >= 15 ? 5 : roa >= 10 ? 4 : roa >= 7 ? 3 : roa >= 3 ? 2 : 1;
    
    // Apply weights and calculate weighted score
    const weightedScore = (
      (roe_score * weights.roe) +
      (debt_equity_score * weights.debtEquity) +
      (net_profit_margin_score * weights.netProfitMargin) +
      (free_cash_flow_score * weights.freeCashFlow) +
      (eps_growth_score * weights.epsGrowth) +
      (operating_margin_score * weights.operatingMargin) +
      (current_ratio_score * weights.currentRatio) +
      (3 * weights.shareDilution) + // Default values for unavailable metrics
      (roa_score * weights.roa) +
      (3 * weights.moat) +
      (3 * weights.management)
    ) / totalWeight;

    // Convert to percentage
    const normalizedScore = (weightedScore / 5) * 100;

    // Determine recommendation
    let recommendation = 'REDUCE_SELL';
    if (normalizedScore >= 80) recommendation = 'DCA_MORE';
    else if (normalizedScore >= 60) recommendation = 'HOLD';

    return {
      score: Math.round(normalizedScore),
      recommendation,
      breakdown: {
        roe_score,
        debt_equity_score,
        net_profit_margin_score,
        free_cash_flow_score,
        eps_growth_score,
        operating_margin_score,
        current_ratio_score,
        roa_score
      }
    };
  };

  const getPresetWeights = (presetName: keyof typeof customPresets) => {
    return customPresets[presetName];
  };

  return {
    settings,
    currentSettings,
    loading,
    loadSettings,
    saveSettings,
    updateSettings,
    deleteSettings,
    setAsDefault,
    setCurrentSettings,
    calculateCustomScore,
    getPresetWeights,
    defaultBuffettWeights,
    customPresets
  };
};