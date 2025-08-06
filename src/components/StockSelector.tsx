import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface StockOption {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  market: string;
  currency: string;
}

interface StockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  onStockSelect?: (stock: StockOption) => void;
  placeholder?: string;
}

// รายชื่อหุ้นยอดนิยม
const popularStocks = {
  thai: [
    'AOT', 'ADVANC', 'BBL', 'KBANK', 'PTT', 'PTTEP', 'SCB', 'CPALL', 'TRUE', 'SCC',
    'BANPU', 'INTUCH', 'KTB', 'TTB', 'TISCO', 'BAM', 'TOP', 'IRPC', 'EGCO', 'RATCH',
    'CPN', 'CRC', 'BJC', 'MAKRO', 'HMPRO', 'OSP', 'COM7', 'MTC', 'MINT', 'MAJOR',
    'DOHOME', 'GLOBAL', 'LH', 'AMATA', 'WHA', 'STEC', 'DTAC', 'AIS', 'JAS'
  ],
  us: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'BRK.B', 'JNJ',
    'UNH', 'JPM', 'V', 'PG', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'CRM', 'NFLX',
    'CMCSA', 'PEP', 'NKE', 'TMO', 'ABT', 'COST', 'AVGO', 'TXN', 'LLY', 'WMT'
  ]
};

export const StockSelector: React.FC<StockSelectorProps> = ({
  value,
  onValueChange,
  onStockSelect,
  placeholder = "ค้นหาหุ้น..."
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // สร้างรายการหุ้นจากข้อมูลที่มี
  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      try {
        // โหลดหุ้นไทยและสหรัฐที่นิยม
        const allSymbols = [
          ...popularStocks.thai.map(s => `${s}.BK`),
          ...popularStocks.us
        ];

        // ดึงข้อมูลจาก stock-data function
        const { data, error } = await supabase.functions.invoke('stock-data', {
          body: { symbols: allSymbols.slice(0, 50) } // จำกัดที่ 50 ตัวเพื่อประสิทธิภาพ
        });

        if (error) {
          console.error('Error fetching stock data:', error);
          // ใช้ข้อมูลเริ่มต้น
          const defaultStocks = allSymbols.slice(0, 20).map(symbol => ({
            symbol,
            name: symbol.replace('.BK', ''),
            price: 100,
            change: 0,
            changePercent: 0,
            market: symbol.includes('.BK') ? 'SET' : 'NASDAQ',
            currency: symbol.includes('.BK') ? 'THB' : 'USD'
          }));
          setStocks(defaultStocks);
        } else if (data?.data) {
          const stockOptions = data.data.map((stock: any) => ({
            symbol: stock.symbol,
            name: stock.company_name || stock.symbol,
            price: stock.current_price || 0,
            change: stock.current_price - stock.previous_close || 0,
            changePercent: stock.previous_close > 0 
              ? ((stock.current_price - stock.previous_close) / stock.previous_close) * 100 
              : 0,
            market: stock.market || (stock.symbol.includes('.BK') ? 'SET' : 'NASDAQ'),
            currency: stock.symbol.includes('.BK') ? 'THB' : 'USD'
          }));
          setStocks(stockOptions);
        }
      } catch (error) {
        console.error('Error loading stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  // อัพเดทราคาปัจจุบันเมื่อเลือกหุ้น
  useEffect(() => {
    if (value) {
      const selectedStock = stocks.find(stock => stock.symbol === value);
      if (selectedStock) {
        setCurrentPrice(selectedStock.price);
        onStockSelect?.(selectedStock);
      }
    }
  }, [value, stocks, onStockSelect]);

  // กรองหุ้นตามคำค้นหา
  const filteredStocks = stocks.filter(stock => {
    const searchTerm = searchValue.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    );
  });

  const selectedStock = stocks.find(stock => stock.symbol === value);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background hover:bg-accent"
          >
            {selectedStock ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{selectedStock.symbol}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedStock.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedStock.price > 0 && (
                    <div className="text-right">
                      <div className="font-semibold">
                        {selectedStock.currency === 'THB' ? '฿' : '$'}{selectedStock.price.toFixed(2)}
                      </div>
                      <div className={`text-xs flex items-center ${
                        selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {selectedStock.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {selectedStock.market}
                  </Badge>
                </div>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="ค้นหาหุ้น..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>
              {loading ? 'กำลังโหลด...' : 'ไม่พบหุ้นที่ค้นหา'}
            </CommandEmpty>
            
            {/* หุ้นไทย */}
            <CommandGroup heading="หุ้นไทย (SET)">
              {filteredStocks
                .filter(stock => stock.symbol.includes('.BK'))
                .slice(0, 10)
                .map((stock) => (
                  <CommandItem
                    key={stock.symbol}
                    value={stock.symbol}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === stock.symbol ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stock.price > 0 && (
                        <>
                          <div className="font-semibold">฿{stock.price.toFixed(2)}</div>
                          <div className={`text-xs ${
                            stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>

            {/* หุ้นสหรัฐ */}
            <CommandGroup heading="หุ้นสหรัฐ (US)">
              {filteredStocks
                .filter(stock => !stock.symbol.includes('.BK'))
                .slice(0, 10)
                .map((stock) => (
                  <CommandItem
                    key={stock.symbol}
                    value={stock.symbol}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === stock.symbol ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stock.price > 0 && (
                        <>
                          <div className="font-semibold">${stock.price.toFixed(2)}</div>
                          <div className={`text-xs ${
                            stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* แสดงราคาปัจจุบันด้านล่าง */}
      {currentPrice !== null && selectedStock && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{selectedStock.symbol}</div>
              <div className="text-sm text-muted-foreground">{selectedStock.name}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {selectedStock.currency === 'THB' ? '฿' : '$'}{currentPrice.toFixed(2)}
              </div>
              <div className={`text-sm flex items-center justify-end ${
                selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {selectedStock.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.currency === 'THB' ? '฿' : '$'}{Math.abs(selectedStock.change).toFixed(2)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};