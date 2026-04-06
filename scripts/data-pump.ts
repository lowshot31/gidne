// scripts/data-pump.ts
import { fetchQuotes } from '../src/lib/yahoo-finance';
import { buildSectorData } from '../src/lib/indicators';
import { calculateMarketPulse } from '../src/lib/market-pulse';
import {
  getAllTickers,
  TICKER_STRIP,
  MACRO_TICKERS,
  INDICES,
  isUSMarketOpen,
  getPollingInterval,
} from '../src/lib/tickers';
import { Redis } from '@upstash/redis';
import type { MarketDataResponse, TickerQuote, MacroData } from '../src/lib/types';

// Load .env manually for standalone script execution, or use Node 20+ --env-file
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function pumpData() {
  console.log(`[Pump] Starting data gathering cycle at ${new Date().toISOString()}`);
  
  try {
    const allTickers = getAllTickers();
    const quotes = await fetchQuotes(allTickers);

    const tickerStrip: TickerQuote[] = TICKER_STRIP.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    const sectors = buildSectorData(quotes);

    const macro: MacroData[] = MACRO_TICKERS.map(t => {
      const q = quotes.get(t.ticker);
      return {
        ticker: t.ticker,
        name: t.name,
        category: t.category,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
      };
    });

    const indices: TickerQuote[] = INDICES.map(t => {
      const q = quotes.get(t.ticker);
      return {
        symbol: t.ticker,
        name: t.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        previousClose: q?.previousClose ?? 0,
      };
    });

    const vixQuote = quotes.get('^VIX') ?? undefined;
    const marketPulse = calculateMarketPulse({ sectors, vixQuote });

    const response: MarketDataResponse = {
      tickerStrip,
      sectors,
      marketPulse,
      macro,
      indices,
      meta: {
        isMarketOpen: isUSMarketOpen(),
        lastUpdated: new Date().toISOString(),
        pollingInterval: getPollingInterval(),
      },
    };

    // Save to Redis! TTL 20 seconds
    const jsonStr = JSON.stringify(response);
    await redis.set('gidne_market_data', jsonStr, { ex: 20 });
    console.log(`[Pump] Success! Uploaded ${jsonStr.length} characters to Redis.`);
    
  } catch (error) {
    console.error('[Pump] Failed to gather or upload data:', error);
  }
}

// Start infinite loop
async function main() {
  console.log('[Pump] Data Pump Bot initialized.');
  while (true) {
    await pumpData();
    // sleep
    const delay = getPollingInterval(); // 5s during market open, 60s otherwise
    console.log(`[Pump] Waiting ${delay / 1000}s until next cycle...`);
    await new Promise(r => setTimeout(r, delay));
  }
}

main();
