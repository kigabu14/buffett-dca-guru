
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
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

// Popular Thai and US stocks
const popularStocks = {
  thai: [
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
  ],
  us: [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK-A', 'BRK-B',
    'UNH', 'JNJ', 'JPM', 'V', 'PG', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'CRM', 'NFLX',
    'CMCSA', 'PEP', 'NKE', 'TMO', 'ABT', 'COST', 'AVGO', 'TXN', 'LLY', 'WMT', 'ORCL',
    'ACN', 'MDT', 'NEE', 'DHR', 'VZ', 'MRK', 'KO', 'PFE', 'INTC', 'T', 'IBM', 'CSCO',
    'XOM', 'WFC', 'CVX', 'BAC', 'ABBV', 'MCD', 'HON', 'BMY', 'LIN', 'PM', 'QCOM',
    'RTX', 'NOW', 'SBUX', 'LOW', 'CAT', 'GS', 'SPGI', 'BLK', 'AXP', 'GILD', 'MMM'
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

  // Load stocks from both Thai and US markets
  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      try {
        const allSymbols = [...popularStocks.thai, ...popularStocks.us];

        console.log('Loading stocks from Yahoo Finance:', allSymbols.length, 'symbols');

        // Fetch data from stock-data function
        const { data, error } = await supabase.functions.invoke('stock-data', {
          body: { symbols: allSymbols.slice(0, 100) } // Process first 100 stocks
        });

        if (error) {
          console.error('Error fetching stock data:', error);
          throw error;
        }

        if (data?.data && data.data.length > 0) {
          console.log('Successfully loaded', data.data.length, 'stocks');
          const stockOptions = data.data.map((stock: any) => ({
            symbol: stock.symbol,
            name: stock.company_name || stock.name || stock.symbol,
            price: stock.current_price || stock.price || 0,
            change: stock.current_price ? stock.current_price - (stock.previous_close || 0) : 0,
            changePercent: stock.previous_close ? 
              ((stock.current_price - stock.previous_close) / stock.previous_close) * 100 : 0,
            market: stock.market || (stock.symbol.includes('.BK') ? 'SET' : 'NASDAQ'),
            currency: stock.symbol.includes('.BK') ? 'THB' : 'USD'
          }));
          setStocks(stockOptions);
        } else {
          console.warn('No stock data received');
          setStocks([]);
        }
      } catch (error) {
        console.error('Error loading stocks:', error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  // Update current price when stock is selected
  useEffect(() => {
    if (value) {
      const selectedStock = stocks.find(stock => stock.symbol === value);
      if (selectedStock) {
        setCurrentPrice(selectedStock.price);
        onStockSelect?.(selectedStock);
      }
    }
  }, [value, stocks, onStockSelect]);

  // Filter stocks based on search
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
              <div className="flex items-center">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {placeholder}
              </div>
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
            
            {/* Thai stocks */}
            <CommandGroup heading="หุ้นไทย (SET)">
              {filteredStocks
                .filter(stock => stock.symbol.includes('.BK'))
                .slice(0, 15)
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

            {/* US stocks */}
            <CommandGroup heading="หุ้นสหรัฐ (US)">
              {filteredStocks
                .filter(stock => !stock.symbol.includes('.BK'))
                .slice(0, 15)
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

      {/* Current price display */}
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
