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
      backtest_results: {
        Row: {
          created_at: string
          end_date: string
          final_capital: number
          id: string
          initial_capital: number
          max_drawdown: number
          profitable_trades: number
          sharpe_ratio: number | null
          start_date: string
          stop_loss: number | null
          strategy: string
          symbol: string
          take_profit: number | null
          timeframe: string
          total_return: number
          total_trades: number
          trade_details: Json | null
          user_id: string
          win_rate: number
        }
        Insert: {
          created_at?: string
          end_date: string
          final_capital: number
          id?: string
          initial_capital: number
          max_drawdown: number
          profitable_trades: number
          sharpe_ratio?: number | null
          start_date: string
          stop_loss?: number | null
          strategy: string
          symbol: string
          take_profit?: number | null
          timeframe: string
          total_return: number
          total_trades: number
          trade_details?: Json | null
          user_id: string
          win_rate: number
        }
        Update: {
          created_at?: string
          end_date?: string
          final_capital?: number
          id?: string
          initial_capital?: number
          max_drawdown?: number
          profitable_trades?: number
          sharpe_ratio?: number | null
          start_date?: string
          stop_loss?: number | null
          strategy?: string
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          total_return?: number
          total_trades?: number
          trade_details?: Json | null
          user_id?: string
          win_rate?: number
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
          id: string
          market: string
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
          id?: string
          market?: string
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
          id?: string
          market?: string
          purchase_date?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
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
