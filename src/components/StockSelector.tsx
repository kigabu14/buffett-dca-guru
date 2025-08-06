
import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { YahooFinanceService, StockData } from "@/services/YahooFinanceService";
import { useToast } from "@/hooks/use-toast";

interface StockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  onStockSelect?: (stock: StockData) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const StockSelector = ({ 
  value, 
  onValueChange, 
  onStockSelect, 
  placeholder = "เลือกหุ้น...",
  disabled = false 
}: StockSelectorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);

  // Get popular stocks for initial display
  const popularStocks = [
    // Thai stocks
    'BBL.BK', 'KBANK.BK', 'SCB.BK', 'KTB.BK', 'TTB.BK',
    'PTT.BK', 'PTTEP.BK', 'BANPU.BK', 'GULF.BK', 'BGRIM.BK',
    'CPALL.BK', 'MAKRO.BK', 'BJC.BK', 'CPN.BK', 'CRC.BK',
    'AOT.BK', 'ADVANC.BK', 'TRUE.BK', 'MINT.BK', 'BDMS.BK',
    // US stocks
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
    'JPM', 'V', 'JNJ', 'WMT', 'PG', 'UNH', 'HD', 'MA',
    'DIS', 'NFLX', 'ADBE', 'CRM', 'PYPL', 'INTC', 'CSCO'
  ];

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = YahooFinanceService.searchStocks(searchQuery);
      setSearchResults(filtered);
    } else {
      setSearchResults(popularStocks);
    }
  }, [searchQuery]);

  const handleStockSelect = async (symbol: string) => {
    if (disabled) return;
    
    setLoading(true);
    try {
      console.log(`Selecting stock: ${symbol}`);
      onValueChange(symbol);
      
      if (onStockSelect) {
        const stockData = await YahooFinanceService.getStock(symbol);
        setSelectedStock(stockData);
        onStockSelect(stockData);
        
        toast({
          title: "เลือกหุ้นสำเร็จ",
          description: `เลือก ${symbol} - ${stockData.name} แล้ว`,
        });
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error selecting stock:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถดึงข้อมูลหุ้น ${symbol} ได้`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMarketBadgeColor = (symbol: string) => {
    if (symbol.includes('.BK')) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getMarketName = (symbol: string) => {
    if (symbol.includes('.BK')) return 'SET';
    return 'US';
  };

  const displayValue = selectedStock 
    ? `${selectedStock.symbol} - ${selectedStock.name}`
    : value || placeholder;

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            <div className="flex items-center gap-2 truncate">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="truncate">{displayValue}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="ค้นหาหุ้น (เช่น AAPL, BBL.BK)..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex-1"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {searchQuery.length < 2 
                  ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา"
                  : "ไม่พบหุ้นที่ตรงกับการค้นหา"
                }
              </CommandEmpty>
              
              {searchResults.length > 0 && (
                <CommandGroup 
                  heading={searchQuery.length >= 2 ? "ผลการค้นหา" : "หุ้นยอดนิยม"}
                >
                  {searchResults.map((symbol) => (
                    <CommandItem
                      key={symbol}
                      value={symbol}
                      onSelect={() => handleStockSelect(symbol)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === symbol ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium">{symbol}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getMarketBadgeColor(symbol))}
                      >
                        {getMarketName(symbol)}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedStock && (
        <div className="mt-2 p-2 bg-muted/50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{selectedStock.symbol}</span>
              <span className="text-muted-foreground ml-2">{selectedStock.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getMarketBadgeColor(selectedStock.symbol)}>
                {selectedStock.market}
              </Badge>
              <span className="font-semibold">
                {YahooFinanceService.formatCurrency(selectedStock.price, selectedStock.currency)}
              </span>
            </div>
          </div>
          {selectedStock.dividendYield > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              อัตราปันผล: {(selectedStock.dividendYield * 100).toFixed(2)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};
