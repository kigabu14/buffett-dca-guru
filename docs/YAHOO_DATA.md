# Yahoo Finance Data Mapping Documentation

This document describes how Yahoo Finance API data is mapped to our database schema and the scaling conventions used.

## Symbol Normalization Rules

### Thai Stocks (SET Market)
- **Input**: Raw symbol like `PTT`, `ADVANC`, or `PTT.BK`
- **Normalization**: Append `.BK` suffix if not present
- **Storage**: Always store with `.BK` suffix (e.g., `PTT.BK`)
- **Detection**: Symbols matching pattern `/^[A-Z]{1,6}$/` without suffix get `.BK` appended

### Other Markets
- **NASDAQ/NYSE**: Keep original format (e.g., `AAPL`, `MSFT`)
- **Existing suffixes**: Leave intact (e.g., `BRK.A`)

## Yahoo Finance API Endpoints

### Chart Data (`/v8/finance/chart/{symbol}`)
- Primary source for current price data
- Contains `meta.regularMarketPrice`, `meta.previousClose`
- Provides volume, day high/low, open price

### Quote Summary (`/v10/finance/quoteSummary/{symbol}`)
- Extended financial metrics
- Modules used: `defaultKeyStatistics`, `financialData`, `summaryDetail`, `quoteType`, `price`, `summaryProfile`

## Field Mapping Reference

| Database Column | Yahoo Finance Source | Notes |
|----------------|---------------------|-------|
| `currency` | `meta.currency` OR `summaryDetail.currency` | |
| `change` | Calculated: `current_price - previous_close` | |
| `change_percent` | Calculated: `(change / previous_close) * 100` | |
| `previous_close` | `meta.previousClose` (preferred) OR derived | Prefer API value over calculation |
| `week_high_52` | `summaryDetail.fiftyTwoWeekHigh.raw` | |
| `week_low_52` | `summaryDetail.fiftyTwoWeekLow.raw` | |
| `dividend_rate` | `summaryDetail.dividendRate.raw` OR `financialData.trailingAnnualDividendRate` | |
| `ex_dividend_date` | `summaryDetail.exDividendDate.raw` | Epoch → YYYY-MM-DD |
| `dividend_date` | `summaryDetail.dividendDate.raw` | Epoch → YYYY-MM-DD |
| `payout_ratio` | `summaryDetail.payoutRatio.raw` OR `defaultKeyStatistics.payoutRatio.raw` | |
| `book_value` | `defaultKeyStatistics.bookValue.raw` OR `financialData.bookValue.raw` | |
| `price_to_book` | `defaultKeyStatistics.priceToBook.raw` | |
| `beta` | `defaultKeyStatistics.beta.raw` | |
| `roe` | `financialData.returnOnEquity.raw` OR `defaultKeyStatistics.roe.raw` | |
| `profit_margin` | `defaultKeyStatistics.profitMargins.raw` OR `financialData.profitMargins.raw` | |
| `operating_margin` | `financialData.operatingMargins.raw` OR `defaultKeyStatistics.operatingMargins.raw` | |
| `debt_to_equity` | `financialData.debtToEquity.raw` OR `defaultKeyStatistics.debtToEquity.raw` | |
| `current_ratio` | `financialData.currentRatio.raw` | |
| `revenue_growth` | `financialData.revenueGrowth.raw` | |
| `earnings_growth` | `financialData.earningsGrowth.raw` | |

## Data Scaling Conventions

### Dividend Yield
- **Storage**: Raw decimal form (e.g., `0.0345` for 3.45%)
- **Frontend Display**: Multiply by 100 for percentage display
- **Source**: `summaryDetail.dividendYield.raw` OR `summaryDetail.trailingAnnualDividendYield.raw`

### Financial Ratios
- **PE Ratio**: Direct value (e.g., `15.2`)
- **Profit Margins**: Decimal form (e.g., `0.15` for 15%)
- **ROE**: Decimal form (e.g., `0.12` for 12%)

### Date Conversion
- **Input**: Unix epoch seconds from Yahoo Finance
- **Conversion**: `new Date(epoch * 1000).toISOString().slice(0, 10)`
- **Output**: `YYYY-MM-DD` format for PostgreSQL date fields

## Fallback Policy

### When Yahoo Finance Data is Missing
1. **No Fabrication**: Store `null` for missing values
2. **is_estimated Flag**: Set to `false` (only `true` for explicitly fabricated values)
3. **Fallback Data**: Only when neither chart nor summary provide basic price data

### Error Handling
- **Retry Logic**: 1 retry for HTTP status codes 429, 500, 502, 503
- **Exponential Backoff**: 300ms * 2 for retry delay
- **Complete Failure**: Record `success=false`, all metrics `null`, `is_estimated=false`

## Sector Mapping
1. **Primary**: Use `summaryProfile.sector` if available
2. **Fallback**: Use existing `mapSector()` logic for Thai stocks
3. **Default**: Store `null` if unable to determine

## Response Format

### Live Data Response
```json
{
  "symbol": "PTT.BK",
  "company_name": "PTT Public Company Limited",
  "current_price": 35.50,
  "previous_close": 35.25,
  "change": 0.25,
  "change_percent": 0.71,
  "is_estimated": false,
  "source": "live",
  "last_updated": "2025-08-12T02:30:00Z"
}
```

### Fallback Data Response
```json
{
  "symbol": "PTT.BK",
  "company_name": "PTT.BK",
  "current_price": null,
  "previous_close": null,
  "change": null,
  "change_percent": null,
  "is_estimated": false,
  "source": "fallback",
  "last_updated": "2025-08-12T02:30:00Z"
}
```

## Logging Levels

### LOG_LEVEL=debug
- Detailed Yahoo Finance API responses
- Intermediate calculation steps
- Retry attempts and backoff timing

### Default (Minimal)
- One line per symbol: status (live/fallback) + key metrics
- Error summaries only
- Final batch results