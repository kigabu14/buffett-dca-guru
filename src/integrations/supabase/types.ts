export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analysis_settings: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
          weights: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          weights: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
      buffett_analysis: {
        Row: {
          analysis_date: string
          created_at: string
          current_price: number | null
          current_ratio: number | null
          current_ratio_score: number | null
          debt_equity_ratio: number | null
          debt_equity_ratio_score: number | null
          eps_growth: number | null
          eps_growth_score: number | null
          free_cash_flow: number | null
          free_cash_flow_score: number | null
          id: string
          management_score: number | null
          moat_score: number | null
          net_profit_margin: number | null
          net_profit_margin_score: number | null
          operating_margin: number | null
          operating_margin_score: number | null
          recommendation: string | null
          roa_percentage: number | null
          roa_score: number | null
          roe_percentage: number | null
          roe_score: number | null
          share_dilution_score: number | null
          symbol: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          analysis_date?: string
          created_at?: string
          current_price?: number | null
          current_ratio?: number | null
          current_ratio_score?: number | null
          debt_equity_ratio?: number | null
          debt_equity_ratio_score?: number | null
          eps_growth?: number | null
          eps_growth_score?: number | null
          free_cash_flow?: number | null
          free_cash_flow_score?: number | null
          id?: string
          management_score?: number | null
          moat_score?: number | null
          net_profit_margin?: number | null
          net_profit_margin_score?: number | null
          operating_margin?: number | null
          operating_margin_score?: number | null
          recommendation?: string | null
          roa_percentage?: number | null
          roa_score?: number | null
          roe_percentage?: number | null
          roe_score?: number | null
          share_dilution_score?: number | null
          symbol: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          created_at?: string
          current_price?: number | null
          current_ratio?: number | null
          current_ratio_score?: number | null
          debt_equity_ratio?: number | null
          debt_equity_ratio_score?: number | null
          eps_growth?: number | null
          eps_growth_score?: number | null
          free_cash_flow?: number | null
          free_cash_flow_score?: number | null
          id?: string
          management_score?: number | null
          moat_score?: number | null
          net_profit_margin?: number | null
          net_profit_margin_score?: number | null
          operating_margin?: number | null
          operating_margin_score?: number | null
          recommendation?: string | null
          roa_percentage?: number | null
          roa_score?: number | null
          roe_percentage?: number | null
          roe_score?: number | null
          share_dilution_score?: number | null
          symbol?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dividend_history: {
        Row: {
          announcement_date: string | null
          created_at: string
          currency: string
          dividend_amount: number
          dividend_type: string
          ex_dividend_date: string
          id: string
          payment_date: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          announcement_date?: string | null
          created_at?: string
          currency?: string
          dividend_amount: number
          dividend_type?: string
          ex_dividend_date: string
          id?: string
          payment_date?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          announcement_date?: string | null
          created_at?: string
          currency?: string
          dividend_amount?: number
          dividend_type?: string
          ex_dividend_date?: string
          id?: string
          payment_date?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      historical_stock_data: {
        Row: {
          adjusted_close: number | null
          close_price: number
          created_at: string
          date: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Insert: {
          adjusted_close?: number | null
          close_price: number
          created_at?: string
          date: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Update: {
          adjusted_close?: number | null
          close_price?: number
          created_at?: string
          date?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          symbol?: string
          volume?: number
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          buffett_score_update_enabled: boolean
          created_at: string
          dca_opportunity_enabled: boolean
          dividend_reminder_enabled: boolean
          id: string
          line_enabled: boolean
          line_notify_token: string | null
          price_alert_enabled: boolean
          telegram_chat_id: string | null
          telegram_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          buffett_score_update_enabled?: boolean
          created_at?: string
          dca_opportunity_enabled?: boolean
          dividend_reminder_enabled?: boolean
          id?: string
          line_enabled?: boolean
          line_notify_token?: string | null
          price_alert_enabled?: boolean
          telegram_chat_id?: string | null
          telegram_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          buffett_score_update_enabled?: boolean
          created_at?: string
          dca_opportunity_enabled?: boolean
          dividend_reminder_enabled?: boolean
          id?: string
          line_enabled?: boolean
          line_notify_token?: string | null
          price_alert_enabled?: boolean
          telegram_chat_id?: string | null
          telegram_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          symbol: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          symbol?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          symbol?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      prediction_results: {
        Row: {
          close_price: number | null
          created_at: string
          dividend_yield: number | null
          ema_21: number | null
          ema_9: number | null
          id: string
          macd: number | null
          open_price: number | null
          prediction_result: string | null
          profit_target: number | null
          resistance_level: number | null
          rsi: number | null
          stop_loss: number | null
          strategy: string
          support_level: number | null
          symbol: string
          timeframe: string
          user_id: string
        }
        Insert: {
          close_price?: number | null
          created_at?: string
          dividend_yield?: number | null
          ema_21?: number | null
          ema_9?: number | null
          id?: string
          macd?: number | null
          open_price?: number | null
          prediction_result?: string | null
          profit_target?: number | null
          resistance_level?: number | null
          rsi?: number | null
          stop_loss?: number | null
          strategy: string
          support_level?: number | null
          symbol: string
          timeframe: string
          user_id: string
        }
        Update: {
          close_price?: number | null
          created_at?: string
          dividend_yield?: number | null
          ema_21?: number | null
          ema_9?: number | null
          id?: string
          macd?: number | null
          open_price?: number | null
          prediction_result?: string | null
          profit_target?: number | null
          resistance_level?: number | null
          rsi?: number | null
          stop_loss?: number | null
          strategy?: string
          support_level?: number | null
          symbol?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          symbol: string
          target_price: number
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol: string
          target_price: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol?: string
          target_price?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          commission_rate: number | null
          created_at: string
          data_end_year: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          data_end_year?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          data_end_year?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_investments: {
        Row: {
          buy_price: number
          commission: number | null
          company_name: string | null
          created_at: string
          current_price: number | null
          dividend_received: number | null
          dividend_yield_at_purchase: number | null
          id: string
          market: string
          notes: string | null
          purchase_date: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price: number
          commission?: number | null
          company_name?: string | null
          created_at?: string
          current_price?: number | null
          dividend_received?: number | null
          dividend_yield_at_purchase?: number | null
          id?: string
          market?: string
          notes?: string | null
          purchase_date?: string
          quantity: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number
          commission?: number | null
          company_name?: string | null
          created_at?: string
          current_price?: number | null
          dividend_received?: number | null
          dividend_yield_at_purchase?: number | null
          id?: string
          market?: string
          notes?: string | null
          purchase_date?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_markets: {
        Row: {
          company_name: string
          created_at: string
          current_price: number | null
          day_high: number | null
          day_low: number | null
          dividend_yield: number | null
          eps: number | null
          exchange: string | null
          expense_ratio: number | null
          fund_category: string | null
          id: string
          industry: string | null
          is_etf: boolean | null
          last_updated: string | null
          market: string
          market_cap: number | null
          open_price: number | null
          pe_ratio: number | null
          previous_close: number | null
          sector: string | null
          sparkline: Json | null
          symbol: string
          total_assets: number | null
          trailing_return_1y: number | null
          trailing_return_3y: number | null
          trailing_return_5y: number | null
          updated_at: string
          volume: number | null
          week_high_52: number | null
          week_low_52: number | null
        }
        Insert: {
          company_name: string
          created_at?: string
          current_price?: number | null
          day_high?: number | null
          day_low?: number | null
          dividend_yield?: number | null
          eps?: number | null
          exchange?: string | null
          expense_ratio?: number | null
          fund_category?: string | null
          id?: string
          industry?: string | null
          is_etf?: boolean | null
          last_updated?: string | null
          market: string
          market_cap?: number | null
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          sector?: string | null
          sparkline?: Json | null
          symbol: string
          total_assets?: number | null
          trailing_return_1y?: number | null
          trailing_return_3y?: number | null
          trailing_return_5y?: number | null
          updated_at?: string
          volume?: number | null
          week_high_52?: number | null
          week_low_52?: number | null
        }
        Update: {
          company_name?: string
          created_at?: string
          current_price?: number | null
          day_high?: number | null
          day_low?: number | null
          dividend_yield?: number | null
          eps?: number | null
          exchange?: string | null
          expense_ratio?: number | null
          fund_category?: string | null
          id?: string
          industry?: string | null
          is_etf?: boolean | null
          last_updated?: string | null
          market?: string
          market_cap?: number | null
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          sector?: string | null
          sparkline?: Json | null
          symbol?: string
          total_assets?: number | null
          trailing_return_1y?: number | null
          trailing_return_3y?: number | null
          trailing_return_5y?: number | null
          updated_at?: string
          volume?: number | null
          week_high_52?: number | null
          week_low_52?: number | null
        }
        Relationships: []
      }
      xd_calendar: {
        Row: {
          created_at: string
          dividend_amount: number
          dividend_yield: number | null
          ex_dividend_date: string
          id: string
          payment_date: string | null
          record_date: string | null
          symbol: string
        }
        Insert: {
          created_at?: string
          dividend_amount: number
          dividend_yield?: number | null
          ex_dividend_date: string
          id?: string
          payment_date?: string | null
          record_date?: string | null
          symbol: string
        }
        Update: {
          created_at?: string
          dividend_amount?: number
          dividend_yield?: number | null
          ex_dividend_date?: string
          id?: string
          payment_date?: string | null
          record_date?: string | null
          symbol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
