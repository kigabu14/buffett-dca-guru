# Price Updates with Yahoo Finance

This document describes how to set up and use the automatic price fetching feature that integrates with Yahoo Finance to update stock prices in the database.

## Overview

The system automatically fetches current market data from Yahoo Finance and updates the `stock_investments` table with:
- Current price
- Previous close price
- Currency
- Yahoo symbol mapping
- Current dividend yield
- Last fetched timestamp

## Database Schema

The following columns have been added to the `stock_investments` table:

- `previous_close` (NUMERIC) - Previous day's closing price
- `currency` (TEXT) - Currency of the stock (e.g., USD, THB, JPY)
- `yahoo_symbol` (TEXT) - Yahoo Finance symbol format
- `price_last_fetched_at` (TIMESTAMPTZ) - When prices were last updated
- `current_dividend_yield` (NUMERIC) - Current dividend yield percentage

## Yahoo Symbol Mapping

The system automatically maps internal symbols to Yahoo Finance format based on market:

- **TH (Thailand)**: `SYMBOL.BK` (e.g., PTT → PTT.BK)
- **JP (Japan)**: `SYMBOL.T` (e.g., 7203 → 7203.T)
- **US (United States)**: `SYMBOL` (no suffix, e.g., AAPL)
- **Default**: `SYMBOL` (no suffix)

This mapping is handled automatically by a database trigger when inserting or updating stock investments.

## Supabase Edge Function

### Deployment

Deploy the function using the Supabase CLI:

```bash
supabase functions deploy refresh-prices
```

### Environment Variables

Ensure these environment variables are set in your Supabase project:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

### Usage

#### Manual Invocation

Update prices for all users (limited to 1000 investments per run):

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/refresh-prices" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Update prices for specific user only:

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/refresh-prices?user_id=USER_UUID" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Response Format

```json
{
  "message": "Price refresh completed",
  "processed": 150,
  "updated": 145,
  "unique_symbols": 75
}
```

### Scheduling

For automated price updates, set up a scheduled task (recommended every 30 minutes during market hours):

#### Using GitHub Actions (if hosted on GitHub)

Create `.github/workflows/refresh-prices.yml`:

```yaml
name: Refresh Stock Prices
on:
  schedule:
    - cron: '*/30 9-16 * * 1-5'  # Every 30 min, 9 AM - 4 PM, weekdays
  workflow_dispatch:  # Allow manual trigger

jobs:
  refresh-prices:
    runs-on: ubuntu-latest
    steps:
      - name: Call refresh-prices function
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/refresh-prices" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

#### Using Cron Job

Set up a cron job on your server:

```bash
# Edit crontab
crontab -e

# Add this line for every 30 minutes during market hours (9 AM - 4 PM, weekdays)
*/30 9-16 * * 1-5 curl -X POST "https://your-project.supabase.co/functions/v1/refresh-prices" -H "Authorization: Bearer YOUR_ANON_KEY" -H "Content-Type: application/json"
```

#### Using Supabase Cron (if available)

```sql
-- Schedule function to run every 30 minutes
SELECT cron.schedule(
  'refresh-stock-prices',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/refresh-prices',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
```

## Rate Limiting and Best Practices

- The function processes symbols in batches of 50 to avoid overwhelming Yahoo Finance API
- Small delays (200ms) between batches to be respectful to the service
- Limited to 1000 investments per function call to prevent timeouts
- Uses service role key for database access (never expose this key)
- Includes proper error handling and logging

## Error Handling

The function includes comprehensive error handling:
- Continues processing even if some symbols fail
- Logs warnings for symbols without quotes
- Returns detailed status information
- Uses CORS headers for browser compatibility

## Migration Notes

⚠️ **Important**: Do not edit existing migration files that have already been applied to production. The price fetching feature has been added through a new migration file: `20250811034823_54e162de-651a-4128-96ef-9bc4b113bc8c.sql`

This preserves the existing duplicate investment logic while adding the new functionality.

## Testing

Test the function locally or in staging before deploying to production:

```bash
# Test with a specific user
curl -X POST "https://your-staging-project.supabase.co/functions/v1/refresh-prices?user_id=test-user-id" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Monitor the function logs in the Supabase dashboard to ensure it's working correctly.